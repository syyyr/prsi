import {isErrorResponse, PlayerRegistration, isFrontendState} from "./prsi-communication";

let playerName: null | string = null;
while (playerName == null) {
    playerName = window.prompt("Username:");
}

const connection = new window.WebSocket(`ws://${window.location.host}`);

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
        // TODO: show state on screen
    }
};

connection.onclose = () => {
    console.log("ws closed");
}
