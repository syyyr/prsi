import {ErrorResponse, isErrorResponse, PlayerRegistration, isFrontendState, FrontendState} from "./prsi-communication";
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

const removeChildren = (element: HTMLElement) => element.childNodes.forEach((child) => child.remove());

const renderCard = (card: Card) => `${card.value}${card.color}`;

const renderTopCard = (card: Card | null) => {
    const topCard = window.document.getElementById("topCard")!;
    if (card !== null) {
        topCard.innerText = `Na vršku je ${renderCard(card)}.`;
    } else {
        topCard.innerText = "Hra nezačala.";
    }
};

const renderHand = (cards: Card[] | null) => {
    const hand = window.document.getElementById("hand")!;
    removeChildren(hand);
    if (cards !== null) {
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

const render = (state: FrontendState) => {
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
