import * as React from "react";
import * as ReactDOM from "react-dom";
import {isErrorResponse, PlayerRegistration, isFrontendState} from "./communication";
import {TextUI} from "./ui-text";

let playerName: null | string = null;
while (playerName == null) {
    playerName = window.prompt("Username:");
}
const connection = new window.WebSocket(`ws${window.location.protocol === "https:" ? "s" : ""}://${window.location.host}`);

connection.onopen = () => {
    console.log("ws opened");
    connection.send(JSON.stringify(new PlayerRegistration(playerName!)));
}

connection.onmessage = (message) => {
    console.log("ws got data:", message);

    const parsed = JSON.parse(message.data);

    if (isErrorResponse(parsed)) {
        console.log(parsed.error);
        return;
    }

    if (isFrontendState(parsed)) {
        ReactDOM.render(
            React.createElement(TextUI, {...parsed, ws: connection}, null),
            window.document.getElementById("game")
        );
    }
};

connection.onclose = () => {
    console.log("ws closed");
}
