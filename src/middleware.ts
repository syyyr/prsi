import express from "express";
import lowDb from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import path from "path";
import ws from "express-ws";
import Prsi from "./backend";
import {isPlayerRegistration, isPlayerInput, ErrorResponse, FrontendState, isStartGame, FrontendStats} from "./common/communication";
import {ActionType, Status, PlayerAction, Place} from "./common/types";

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

let prsiLogger: (msg: string, ws?: any) => void;
const prsi = new Prsi();

const statsAccess = lowDb(new FileSync("stats.json"));
statsAccess.defaults({stats: {}}).write();
const stats: {[key in string]: Stats} = statsAccess.get("stats").value();
setInterval(() => statsAccess.set("stats", stats).write(), 10000);

type AugmentedSocket = (WebSocket & {
    __private_name: string
});

const openSockets: AugmentedSocket[] = [];

const idGen = (function*(): Generator {
    let id = 1;
    while (true) {
        yield id++;
    }
}());

const buildFrontendStateFor = (player: string): FrontendState => {
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
            hand: state.hands.get(player),
            playerInfo,
            lastPlay: state.lastPlay
        } : undefined
    };
};

const updateEveryone = () => {
    openSockets.forEach((socket) => socket.send(JSON.stringify(buildFrontendStateFor(socket.__private_name))));
};

const updateOne = (ws: any) => {
    ws.send(JSON.stringify(buildFrontendStateFor(ws.__private_name)));
};

const sendError = (ws: any, error: ErrorResponse) => {
    ws.send(JSON.stringify(error));
}

const processMessage = (ws: any, message: string): void => {
    let parsed: any;

    try {
        parsed = JSON.parse(message);
    } catch (err) {
        sendError(ws, new ErrorResponse("Invalid request."));
        return;
    }

    if (isPlayerRegistration(parsed)) {
        openSockets.push(ws);
        if (openSockets.some((socket) => socket.__private_name === parsed.registerPlayer)) {
            prsiLogger(`"${parsed.registerPlayer}" already belongs to someone else.`, ws);
            sendError(ws, new ErrorResponse("Someone else owns this username."));
            return;
        }

        ws.__private_name = parsed.registerPlayer;
        prsi.registerPlayer(parsed.registerPlayer);
        prsiLogger(`Registered "${parsed.registerPlayer}".`, ws);
        if (typeof stats[parsed.registerPlayer] === "undefined") {
            stats[parsed.registerPlayer] = new Stats();
        }
        updateEveryone();
        return;
    }

    if (isPlayerInput(parsed)) {
        prsi.resolveAction(new PlayerAction(parsed.playType, ws.__private_name, parsed.playDetails));
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
            updateOne(ws);
        }
        return;
    }

    if (isStartGame(parsed)) {
        prsi.newGame();
        updateEveryone();
        return;
    }

    sendError(ws, new ErrorResponse("Invalid request."));
};

const createPrsi = (wsEnabledRouter: ws.Router, prefix = "", logger = (msg: string, _req?: express.Request) => console.log(msg)) => {
    prsiLogger = (msg: string, ws?: any) => {
        // Manually inject the ws id. I know using `any` isn't the cleanest
        // solution, but then again, the whole express-ws thing isn't very
        // clean.
        if (typeof ws !== "undefined") {
            logger(msg, {
                session: {
                    myId: `ws/${ws.__private_id}`
                }
            } as any);
        } else {
            logger(msg);
        }
    };
    wsEnabledRouter.use(prefix, express.static(path.join(__dirname + "/../dist"), {
        dotfiles: "ignore",
    }));

    prsiLogger("Initializing prsi...");

    wsEnabledRouter.ws(prefix, (ws) => {
        (ws as any).__private_id = idGen.next().value;
        prsiLogger("New websocket.", ws);
        ws.on("message", (message) => {
            processMessage(ws, message.toString());
        });

        ws.on("close", () => {
            // Using Object here, because I want to compare references
            const closed = openSockets.findIndex((socket) => socket === ws as Object);
            if (closed === -1) {
                prsiLogger("A socket we had no idea about closed.");
                return;
            }

            let name = "<unknown>";
            // Have to check whether the closing socket was already registered
            if (typeof openSockets[closed].__private_name !== "undefined") {
                name = openSockets[closed].__private_name;
                prsi.unregisterPlayer(openSockets[closed].__private_name);
            }

            prsiLogger(`${name} disconnected.`, ws);

            openSockets.splice(closed, 1);
            updateEveryone();
        });
    });


    prsiLogger("Prsi initialized.");
    return wsEnabledRouter;
}

export default createPrsi;
