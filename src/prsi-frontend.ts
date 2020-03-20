import {ConnStatus, PlayerRegistration, isToken} from "./communication";

let playerName: null | string = null;
while (playerName == null) {
    playerName = window.prompt("Username:");
}
let token: string | undefined;

const connection = new window.WebSocket(`ws://${window.location.host}`);

connection.onopen = () => {
    console.log("ws opened");
    connection.send(JSON.stringify(new PlayerRegistration(playerName!)));
}

connection.onmessage = (message) => {
    console.log("ws got data:", message);

    const parsed = JSON.parse(message.data);

    if (typeof token === "undefined") {
        if (parsed.status !== ConnStatus.Ok) {
            console.log("Unable to register player.");
            connection.close();
            return;
        }

        if (isToken(parsed)) {
            console.log("Successfully registered.");
            token = parsed.token;
            return;
        }

        console.log("Expected token, but didn't get it.");
        connection.close();
    }
};

connection.onclose = () => {
    console.log("ws closed");
}
