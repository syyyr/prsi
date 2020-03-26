import express from "express";
import path from "path";
import ws from "express-ws";
import Prsi, { PlayerAction } from "./backend";
import {isPlayerRegistration, isPlayerInput, ErrorResponse, FrontendState, isStartGame, CardCounts} from "./communication";
import {Status} from "./types";

let prsiLogger: (msg: string, ws?: any) => void;
const prsi = new Prsi();

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
    return {
        players: prsi.players(),
        gameStarted: typeof state !== "undefined" ? "yes" : "no",
        gameInfo: typeof state !== "undefined" ? {
            wantedAction: state.wantedAction,
            status: state.status,
            who: state.whoseTurn,
            topCard: state.playedCards[state.playedCards.length - 1],
            hand: state.hands.get(player)!,
            cardCount: (() => {const res: CardCounts = {}; state.hands.forEach((cards, name) => res[name] = cards.length); return res;})()
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
        updateEveryone();
        return;
    }

    if (isPlayerInput(parsed)) {
        prsi.resolveAction(new PlayerAction(parsed.playType, ws.__private_name, parsed.playDetails));
        if (prsi.state()!.status === Status.Ok) {
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
