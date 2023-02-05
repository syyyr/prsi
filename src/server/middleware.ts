import express from "express";
import lowDb from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import path from "path";
import ws from "express-ws";
import WebSocket from "ws";
import Prsi from "../server/backend";
import {KickState, VoteKick, isPlayerRegistration, isPlayerUnregistration, isPlayerInput, ErrorResponse, FrontendState, isStartGame, ErrorCode, BadStatus, Rooms, isJoinRoom, FrontendConnected, isVoteKick, isVote, KickResolution, KickResolutionEnum} from "../common/communication";
import {ActionType, Status, PlayerAction} from "../common/types";

class Stats {
    current: number[] = [];
    last: number[] = [];
}

const updateStats = (stats: Stats, acquiredPts: number) => {
    stats.last = [...stats.current];
    stats.current.push(acquiredPts);
    if (stats.current.length > 50) {
        stats.current.shift();
    }
};

const rollbackStats = (stats: Stats) => {
    stats.current = [...stats.last];
};

class VoteKickStatus {
    name: string;
    status: {[key in string]: boolean};
    callback: (shouldKick: boolean) => void; // FIXME: convert to a promise

    timeout: NodeJS.Timeout;
    constructor(initiator: string, name: string, voters: string[], callback: (shouldKick: boolean) => void) {
        this.name = name;
        this.callback = callback;
        this.status = {};
        Object.assign(this.status, ...voters.map(player => ({[player]: false})));
        this.status[initiator] = true;
        this.timeout = global.setTimeout(() => {
            const entries = Object.values(this.status);
            this.callback(entries.filter((value) => value === true).length / entries.length > 0.5);
        }, 30000);
    }
};

let prsiLogger: (msg: string, id?: number | string) => void;
const rooms: {[key in string]: {prsi: Prsi, voteKick?: VoteKickStatus}} = {
    "Pilsner Urquell": {
        prsi: new Prsi()
    },
    "Radegast":{
        prsi: new Prsi()
    }
};

const statsAccess = lowDb(new FileSync("stats.json"));
statsAccess.defaults({stats: {}}).write();
const stats: {[key in string]: Stats} = statsAccess.get("stats").value();
setInterval(() => statsAccess.set("stats", stats).write(), 10000);

interface SocketInfo {
    ws: WebSocket;
    room?: {
        roomName: string;
        nickName?: string;
    }
}

const openSockets: {
    [key in number]: SocketInfo;
} = {};

const idGen = (function*(): Generator {
    let id = 1;
    while (true) {
        yield id++;
    }
}());

const buildFrontendStateFor = (room: string, player?: string): FrontendState => {
    const state = rooms[room].prsi.state();
    const playerInfo: {[key in string]: {cards?: number, place?: number}} = {};
    state?.players.forEach(
        (playerState) => playerInfo[playerState.name] = playerState.place !== null ? {place: playerState.place} : {cards: state.hands.get(playerState.name)!.length}
    );
    const players = rooms[room].prsi.getPlayers();
    return {
        players,
        gameStarted: typeof state !== "undefined" ? "yes" : "no",
        stats: Object.assign({}, ...players.map(player =>
            ({[player]: stats[player].current}))),
        gameInfo: typeof state !== "undefined" ? {
            wantedAction: state.wantedAction,
            who: state.whoseTurn,
            topCards: state.playedCards.slice(state.playedCards.length - Math.min(state.playedCards.length, 3)),
            hand: typeof player !== "undefined" ? state.hands.get(player) : undefined,
            playerInfo,
            lastPlay: state.lastPlay,
            loser: state.loser
        } : undefined
    };
};

const sendEveryone = (room: string, what?: FrontendConnected | KickResolution | KickState) => {
    Object.entries(openSockets).forEach((([id, socketInfo]) => {
        if (socketInfo.ws.readyState === WebSocket.OPEN) {
            const toSend = typeof socketInfo.room === "undefined" ? buildRoomInfo() :
                typeof what !== "undefined" ? what :
                buildFrontendStateFor(room, socketInfo.room.nickName);
            socketInfo.ws.send(JSON.stringify(toSend));
        } else {
            prsiLogger("updateEveryone: Socket not OPEN. Unregistering it from the game.", id);
            if (typeof socketInfo.room?.nickName !== "undefined") {
                rooms[room].prsi.unregisterPlayer(socketInfo.room.nickName);
                socketInfo.room = undefined;
            }
        }
    }));
};

const buildRoomInfo = (): Rooms => {
    return {
        rooms: Object.assign({}, ...Object.entries(rooms).map(([name, prsi]) => ({[name]: prsi.prsi.getPlayers()})))
    };
};

const sendOne = (id: number, what?: BadStatus | ErrorResponse) => {
    const room = openSockets[id].room;
    if (openSockets[id].ws.readyState === WebSocket.OPEN) {
        const toSend = typeof room === "undefined" ? buildRoomInfo() :
            typeof what !== "undefined" ? what :
            buildFrontendStateFor(room.roomName, room.nickName);
        openSockets[id].ws.send(JSON.stringify(toSend));
    } else {
        prsiLogger("updateOne: Socket not OPEN. Unregistering it from the game.", id);
        if (typeof room?.nickName !== "undefined") {
            rooms[room.roomName].prsi.unregisterPlayer(room.nickName);
            openSockets[id].room = undefined;
        }
    }
};

const sendBadStatus = (id: number, status: Status) => {
    sendOne(id, new BadStatus(status));
};

// FIXME: refactor into more functions
// FIXME: prioritize some checks over others (e. g. put isPlayerInput first)
const processMessage = (id: number, message: string): void => {
    let parsed: any;

    try {
        parsed = JSON.parse(message);
    } catch (err) {
        sendOne(id, new ErrorResponse("Invalid request."));
        return;
    }

    if (isVoteKick(parsed)) {
        // FIXME: move this declaration above - it's used in all of the if-statements
        const socket = openSockets[id];
        // FIXME: move this check above too
        if (typeof socket === "undefined") {
            prsiLogger("Tried to kick a player, but this WebSocket doesn't exist in openSockets.", id);
            return;
        }

        if (typeof socket.room === "undefined") {
            prsiLogger("Tried to kick a player, but this WebSocket isn't inside any room.", id);
            sendOne(id, new ErrorResponse("Invalid request.", ErrorCode.CantKick));
            return;
        }

        if (typeof socket.room.nickName === "undefined") {
            prsiLogger("Tried to kick a player, but this WebSocket isn't playing.", id);
            sendOne(id, new ErrorResponse("Invalid request.", ErrorCode.CantKick));
            return;
        }

        const room = rooms[socket.room.roomName];

        if (typeof room.voteKick !== "undefined") {
            prsiLogger("Tried to kick a player, but a VoteKick is already in progrss.", id);
            sendOne(id, new ErrorResponse("Invalid request.", ErrorCode.CantKick));
            return;
        }

        const voters = room.prsi.getPlayers();
        room.voteKick = new VoteKickStatus(socket.room.nickName, parsed.voteKick, voters, (shouldKick: boolean) => {
            if (shouldKick) {
                prsiLogger(`Vote kick successful. Kicking ${parsed.voteKick} from ${socket.room?.roomName}.`)
                room.prsi.unregisterPlayer((parsed as VoteKick).voteKick);
                Object.values(openSockets).find((socket) => socket.room?.nickName === parsed.voteKick)!.room!.nickName = undefined;
                sendEveryone(socket.room!.roomName);
            } else {
                prsiLogger(`Vote kick unsuccessful. ${parsed.voteKick} won't be kicked.`);
            }

            room.voteKick = undefined;
            sendEveryone(socket.room!.roomName, new KickResolution(shouldKick ? KickResolutionEnum.Kicked : KickResolutionEnum.NotEnoughVotes));
        });

        prsiLogger(`Started a vote kick on ${parsed.voteKick}.`, id);
        sendEveryone(socket.room.roomName, new KickState(parsed.voteKick, room.voteKick.status));
        return;
    }

    if (isVote(parsed)) {
        const socket = openSockets[id];
        if (typeof socket === "undefined") {
            prsiLogger("Tried to vote on an ongoing VoteKick, but this WebSocket doesn't exist in openSockets.", id);
            return;
        }

        if (typeof socket.room === "undefined") {
            prsiLogger("Tried to vote on an ongoing VoteKick, but this WebSocket isn't inside any room.", id);
            sendOne(id, new ErrorResponse("Invalid request.", ErrorCode.CantKick));
            return;
        }

        if (typeof socket.room.nickName === "undefined") {
            prsiLogger("Tried to vote on an ongoing VoteKick, but this WebSocket isn't playing.", id);
            sendOne(id, new ErrorResponse("Invalid request.", ErrorCode.CantKick));
            return;
        }

        const room = rooms[socket.room.roomName];

        if (typeof room.voteKick === "undefined") {
            prsiLogger("Tried to vote on an ongoing VoteKick, but no VoteKick in progress.", id);
            sendOne(id, new ErrorResponse("Invalid request.", ErrorCode.NoKickInProgress));
            return;
        }

        if (typeof room.voteKick.status[socket.room.nickName] === "undefined") {
            prsiLogger("Tried to vote on an ongoing VoteKick, but this player cannot vote.", id);
            sendOne(id, new ErrorResponse("Invalid request.", ErrorCode.CantKick));
            return;
        }

        room.voteKick.status[socket.room.nickName] = parsed.vote;
        sendEveryone(socket.room.roomName, new KickState(room.voteKick.name, room.voteKick.status));
        return;
    }

    if (isJoinRoom(parsed)) {
        const socket = openSockets[id];
        if (typeof socket === "undefined") {
            prsiLogger("Tried to join a room, but this WebSocket doesn't exist in openSockets.", id);
            return;
        }

        if (typeof socket.room !== "undefined") {
            prsiLogger("Tried to join a room, but this WebSocket already has a room assigned.", id);
            return;
        }

        socket.room = {
            roomName: parsed.joinRoom
        };
        prsiLogger(`Joined "${parsed.joinRoom}".`, id);
        sendOne(id);
        return;
    }

    if (isPlayerRegistration(parsed)) {
        if (Object.entries(openSockets).some(([_, socketInfo]) => socketInfo.room?.nickName === parsed.registerPlayer)) {
            prsiLogger(`"${parsed.registerPlayer}" already belongs to someone else.`, id);
            sendOne(id, new ErrorResponse("Someone else owns this username.", ErrorCode.NameAlreadyUsed));
            return;
        }

        const socket = openSockets[id];
        if (typeof socket === "undefined") {
            prsiLogger("Tried to assign a name, but this WebSocket doesn't exist in openSockets.", id);
            return;
        }
        if (typeof socket.room === "undefined") {
            prsiLogger("Tried to assign a name, but this WebSocket isn't inside any rooms.", id);
            return;
        }
        socket.room.nickName = parsed.registerPlayer;
        rooms[socket.room.roomName].prsi.registerPlayer(parsed.registerPlayer);
        prsiLogger(`Registered "${parsed.registerPlayer}".`, id);
        if (typeof stats[parsed.registerPlayer] === "undefined") {
            stats[parsed.registerPlayer] = new Stats();
        }
        sendEveryone(socket.room.roomName, {
            connected: parsed.registerPlayer,
            stats: Object.assign({}, ...rooms[socket.room.roomName].prsi.getPlayers().map(player => // FIXME: refactor stat building to a function
                ({[player]: stats[player].current}))),
        });
        return;
    }

    if (isPlayerUnregistration(parsed)) {
        const socket = openSockets[id];
        if (typeof socket === "undefined") {
            prsiLogger(`Tried to unregister "${parsed.unregisterPlayer}", but this WebSocket doesn't exist in openSockets.`, id);
            return;
        }

        if (typeof socket.room === "undefined") {
            prsiLogger(`Tried to unregister "${parsed.unregisterPlayer}" but this isn't inside any rooms.`, id);
            return;
        }

        if (typeof socket.room.nickName === "undefined") {
            prsiLogger(`Tried to unregister "${parsed.unregisterPlayer}" but this WebSocket doesn't have any name assigned.`, id);
            return;
        }

        if (socket.room.nickName !== parsed.unregisterPlayer) {
            prsiLogger(`Tried to unregister "${parsed.unregisterPlayer}" but this WebSocket has the name "${socket.room.nickName}" assigned.`, id);
            return;
        }

        rooms[socket.room.roomName].prsi.unregisterPlayer(parsed.unregisterPlayer);
        socket.room.nickName = undefined;
        prsiLogger(`Unregistered "${parsed.unregisterPlayer}".`, id);
        sendEveryone(socket.room.roomName);
        return;
    }

    if (isPlayerInput(parsed)) {
        const room = openSockets[id].room;
        if (typeof room === "undefined") {
            prsiLogger("Got input, but this socket doesn't have a room assigned.", id);
            return;
        }

        if (typeof room.nickName === "undefined") {
            prsiLogger("Got input, but this socket doesn't have a name assigned.", id);
            return;
        }

        const status = rooms[room.roomName].prsi.resolveAction(new PlayerAction(parsed.playType, room.nickName, parsed.playDetails));
        if (status === Status.Ok) {
            const state = rooms[room.roomName].prsi.state();
            if (typeof state?.lastPlay?.playDetails?.returned !== "undefined") {
                rollbackStats(stats[state?.lastPlay?.playDetails?.returned]);
                // Last guy returned another guy, when he was already supposed
                // to be shuffling, his stats were already inceremented.  We
                // need to rollback his stats too.
                if (state.wantedAction === ActionType.Shuffle) {
                    rollbackStats(stats[state.lastPlay.who]);
                }
            }
            if (state?.lastPlay?.didWin) {
                const prevStats = stats[state.lastPlay.who];
                const acquiredPts = 1 - (state.players.find((player) => player.name === state.lastPlay?.who)!.place! - 1) / (state.players.length - 1);
                updateStats(prevStats, acquiredPts);
                if (state.wantedAction === ActionType.Shuffle) { // If shuffle, then the game is over - we have to recalculate last guy's stats
                    const prevStats = stats[state.whoseTurn];
                    updateStats(prevStats, 0);
                }
            }
            sendEveryone(room.roomName);
        } else {
            sendBadStatus(id, status);
        }
        return;
    }

    if (isStartGame(parsed)) {
        const room = openSockets[id].room;
        if (typeof room === "undefined") {
            prsiLogger("Tried to start the game, but this WebSocket isn't inside any room.", id);
            return;
        }

        if (typeof room.nickName === "undefined") {
            sendOne(id, new ErrorResponse("Nemůžeš začít hru, když nehraješ? (jax to udělal?)."));
            prsiLogger("Tried to start the game, even though, no name is assigned", id);
            return;
        }
        rooms[room.roomName].prsi.newGame();
        sendEveryone(room.roomName);
        return;
    }

    sendOne(id, new ErrorResponse("Invalid request."));
    prsiLogger("Invalid request", id);
};

const createPrsi = (wsEnabledRouter: ws.Router, prefix = "", logger = (msg: string, _res?: express.Response) => console.log(msg)) => {
    prsiLogger = (msg: string, id?: number | string) => {
        // Manually inject the ws id. I know using `any` isn't the cleanest
        // solution, but then again, the whole express-ws thing isn't very
        // clean.
        if (typeof id !== "undefined") {
            logger(msg, {
                locals: {
                    myId: `ws/${id}`
                }
            } as any);
        } else {
            logger(msg);
        }
    };

    wsEnabledRouter.use(prefix, express.static(path.join(__dirname, "../../dist"), {
        dotfiles: "ignore",
    }));

    wsEnabledRouter.use(prefix, express.static(path.join(__dirname, "../../public"), {
        dotfiles: "ignore",
    }));

    prsiLogger("Initializing prsi...");

    wsEnabledRouter.ws(prefix, (ws: WebSocket) => {
        const id = idGen.next().value;
        openSockets[id] = ({ws});
        prsiLogger("Client connected.", id);
        sendOne(id);

        ws.on("message", (message: WebSocket.Data) => {
            try {
                processMessage(id, message.toString());
            } catch (err) {
                prsiLogger("EXCEPTION WHILE HANDLING A MESSAGE:", id);
                prsiLogger(err as string, id);
            }
        });

        ws.on("close", () => {
            const closed = openSockets[id];
            if (typeof closed === "undefined") {
                prsiLogger("A socket we had no idea about closed.");
                return;
            }

            // Have to check whether the closing socket was already registered
            if (typeof closed.room?.nickName !== "undefined") {
                rooms[closed.room.roomName].prsi.unregisterPlayer(closed.room.nickName);
                prsiLogger(`Unregistered "${closed.room.nickName}".`, id);
            }

            prsiLogger("Client disconnected.", id);

            delete openSockets[id];
            if (typeof closed.room !== "undefined") {
                sendEveryone(closed.room.roomName);
            }
        });
    });


    prsiLogger("Prsi initialized.");
    return wsEnabledRouter;
};

export default createPrsi;
