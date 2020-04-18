import prsi from "./server/middleware"
import ws from "express-ws";
import express from "express";

const wsApp = ws(express(), undefined, {
    leaveRouterUntouched: true
});
const router = express.Router();
wsApp.applyTo(router);
wsApp.app.use(prsi(router, "", (msg: string, req?: express.Request) => {
    console.log(`${typeof req !== "undefined" ? `[${(req as any).session.myId}] `: "" }${msg}`);
}));
wsApp.app.listen(3000);







