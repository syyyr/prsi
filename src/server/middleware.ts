import express from "express";
import lowDb from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import path from "path";
import ws from "express-ws";
import WebSocket from "ws";
import Prsi from "../server/backend";
import {isPlayerRegistration, isPlayerUnregistration, isPlayerInput, ErrorResponse, FrontendState, isStartGame, FrontendStats, ErrorCode, BadStatus, PlayerRegistration} from "../common/communication";
import {ActionType, Status, PlayerAction} from "../common/types";

// FIXME: get rid of this
class impl_Stats {
    acquiredPts: number = 0;
    gamesPlayed: number = 0;
}

class Stats {
    current: impl_Stats = new impl_Stats();
    last: impl_Stats = new impl_Stats();
}

const updateStats = (stats: Stats, acquiredPts: number) => {
    stats.last = {...stats.current};
    stats.current.acquiredPts += acquiredPts;
    stats.current.gamesPlayed++;
};

const rollbackStats = (stats: Stats) => {
    stats.current = {...stats.last};
};

let prsiLogger: (msg: string, id?: number | string) => void;
const prsi = new Prsi();

const statsAccess = lowDb(new FileSync("stats.json"));
statsAccess.defaults({stats: {}}).write();
const stats: {[key in string]: Stats} = statsAccess.get("stats").value();
setInterval(() => statsAccess.set("stats", stats).write(), 10000);

interface SocketInfo {
    ws: WebSocket;
    name?: string;
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

const buildFrontendStateFor = (player?: string): FrontendState => {
    const state = prsi.state();
    const playerInfo: {[key in string]: {cards?: number, place?: number}} = {};
    state?.players.forEach(
        (playerState) => playerInfo[playerState.name] = playerState.place !== null ? {place: playerState.place} : {cards: state.hands.get(playerState.name)!.length}
    );
    const players = prsi.getPlayers();
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

const sendEveryone = (what?: PlayerRegistration) => {
    Object.entries(openSockets).forEach((([id, socketInfo]) => {
        if (socketInfo.ws.readyState === WebSocket.OPEN) {
            const toSend = typeof what !== "undefined" ? what :
                buildFrontendStateFor(socketInfo.name);
            socketInfo.ws.send(JSON.stringify(toSend));
        } else {
            prsiLogger("updateEveryone: Socket not OPEN. Unregistering it from the game.", id);
            if (typeof socketInfo.name !== "undefined") {
                prsi.unregisterPlayer(socketInfo.name);
                socketInfo.name = undefined;
            }
        }
    }));
};

const sendOne = (id: number, what?: BadStatus) => {
    if (openSockets[id].ws.readyState === WebSocket.OPEN) {
        const toSend = typeof what !== "undefined" ? what :
            buildFrontendStateFor(openSockets[id].name);
        openSockets[id].ws.send(JSON.stringify(toSend));
    } else {
        prsiLogger("updateOne: Socket not OPEN. Unregistering it from the game.", id);
        const name = openSockets[id].name;
        if (typeof name !== "undefined") {
            prsi.unregisterPlayer(name);
            openSockets[id].name = undefined;
        }
    }
};

const sendBadStatus = (id: number, status: Status) => {
    sendOne(id, new BadStatus(status));
};

const sendError = (id: number, error: ErrorResponse) => {
    if (openSockets[id].ws.readyState === WebSocket.OPEN) {
        openSockets[id].ws.send(JSON.stringify(error));
    } else {
        prsiLogger("sendError: Socket not OPEN. Unregistering it from the game.", id);
        const name = openSockets[id].name;
        if (typeof name !== "undefined") {
            prsi.unregisterPlayer(name);
            openSockets[id].name = undefined;
        }
    }
};

const processMessage = (id: number, message: string): void => {
    let parsed: any;

    try {
        parsed = JSON.parse(message);
    } catch (err) {
        sendError(id, new ErrorResponse("Invalid request."));
        return;
    }

    if (isPlayerRegistration(parsed)) {
        if (Object.entries(openSockets).some(([_, socketInfo]) => socketInfo.name === parsed.registerPlayer)) {
            prsiLogger(`"${parsed.registerPlayer}" already belongs to someone else.`, id);
            sendError(id, new ErrorResponse("Someone else owns this username.", ErrorCode.NameAlreadyUsed));
            return;
        }

        const socket = openSockets[id];
        if (typeof socket === "undefined") {
            prsiLogger("Tried to assign a name, but this WebSocket doesn't exist in openSockets.", id);
            return;
        }
        socket.name = parsed.registerPlayer;
        prsi.registerPlayer(parsed.registerPlayer);
        prsiLogger(`Registered "${parsed.registerPlayer}".`, id);
        if (typeof stats[parsed.registerPlayer] === "undefined") {
            stats[parsed.registerPlayer] = new Stats();
        }
        sendEveryone(parsed);
        return;
    }

    if (isPlayerUnregistration(parsed)) {
        const socket = openSockets[id];
        if (typeof socket === "undefined") {
            prsiLogger(`Tried to unregister "${parsed.unregisterPlayer}", but this WebSocket doesn't exist in openSockets.`, id);
            return;
        }

        if (typeof socket.name === "undefined") {
            prsiLogger(`Tried to unregister "${parsed.unregisterPlayer}" but this WebSocket doesn't have any name assigned.`, id);
            return;
        }

        if (socket.name !== parsed.unregisterPlayer) {
            prsiLogger(`Tried to unregister "${parsed.unregisterPlayer}" but this WebSocket has the name "${socket.name}" assigned.`, id);
            return;
        }

        prsi.unregisterPlayer(parsed.unregisterPlayer);
        socket.name = undefined;
        prsiLogger(`Unregistered "${parsed.unregisterPlayer}".`, id);
        sendEveryone();
        return;
    }

    if (isPlayerInput(parsed)) {
        const name = openSockets[id].name;
        if (typeof name === "undefined") {
            prsiLogger("Got input, but this socket doesn't have a name assigned.", id);
            return;
        }
        const status = prsi.resolveAction(new PlayerAction(parsed.playType, name, parsed.playDetails));
        if (status === Status.Ok) {
            const state = prsi.state();
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
                const acquiredPts = 1 - (state.players.find((player) => player.name === state.lastPlay?.who)!.place! - 1) / state.players.length;
                updateStats(prevStats, acquiredPts);
                if (state.wantedAction === ActionType.Shuffle) { // If shuffle, then the game is over - we have to recalculate last guy's stats
                    const prevStats = stats[state.whoseTurn];
                    updateStats(prevStats, 0);
                }
            }
            sendEveryone();
        } else {
            sendBadStatus(id, status);
        }
        return;
    }

    if (isStartGame(parsed)) {
        if (typeof openSockets[id].name === "undefined") {
            sendError(id, new ErrorResponse("Nemůžeš začít hru, když nehraješ? (jax to udělal?)."));
            prsiLogger("Tried to start the game, even though, no name is assigned", id);
        }
        prsi.newGame();
        sendEveryone();
        return;
    }

    sendError(id, new ErrorResponse("Invalid request."));
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
            if (typeof closed.name !== "undefined") {
                prsi.unregisterPlayer(closed.name);
                prsiLogger(`Unregistered "${closed.name}".`, id);
            }

            prsiLogger("Client disconnected.", id);

            delete openSockets[id];
            sendEveryone();
        });
    });


    prsiLogger("Prsi initialized.");
    return wsEnabledRouter;
};

export default createPrsi;
