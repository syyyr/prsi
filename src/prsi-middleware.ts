import express from "express";
import path from "path";
import ws from "express-ws";
import Prsi from "./prsi-backend";

const createPrsi = (prefix = "", logger = (msg: string, _req?: express.Request) => console.log(msg)) => {
    const router = express.Router();

    router.use(prefix, express.static(path.join(__dirname + "/../dist"), {
        dotfiles: "ignore",
    }));

    const prsi = new Prsi();

    return router;
}

export default createPrsi;
