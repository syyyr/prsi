import {StartGame, ErrorResponse, isErrorResponse, PlayerRegistration, isFrontendState, FrontendState} from "./prsi-communication";
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

const removeChildren = (element: HTMLElement) => {
    while (element.firstChild) {
        element.firstChild.remove();
    }
};

const renderCard = (card: Card) => `${card.value}${card.color}`;

const renderTopCard = (card?: Card) => {
    const topCard = window.document.getElementById("topCard")!;
    if (typeof card !== "undefined") {
        topCard.innerText = `Na vršku je ${renderCard(card)}.`;
    } else {
        topCard.innerText = "Hra nezačala.";
    }
};

const renderPlayers = (players: string[]) => {
    window.document.getElementById("players")!.innerText = `Players: ${players.join(" | ")}`;
};

const renderHand = (cards?: Card[]) => {
    const hand = window.document.getElementById("hand")!;
    removeChildren(hand);
    if (typeof cards !== "undefined") {
        const handText = window.document.createElement("p");
        handText.innerHTML = "Tvoje ruka:";
        hand.appendChild(handText);
        cards.forEach((card) => {
            const tag = window.document.createElement("p");
            tag.innerText = renderCard(card);
            hand.appendChild(tag);
        });
    }
};

const renderError = (error: ErrorResponse) => {
    const tag = window.document.createElement("p");
    tag.className = "errorOutput";
    tag.innerText = error.error;
    window.document.getElementById("title")!.insertAdjacentElement("afterend", tag);
};

const renderStartButton = (gameStarted: "yes" | "no") => {
    if (gameStarted === "yes") {
        window.document.getElementById("startButton")?.remove();
        return;
    }
    if (window.document.getElementById("startButton") !== null) {
        return;
    }
    const tag = window.document.createElement("button");
    tag.innerText = "Start";
    tag.id = "startButton";
    tag.onclick = () => connection.send(JSON.stringify(new StartGame()));
    window.document.getElementById("title")!.insertAdjacentElement("afterend", tag);
};

const render = (state: FrontendState) => {
    renderStartButton(state.gameStarted);
    renderPlayers(state.players);
    renderTopCard(state.topCard);
    renderHand(state.hand);
};

connection.onmessage = (message) => {
    console.log("ws got data:", message);

    const parsed = JSON.parse(message.data);

    if (isErrorResponse(parsed)) {
        console.log(parsed.error);
        renderError(parsed);
        return;
    }

    if (isFrontendState(parsed)) {
        window.document.getElementById("error")?.remove();
        render(parsed);
    }
};

connection.onclose = () => {
    console.log("ws closed");
}
