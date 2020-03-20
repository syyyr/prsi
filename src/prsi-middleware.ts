import express from "express";

const prsi = async (prefix = "", logger = (msg: string, _req?: express.Request) => console.log(msg)) => {
    const router = express.Router();

    return router;
}

export default prsi;
