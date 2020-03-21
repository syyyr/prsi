import Prsi from "./prsi-backend";
import express from "express";
import path from "path";
import ws from "express-ws";
import {isPlayerRegistration, isPlayerInput, Response, ErrorResponse, FrontendState} from "./prsi-communication";

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
        topCard: state ? state.playedCards[state.playedCards.length - 1] : null,
        hand: state ? state.hands.get(player)! : null,
    };
};

const processMessage = (ws: any, message: string): Response => {
    let parsed: any;

    try {
        parsed = JSON.parse(message);
    } catch (err) {
        return new ErrorResponse("Invalid request");
    }

    if (isPlayerRegistration(parsed)) {
        openSockets.push(ws);
        if (openSockets.some((socket) => socket.__private_name === parsed.registerPlayer)) {
            prsiLogger(`"${parsed.registerPlayer}" already belongs to someone else.`, ws);
            return new ErrorResponse("Someone else owns this username.");
        }

        ws.__private_name = parsed.registerPlayer;
        prsi.registerPlayer(parsed.registerPlayer);
        prsiLogger(`Registered "${parsed.registerPlayer}".`, ws);
        return buildFrontendStateFor(parsed.registerPlayer);
    }

    if (isPlayerInput(parsed)) {
        if (parsed.name !== ws.__private_name) {
            prsiLogger(`${ws.__private_name}: tried to act as ${parsed.name}.`, ws);
            return new ErrorResponse("Someone else owns this username.");
        }

        return buildFrontendStateFor(parsed.name);
    }

    prsiLogger(`${ws.__private_name} tried to act as ${parsed.name}.`, ws);
    return new ErrorResponse("Invalid request.");
};

const createPrsi = (wsEnabledRouter: ws.Router, prefix = "", logger = (msg: string, _req?: express.Request) => console.log(msg)) => {
    prsiLogger = (msg: string, ws?: any) => {
        // Manually inject the ws id. I know using `any` isn't the cleanest
        // solution, but then again, the whole express-ws thing isn't very
        // clean.
        if (typeof ws !== "undefined") {
            logger(msg, {
                session: {
                    id: `ws/${ws.__private_id}`
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
            ws.send(JSON.stringify(processMessage(ws, message.toString())));
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
        });
    });


    prsiLogger("Prsi initialized.");
    return wsEnabledRouter;
}

export default createPrsi;
