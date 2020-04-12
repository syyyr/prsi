import * as React from "react";
import * as ReactDOM from "react-dom";
import {PlayerRegistration} from "./common/communication";
import {UI} from "./ui";

let playerName: null | string = null;
while (playerName === null || playerName === "") {
    playerName = window.prompt("Username:");
}
const connection = new window.WebSocket(`ws${window.location.protocol === "https:" ? "s" : ""}://${window.location.host}`);

connection.onopen = () => {
    console.log("ws opened");
    connection.send(JSON.stringify(new PlayerRegistration(playerName!)));
}

connection.onclose = () => {
    console.log("ws closed");
}

ReactDOM.render(
    React.createElement(UI, {ws: connection, thisName: playerName!}, null),
    window.document.getElementById("game")
);
