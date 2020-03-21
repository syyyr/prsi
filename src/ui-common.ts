import * as React from "react";
import {FrontendState, StartGame, PlayerInput} from "./communication";
import {Card, PlayDetails, PlayType, Value, Color} from "./types";

export class Title extends React.Component {
    render() {
        return React.createElement("h1", null, "Prší");
    }
}

class Prompt extends React.Component<{text: string}> {
    render() {
        return React.createElement("p", {key: "prompt", className: "block"}, this.props.text);
    }
}

type Renderer = {renderer: () => React.ReactNode};

class CardComponent extends React.Component<Renderer> {
    render() {
        return this.props.renderer();
    }
}

class ColorPicker extends React.Component<Renderer> {
    render() {
        return this.props.renderer();
    }
}

const startGame = (ws: any) => ws.send(JSON.stringify(new StartGame()));

export abstract class UI extends React.Component<FrontendState & {ws: any}, {pickerVisible: boolean}> {
    abstract renderCard(card: Card, onClick?: () => void): React.ReactNode;
    abstract renderPicker(onClick: (color: Color) => void): React.ReactNode;

    constructor(props: FrontendState & {ws: any}) {
        super(props);
        this.setState({pickerVisible: false});
    }

    renderPlayers(players: string[]): React.ReactNode {
        return [
            React.createElement("p", {className: "fit-content inline-block", key: "players"}, "Hráči:"),
            ...players.map((player) => React.createElement(
                "p",
                {
                    className: "player fit-content inline-block",
                    key: "player:" + player
                },
                player)
            )
        ]
    }

    renderStartButton(): React.ReactNode {
        return React.createElement(
            "button",
            {
                key: "startButton",
                className: "block",
                onClick: () => startGame(this.props.ws)
            },
            "Start");
    }

    renderPrompt(text: string): React.ReactNode {
        return React.createElement(Prompt, {text});
    }

    renderHand(hand: Card[]): React.ReactNode {
        return hand.map((card) => React.createElement(CardComponent, {
            renderer: this.renderCard.bind(null, card, () => {
                if (this.state.pickerVisible) {
                    return;
                }
                if (card.value === Value.Svrsek) {
                    this.setState({pickerVisible: true});
                }
                this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Play, new PlayDetails(card))));
            })
        }));
    }

    render() {
        const elems = [];
        elems.push(React.createElement(Title, {key: "title"}, null));
        if (this.props.gameStarted === "no") {
            elems.push(this.renderStartButton());
        }
        elems.push(this.renderPlayers(this.props.players));
        if (typeof this.props.topCard !== "undefined") {
            elems.push(this.renderPrompt("Na vršku je:"));
            elems.push(this.renderCard(this.props.topCard));
        } else {
            elems.push(this.renderPrompt("Hra nezačala."));
        }

        if (typeof this.props.hand !== "undefined") {
            elems.push(React.createElement("p", null, "Tvoje ruka:"));
            elems.push(this.renderHand(this.props.hand));
        }

        if (this.state.pickerVisible) {
            elems.push(React.createElement(
                ColorPicker,
                {
                    renderer: this.renderPicker.bind(null, (color: Color) => {
                        this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Play, new PlayDetails(new Card(color, Value.Svrsek)))));
                    })
                }
            ));
        }

        return React.createElement("div", null, [...elems]);
    }
}
