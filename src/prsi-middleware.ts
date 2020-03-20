import crypto from "crypto";
import Prsi from "./prsi-backend";
import express from "express";
import path from "path";
import ws from "express-ws";
import {ConnStatus, Response, Token, isPlayerRegistration} from "./communication";

const prsi = new Prsi();

const playerName = new Map();

const processMessage = (message: string): Response => {
    let parsed: any;

    try {
        parsed = JSON.parse(message);
    } catch (err) {
        return {
            status: ConnStatus.InvalidRequest
        }
    }

    console.log("parsed", "=", parsed);

    if (isPlayerRegistration(parsed)) {
        prsi.registerPlayer(parsed.name);
        return new Token(crypto.randomBytes(48).toString("hex"));
    }

    return {
        status: ConnStatus.InvalidRequest
    }
};

const createPrsi = (wsEnabledRouter: ws.Router, prefix = "", logger = (msg: string, _req?: express.Request) => console.log(msg)) => {
    wsEnabledRouter.use(prefix, express.static(path.join(__dirname + "/../dist"), {
        dotfiles: "ignore",
    }));

    wsEnabledRouter.ws(prefix, (ws) => {
        console.log("new Websocket connected");

        ws.on("message", (message) => {
            ws.send(JSON.stringify(processMessage(message.toString())));
        });
    });


    return wsEnabledRouter;
}

export default createPrsi;
