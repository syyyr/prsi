import {StartGame, ErrorResponse, isErrorResponse, PlayerRegistration, isFrontendState, FrontendState, PlayerInput} from "./communication";
import {Card, PlayType, PlayDetails} from "./types";

let playerName: null | string = null;
while (playerName == null) {
    playerName = window.prompt("Username:");
}
const connection = new window.WebSocket(`ws://${window.location.host}`);

connection.onopen = () => {
    console.log("ws opened");
    connection.send(JSON.stringify(new PlayerRegistration(playerName!)));
}

const removeChildren = (element: HTMLElement): void => {
    while (element.firstChild) {
        element.firstChild.remove();
    }
};

enum Clickable {
    Clickable,
    NonClickable
}

const renderCard = (card: Card, clickable: Clickable): HTMLElement => {
    const tag = window.document.createElement("a");
    if (clickable === Clickable.Clickable) {
        tag.style.cursor = "pointer";
        tag.style.color = "blue";
        tag.style.textDecoration = "underline";
    }
    tag.style.display = "block";
    tag.innerText = `${card.value}${card.color}`;
    return tag;
}

const renderTopCard = (card?: Card) => {
    const topCard = window.document.getElementById("topCardText")!;
    window.document.getElementById("topCard")?.remove();
    if (typeof card !== "undefined") {
        topCard.innerText = "Na vršku je:";
        const rendered = renderCard(card, Clickable.NonClickable);
        rendered.id = "topCard";
        topCard.insertAdjacentElement("afterend", rendered);
    } else {
        topCard.innerText = "Hra nezačala.";
    }
};

const renderPlayers = (players: string[]) => {
    window.document.getElementById("players")!.innerText = `Hráči: ${players.join(" | ")}`;
};

const playCard = (card: Card) => {
    connection.send(JSON.stringify(new PlayerInput(PlayType.Play, new PlayDetails(card))));
}

const renderHand = (cards?: Card[]) => {
    const hand = window.document.getElementById("hand")!;
    removeChildren(hand);
    if (typeof cards !== "undefined") {
        const handText = window.document.createElement("p");
        handText.innerHTML = "Tvoje ruka:";
        hand.appendChild(handText);
        cards.forEach((card) => {
            const rendered = renderCard(card, Clickable.Clickable);
            rendered.onclick = () => {
                playCard(card);
            }
            hand.appendChild(rendered);
        });
    }
};

const renderError = (error: ErrorResponse) => {
    const tag = window.document.getElementById("errorOutput")!;
    tag.innerText = error.error;
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

    window.document.getElementById("errorOutput")!.innerText = "";
    if (isErrorResponse(parsed)) {
        console.log(parsed.error);
        renderError(parsed);
        return;
    }

    if (isFrontendState(parsed)) {
        render(parsed);
    }
};

connection.onclose = () => {
    console.log("ws closed");
}
