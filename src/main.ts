import prsi from "./server/middleware"
import ws from "express-ws";
import express from "express";

const wsApp = ws(express(), undefined, {
    leaveRouterUntouched: true
});
const router = express.Router();
wsApp.applyTo(router);
wsApp.app.use(prsi(router));
wsApp.app.listen(3000);







