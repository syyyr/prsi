import express from "express";
import lowDb from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import path from "path";
import ws from "express-ws";
import WebSocket from "ws";
import Prsi from "../server/backend";
import {isPlayerRegistration, isPlayerUnregistration, isPlayerInput, ErrorResponse, FrontendState, isStartGame, FrontendStats, ErrorCode} from "../common/communication";
import {ActionType, Status, PlayerAction, Place} from "../common/types";

class impl_Stats {
    acquiredPts: number = 0;
    possiblePts: number = 0;
    averagePts: number = 0;
    gamesPlayed: number = 0;
}

class Stats {
    current: impl_Stats = new impl_Stats();
    last: impl_Stats = new impl_Stats();
}

const updateStats = (stats: Stats, acquiredPts: number, possiblePts: number) => {
    stats.last = {...stats.current};
    stats.current.acquiredPts += acquiredPts;
    stats.current.possiblePts += possiblePts;
    stats.current.averagePts = stats.current.acquiredPts / stats.current.possiblePts;
    stats.current.gamesPlayed++;
}

const rollbackStats = (stats: Stats) => {
    stats.current = {...stats.last};
}

let prsiLogger: (msg: string, id?: number) => void;
const prsi = new Prsi();

const statsAccess = lowDb(new FileSync("stats.json"));
statsAccess.defaults({stats: {}}).write();
const stats: {[key in string]: Stats} = statsAccess.get("stats").value();
setInterval(() => statsAccess.set("stats", stats).write(), 10000);

interface SocketInfo {
    ws: WebSocket;
    name?: string;
}

const openSockets: SocketInfo[] = [];

const idGen = (function*(): Generator {
    let id = 1;
    while (true) {
        yield id++;
    }
}());

const buildFrontendStateFor = (player?: string): FrontendState => {
    const state = prsi.state();
    const playerInfo: {[key in string]: {cards?: number, place?: Place}} = {};
    state?.players.forEach(
        (playerState) => playerInfo[playerState.name] = playerState.place !== null ? {place: playerState.place} : {cards: state.hands.get(playerState.name)!.length}
    );
    return {
        players: prsi.players(),
        gameStarted: typeof state !== "undefined" ? "yes" : "no",
        stats: Object.assign({}, ...prsi.players().map(player =>
            ({[player]: new FrontendStats(stats[player].current.averagePts, stats[player].current.gamesPlayed)}))),
        gameInfo: typeof state !== "undefined" ? {
            wantedAction: state.wantedAction,
            status: state.status,
            who: state.whoseTurn,
            topCards: state.playedCards.slice(state.playedCards.length - Math.min(state.playedCards.length, 3)),
            hand: typeof player !== "undefined" ? state.hands.get(player) : undefined,
            playerInfo,
            lastPlay: state.lastPlay,
            loser: state.loser
        } : undefined
    };
};

const updateEveryone = () => {
    openSockets.forEach((socketInfo, id) => {
        if (socketInfo.ws.readyState === WebSocket.OPEN) {
            socketInfo.ws.send(JSON.stringify(buildFrontendStateFor(socketInfo.name)));
        } else {
            prsiLogger("updateEveryone: Socket not OPEN. Deleting from openSockets.", id);
            const name = openSockets[id].name;
            if (typeof name !== "undefined") {
                prsi.unregisterPlayer(name);
            }
            openSockets.splice(id, 1);
        }
    });
};

const updateOne = (id: number) => {
    if (openSockets[id].ws.readyState === WebSocket.OPEN) {
        openSockets[id].ws.send(JSON.stringify(buildFrontendStateFor(openSockets[id].name)));
    } else {
        prsiLogger("updateOne: Socket not OPEN. Deleting from openSockets.", id);
        const name = openSockets[id].name;
        if (typeof name !== "undefined") {
            prsi.unregisterPlayer(name);
        }
        openSockets.splice(id, 1);
    }
};

const sendError = (id: number, error: ErrorResponse) => {
    if (openSockets[id].ws.readyState === WebSocket.OPEN) {
        openSockets[id].ws.send(JSON.stringify(error));
    } else {
        prsiLogger("sendError: Socket not OPEN. Deleting from openSockets.", id);
        const name = openSockets[id].name;
        if (typeof name !== "undefined") {
            prsi.unregisterPlayer(name);
        }
        openSockets.splice(id, 1);
    }
}

const processMessage = (id: number, message: string): void => {
    let parsed: any;

    try {
        parsed = JSON.parse(message);
    } catch (err) {
        sendError(id, new ErrorResponse("Invalid request."));
        return;
    }

    if (isPlayerRegistration(parsed)) {
        if (openSockets.some((socketInfo) => socketInfo.name === parsed.registerPlayer)) {
            prsiLogger(`"${parsed.registerPlayer}" already belongs to someone else.`, id);
            sendError(id, new ErrorResponse("Someone else owns this username.", ErrorCode.NameAlreadyUsed));
            return;
        }

        const socket = openSockets[id];
        if (typeof socket === "undefined") {
            prsiLogger(`Tried to assign a name, but this WebSocket doesn't exist in openSockets.`, id);
            return;
        }
        socket.name = parsed.registerPlayer;
        prsi.registerPlayer(parsed.registerPlayer);
        prsiLogger(`Registered "${parsed.registerPlayer}".`, id);
        if (typeof stats[parsed.registerPlayer] === "undefined") {
            stats[parsed.registerPlayer] = new Stats();
        }
        updateEveryone();
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
        updateEveryone();
        return;
    }

    if (isPlayerInput(parsed)) {
        const name = openSockets[id].name;
        if (typeof name === "undefined") {
            prsiLogger(`Got input, but this socket doesn't have a name assigned.`, id);
            return;
        }
        prsi.resolveAction(new PlayerAction(parsed.playType, name, parsed.playDetails));
        if (prsi.state()!.status === Status.Ok) {
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
                const acquiredPts = state.players.length - state.players.find((player) => player.name === state.lastPlay?.who)!.place!;
                updateStats(prevStats, acquiredPts, state.players.length - 1);
                if (state.wantedAction === ActionType.Shuffle) { // If shuffle, then the game is over - we have to recalculate last guy's stats
                    const prevStats = stats[state.whoseTurn];
                    updateStats(prevStats, 0, state.players.length);
                }
            }
            updateEveryone();
        } else {
            updateOne(id);
        }
        return;
    }

    if (isStartGame(parsed)) {
        if (typeof openSockets[id].name === "undefined") {
            sendError(id, new ErrorResponse("Nemůžeš začít hru, když nehraješ? (jax to udělal?)."));
            prsiLogger(`Tried to start the game, even though, no name is assigned`, id);
        }
        prsi.newGame();
        updateEveryone();
        return;
    }

    sendError(id, new ErrorResponse("Invalid request."));
    prsiLogger(`Invalid request`, id);
};

const createPrsi = (wsEnabledRouter: ws.Router, prefix = "", logger = (msg: string, _req?: express.Request) => console.log(msg)) => {
    prsiLogger = (msg: string, id?: number) => {
        // Manually inject the ws id. I know using `any` isn't the cleanest
        // solution, but then again, the whole express-ws thing isn't very
        // clean.
        if (typeof id !== "undefined") {
            logger(msg, {
                session: {
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
        prsiLogger("New websocket.", id);
        updateOne(id);

        ws.on("message", (message: WebSocket.Data) => {
            processMessage(id, message.toString());
        });

        ws.on("close", () => {
            const closed = openSockets[id];
            if (typeof closed === "undefined") {
                prsiLogger("A socket we had no idea about closed.");
                return;
            }

            let name = `ws/${id}`;
            // Have to check whether the closing socket was already registered
            if (typeof closed.name !== "undefined") {
                name = closed.name;
                prsi.unregisterPlayer(name);
            }

            prsiLogger(`${name} disconnected.`, id);

            openSockets.splice(id, 1);
            updateEveryone();
        });
    });


    prsiLogger("Prsi initialized.");
    return wsEnabledRouter;
}

export default createPrsi;
