import {isErrorResponse, PlayerRegistration, isFrontendState, FrontendState} from "./prsi-communication";
import {Card} from "./prsi-types";

let playerName: null | string = null;
while (playerName == null) {
    playerName = window.prompt("Username:");
}
const connection = new window.WebSocket(`ws://${window.location.host}`);

connection.onopen = () => {
    console.log("ws opened");
    connection.send(JSON.stringify(new PlayerRegistration(playerName!)));
}

const renderTopCard = (card: Card | null) => {
    const topCard = window.document.getElementById("topCard")!;
    if (card !== null) {
        topCard.innerText = `Na vršku je ${card.value}${card.color}.`;
    } else {
        topCard.innerText = "Hra nezačala.";
    }

};

const render = (state: FrontendState) => {
    renderTopCard(state.topCard);
};



connection.onmessage = (message) => {
    console.log("ws got data:", message);

    const parsed = JSON.parse(message.data);

    if (isErrorResponse(parsed)) {
        console.log(parsed.error);
        return;
    }

    if (isFrontendState(parsed)) {
        render(parsed);
    }
};

connection.onclose = () => {
    console.log("ws closed");
}
