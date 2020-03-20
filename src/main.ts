import prsi from "./prsi-middleware"
import ws from "express-ws";
import express from "express";

const wsApp = ws(express(), undefined, {
    leaveRouterUntouched: true
});
console.log("Initializing prsi...");
const router = express.Router();
wsApp.applyTo(router);
wsApp.app.use(prsi(router));
console.log("Prsi started.");
wsApp.app.listen(3000);







