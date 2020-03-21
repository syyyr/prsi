import Prsi from "./prsi-backend";
import express from "express";
import path from "path";
import ws from "express-ws";
import {isPlayerRegistration, isPlayerInput, Response, ErrorResponse, FrontendState} from "./prsi-communication";

let prsiLogger: (msg: string, req?: express.Request) => void;
const prsi = new Prsi();

type AugmentedSocket = (WebSocket & {
    __private_name: string
});

const openSockets: AugmentedSocket[] = [];

const buildFrontendState = (): FrontendState => {
    const state = prsi.state();
    return {
        topCard: state ? state.playedCards[state.playedCards.length - 1] : null
    }
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
            prsiLogger(`"${parsed.registerPlayer}" already belongs to someone else.`);
            return new ErrorResponse("Someone else owns this username.");
        }

        ws.__private_name = parsed.registerPlayer;
        prsi.registerPlayer(parsed.registerPlayer);
        prsiLogger(`Registered "${parsed.registerPlayer}".`);
        return buildFrontendState();
    }

    if (isPlayerInput(parsed)) {
        if (parsed.name !== ws.__private_name) {
            prsiLogger(`${ws.__private_name}: tried to act as ${parsed.name}.`);
            return new ErrorResponse("Someone else owns this username.");
        }

        return buildFrontendState();
    }

    prsiLogger(`${ws.__private_name} tried to act as ${parsed.name}.`);
    return new ErrorResponse("Invalid request.");
};

const createPrsi = (wsEnabledRouter: ws.Router, prefix = "", logger = (msg: string, _req?: express.Request) => console.log(msg)) => {
    prsiLogger = logger;
    wsEnabledRouter.use(prefix, express.static(path.join(__dirname + "/../dist"), {
        dotfiles: "ignore",
    }));

    wsEnabledRouter.ws(prefix, (ws) => {
        logger("New websocket.");
        ws.on("message", (message) => {
            ws.send(JSON.stringify(processMessage(ws, message.toString())));
        });

        ws.on("close", () => {
            // Using Object here, because I want to compare references
            const closed = openSockets.findIndex((socket) => socket === ws as Object);

            // Have to check whether the closing socket was already registered
            if (typeof openSockets[closed].__private_name !== "undefined") {
                prsi.unregisterPlayer(openSockets[closed].__private_name);
            }
            openSockets.splice(closed, 1);
            logger("Websocket closed.");
        });
    });


    return wsEnabledRouter;
}

export default createPrsi;
