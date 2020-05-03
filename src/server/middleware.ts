import express from "express";
import lowDb from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import path from "path";
import ws from "express-ws";
import WebSocket from "ws";
import Prsi from "../server/backend";
import {isPlayerRegistration, isPlayerUnregistration, isPlayerInput, ErrorResponse, FrontendState, isStartGame, ErrorCode, BadStatus, Rooms, isJoinRoom, FrontendConnected} from "../common/communication";
import {ActionType, Status, PlayerAction} from "../common/types";

// FIXME: get rid of this
class impl_Stats {
    acquiredPts: number[] = [];
}

class Stats {
    current: impl_Stats = new impl_Stats();
    last: impl_Stats = new impl_Stats();
}

const updateStats = (stats: Stats, acquiredPts: number) => {
    stats.last = {...stats.current};
    stats.current.acquiredPts.push(acquiredPts);
};

const rollbackStats = (stats: Stats) => {
    stats.current = {...stats.last};
};

let prsiLogger: (msg: string, id?: number | string) => void;
const rooms: {[key in string]: Prsi} = {
    "Pilsner Urquell": new Prsi(),
    "Radegast": new Prsi()
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
    const state = rooms[room].state();
    const playerInfo: {[key in string]: {cards?: number, place?: number}} = {};
    state?.players.forEach(
        (playerState) => playerInfo[playerState.name] = playerState.place !== null ? {place: playerState.place} : {cards: state.hands.get(playerState.name)!.length}
    );
    const players = rooms[room].getPlayers();
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

const sendEveryone = (room: string, what?: FrontendConnected) => {
    Object.entries(openSockets).forEach((([id, socketInfo]) => {
        if (socketInfo.ws.readyState === WebSocket.OPEN) {
            const toSend = typeof socketInfo.room === "undefined" ? buildRoomInfo() :
                typeof what !== "undefined" ? what :
                buildFrontendStateFor(room, socketInfo.room.nickName);
            socketInfo.ws.send(JSON.stringify(toSend));
        } else {
            prsiLogger("updateEveryone: Socket not OPEN. Unregistering it from the game.", id);
            if (typeof socketInfo.room?.nickName !== "undefined") {
                rooms[room].unregisterPlayer(socketInfo.room.nickName);
                socketInfo.room = undefined;
            }
        }
    }));
};

const buildRoomInfo = (): Rooms => {
    return {
        rooms: Object.assign({}, ...Object.entries(rooms).map(([name, prsi]) => ({[name]: prsi.getPlayers()})))
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
            rooms[room.roomName].unregisterPlayer(name);
            openSockets[id].room = undefined;
        }
    }
};

const sendBadStatus = (id: number, status: Status) => {
    sendOne(id, new BadStatus(status));
};

const processMessage = (id: number, message: string): void => {
    let parsed: any;

    try {
        parsed = JSON.parse(message);
    } catch (err) {
        sendOne(id, new ErrorResponse("Invalid request."));
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
        rooms[socket.room.roomName].registerPlayer(parsed.registerPlayer);
        prsiLogger(`Registered "${parsed.registerPlayer}".`, id);
        if (typeof stats[parsed.registerPlayer] === "undefined") {
            stats[parsed.registerPlayer] = new Stats();
        }
        sendEveryone(socket.room.roomName, {
            connected: parsed.registerPlayer,
            stats: Object.assign({}, ...rooms[socket.room.roomName].getPlayers().map(player => // FIXME: refactor stat building to a function
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

        rooms[socket.room.roomName].unregisterPlayer(parsed.unregisterPlayer);
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

        const status = rooms[room.roomName].resolveAction(new PlayerAction(parsed.playType, room.nickName, parsed.playDetails));
        if (status === Status.Ok) {
            const state = rooms[room.roomName].state();
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
        rooms[room.roomName].newGame();
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
                prsiLogger(err, id);
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
                rooms[closed.room.roomName].unregisterPlayer(closed.room.nickName);
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
