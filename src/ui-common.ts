import * as React from "react";
import {FrontendState, StartGame, PlayerInput} from "./communication";
import {Card, PlayDetails, PlayType, Value, Color, ActionType} from "./types";

class Title extends React.Component {
    render() {
        return React.createElement("h1", null, "Prší");
    }
}

class Prompt extends React.Component<{text: string}> {
    render() {
        return React.createElement("p", {key: "prompt", className: "inline-block"}, this.props.text);
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

class StartButton extends React.Component<{onClick: () => void}> {
    render() {
        return React.createElement(
            "button",
            {
                className: "block",
                onClick: this.props.onClick
            },
            "Start");

    }
}

class DrawButton extends React.Component<{text: string, onClick: () => void}> {
    render() {
        return React.createElement(
            "button",
            {
                className: "block",
                onClick: this.props.onClick
            },
            this.props.text);

    }
}

const startGame = (ws: any) => ws.send(JSON.stringify(new StartGame()));

export abstract class UI extends React.Component<FrontendState & {ws: any}, {picker: null | Color}> {
    abstract renderCard(card: Card, onClick?: () => void): React.ReactNode;
    abstract renderPicker(onClick: (color: Color) => void): React.ReactNode;

    constructor(props: FrontendState & {ws: any}) {
        super(props);
        this.state = {picker: null};
    }

    renderPlayers(players: string[]): React.ReactNode {
        return [
            React.createElement("p", {className: "fit-content inline-block", key: "players"}, "Hráči:"),
            ...players.map((player) => React.createElement(
                "p",
                {
                    className: "left-margin fit-content inline-block",
                    key: "player:" + player
                },
                player)
            ),
            React.createElement("br", {key: "players-linebreak"})
        ]
    }

    renderStartButton(): React.ReactNode {
        return React.createElement(
            StartButton,
            {
                key: "startButton",
                onClick: () => startGame(this.props.ws)
            },
            "Start");
    }

    renderDrawButton(text: string): React.ReactNode {
        return React.createElement(
            DrawButton,
            {
                key: "drawButton",
                onClick: () => {
                    this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Draw)));
                },
                text: (() => {
                    switch (wantedAction) {
                    case ActionType.Play:
                    case ActionType.PlayKule:
                    case ActionType.PlayListy:
                    case ActionType.PlayZaludy:
                    case ActionType.PlaySrdce:
                        return "Líznout si";
                    case ActionType.DrawTwo:
                        return "Líznout dvě";
                    case ActionType.DrawFour:
                        return "Líznout čtyři";
                    case ActionType.DrawSix:
                        return "Líznout šest";
                    case ActionType.DrawEight:
                        return "Líznout osm";
                    case ActionType.SkipTurn:
                        return "Stojím";
                    case ActionType.Shuffle:
                        return "Zamíchat";
                    }
                })()
            },
            null);
    }

    renderPrompt(text: string): React.ReactNode {
        return React.createElement(Prompt, {key: "prompt", text});
    }

    renderHand(hand: Card[]): React.ReactNode {
        return hand.map((card) => React.createElement(CardComponent, {
            key: `hand:${card.value}${card.color}`,
            renderer: () => this.renderCard(card, () => {
                if (this.state.picker !== null) {
                    return;
                }
                if (card.value === Value.Svrsek) {
                    this.setState({picker: card.color});
                    return;
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
        if (typeof this.props.gameInfo !== "undefined") {
            elems.push(this.renderPrompt("Na vršku je:"));
            elems.push(this.renderCard(this.props.gameInfo.topCard));
        } else {
            elems.push(this.renderPrompt("Hra nezačala."));
        }

        if (typeof this.props.gameInfo !== "undefined") {
            elems.push(this.renderDrawButton(this.props.gameInfo.wantedAction));
        }

        if (typeof this.props.gameInfo !== "undefined") {
            elems.push(React.createElement("p", {key: "hand-text", className: "inline-block"}, "Tvoje ruka:"));
            elems.push(this.renderHand(this.props.gameInfo.hand));
            elems.push(React.createElement("br", {key: "hand-linebreak"}));
        }

        if (this.state.picker !== null) {
            elems.push(React.createElement(
                ColorPicker,
                {
                    key: "picker",
                    renderer: () => this.renderPicker((color: Color) => {
                        this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Play, new PlayDetails(new Card(this.state.picker!, Value.Svrsek), color))));
                        this.setState({picker: null});
                    })
                }
            ));
        }

        return React.createElement("div", {key: "root"}, [...elems]);
    }
}
