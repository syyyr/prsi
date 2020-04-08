import * as React from "react";
import * as ReactDOM from "react-dom";
import {PlayerRegistration} from "./communication";
import {TextUI} from "./ui-text";
import {ImgUI} from "./ui-img";

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
    React.createElement(ImgUI, {ws: connection, thisName: playerName!}, null),
    window.document.getElementById("game")
);
