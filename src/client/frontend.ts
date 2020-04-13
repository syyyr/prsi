import * as React from "react";
import * as ReactDOM from "react-dom";
import {UI} from "./ui";
import PlayerInputOutput from "./io";

let playerName: null | string = null;
while (playerName === null || playerName === "") {
    playerName = window.prompt("Username:");
}

const io = new PlayerInputOutput(playerName);

ReactDOM.render(
    React.createElement(UI, {io: io, thisName: playerName!}, null),
    window.document.getElementById("game")
);
