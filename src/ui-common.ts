import * as React from "react";
import {isErrorResponse, isFrontendState, FrontendState, StartGame, PlayerInput, CardCounts} from "./communication";
import {Card, PlayDetails, PlayType, Value, Color, ActionType, Status, LastPlay, LastAction} from "./types";
import {CARDS_GENITIVE} from "./card-strings"

class Title extends React.Component {
    render() {
        return React.createElement("h1", null, "Prší");
    }
}

class Prompt extends React.Component<{instructions: string, lastPlay?: string}> {
    render() {
        return React.createElement(
            "p",
            {key: "prompt", className: "inline-block"},
            `${typeof this.props.lastPlay !== "undefined" ? this.props.lastPlay  + " " : ""}${this.props.instructions}`);
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

interface YouOther {
    you: string;
    other: string;
}

type InstructionOverride = {
    [key in keyof typeof Status]?: {you?: string, other?: string};
}

class InstructionStrings {
    [Status.Ok]: YouOther = {you: "ERROR: Ok/you", other: "ERROR: Ok/other"};
    [Status.PlayerMismatch]: YouOther = {you: "ERROR: PlayerMismatch/you", other: "ERROR: PlayerMismatch/other"};
    [Status.CardMismatch]: YouOther = {you: "ERROR: CardMismatch/you", other: "ERROR: CardMismatch/other"};
    [Status.ActionMismatch]: YouOther = {you: "ERROR: ActionMismatch/you", other: "ERROR: ActionMismatch/other"};
    [Status.DontHaveCard]: YouOther = {you: "ERROR: DontHaveCard/you", other: "ERROR: DontHaveCard/other"};
    [Status.NotAnAce]: YouOther = {you: "ERROR: NotAnAce/you", other: "ERROR: NotAnAce/other"};
    [Status.NotASeven]: YouOther = {you: "ERROR: NotASeven/you", other: "ERROR: NotASeven/other"};
    [Status.MustShuffle]: YouOther = {you: "ERROR: MustShuffle/you", other: "ERROR: MustShuffle/other"};
    constructor(overrides?: InstructionOverride) {
        if (typeof overrides === "undefined") {
            return;
        }

        Object.keys(overrides).forEach((key: string) => {
            const actualKey = key as Status; // TODO: check if Object.keys can return the enum
            const override = overrides[actualKey]!;
            if (typeof override.you !== "undefined") {
                this[actualKey].you = override.you;
            }
            if (typeof override.other !== "undefined") {
                this[actualKey].other = override.other;
            }
        });
    }
}

const startGame = (ws: any) => ws.send(JSON.stringify(new StartGame()));

export abstract class UI extends React.Component<{ws: any, thisName: string}, {gameState?: FrontendState, picker: null | Color}> {
    abstract renderCard(card: Card, onClick?: () => void): React.ReactNode;
    abstract renderPicker(onClick: (color: Color) => void): React.ReactNode;
    abstract renderPlayers(players: string[], whoseTurn?: string, cardCounts?: CardCounts): React.ReactNode;

    constructor(props: {ws: any, thisName: string}) {
        super(props);
        this.state = {picker: null};
        this.props.ws.onmessage = (message: any) => {
            const parsed = JSON.parse(message.data);

            if (isErrorResponse(parsed)) {
                console.log(parsed.error);
                return;
            }

            if (isFrontendState(parsed)) {
                console.log("new state ", parsed);
                this.setState({gameState: parsed, picker: null});
            }
        };
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

    renderDrawButton(wantedAction: ActionType, whoseTurn: string): React.ReactNode {
        return React.createElement(
            DrawButton,
            {
                key: "drawButton",
                onClick: () => {
                    this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Draw)));
                },
                text: (() => {
                    if (this.props.thisName !== whoseTurn && wantedAction !== ActionType.Shuffle) {
                        return "Líznout si";
                    }
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
        return React.createElement(Prompt, {key: "prompt", instructions: text});
    }

    renderHand(hand: Card[]): React.ReactNode {
        return hand.map((card) => React.createElement(CardComponent, {
            key: `hand:${card.value}${card.color}`,
            renderer: () => this.renderCard(card, () => {
                if (this.state.gameState!.gameInfo!.who === this.props.thisName && card.value === Value.Svrsek) {
                    this.setState({picker: card.color});
                    return;
                }
                if (this.state.picker !== null) {
                    this.setState({picker: null});
                }
                this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Play, new PlayDetails(card))));
            })
        }));
    }

    readonly colorStrings = {
        [Color.Kule]: "kule",
        [Color.Listy]: "listy",
        [Color.Srdce]: "srdce",
        [Color.Zaludy]: "žaludy",
    }

    readonly values = {
        [Value.Sedmicka]: "sedmu",
        [Value.Osmicka]: "osmičku",
        [Value.Devitka]: "devítku",
        [Value.Desitka]: "desítku",
        [Value.Spodek]: "spodka",
        [Value.Svrsek]: "svrška",
        [Value.Kral]: "krále",
        [Value.Eso]: "eso",
    }

    genPlayColor(color: Color): InstructionStrings {
        return new InstructionStrings({
            [Status.Ok]: {you: `Hraješ. (${this.colorStrings[color]})`, other: "@PLAYERNAME@ hraje."},
            [Status.CardMismatch]: {you: `Tohle tam nemůžeš dát. Musíš zahrát ${this.colorStrings[color]}.`},
            [Status.PlayerMismatch]: {other: "Teď nehraješ, hraje @PLAYERNAME@."}
        });
    }

    genPlaySeven(drawCount: string): InstructionStrings {
        return new InstructionStrings({
            [Status.Ok]: {you: `Lížeš ${drawCount}${drawCount !== "osm" ? ", nebo zahraj sedmu" : ""}.`, other: "@PLAYERNAME@ hraje."},
            [Status.NotASeven]: {you: `Tohle tam nemůžeš dát. Lízej ${drawCount}${drawCount !== "osm" ? ", nebo zahraj sedmu" : ""}.`},
            [Status.PlayerMismatch]: {other: "Teď nehraješ, hraje @PLAYERNAME@."}
        });
    }

    readonly instructionStrings: {[key in keyof typeof ActionType]: InstructionStrings} = {
        [ActionType.Play]: new InstructionStrings({
            [Status.Ok]: {you: "Hraješ.", other: "@PLAYERNAME@ hraje."},
            [Status.CardMismatch]: {you: "Tohle tam nemůžeš dát. Musíš zahrát @TOPVALUE@ nebo @TOPCOLOR@ (nebo si lízni)."},
            [Status.PlayerMismatch]: {other: "Teď nehraješ, hraje @PLAYERNAME@."},
            [Status.MustShuffle]: {you: "Hra skončila, musíš zamíchat.", other: "Hra skončila, @PLAYERNAME@ musí zamíchat."}
        }),
        [ActionType.PlayKule]: this.genPlayColor(Color.Kule),
        [ActionType.PlayListy]: this.genPlayColor(Color.Listy),
        [ActionType.PlayZaludy]: this.genPlayColor(Color.Zaludy),
        [ActionType.PlaySrdce]: this.genPlayColor(Color.Srdce),
        [ActionType.Shuffle]: new InstructionStrings({
            [Status.Ok]: {you: "Mícháš.", other: "Míchá @PLAYERNAME@."},
            [Status.PlayerMismatch]: {other: "Ty nemícháš, míchá @PLAYERNAME@."},
        }),
        [ActionType.DrawTwo]: this.genPlaySeven("dvě"),
        [ActionType.DrawFour]: this.genPlaySeven("čtyři"),
        [ActionType.DrawSix]: this.genPlaySeven("šest"),
        [ActionType.DrawEight]: this.genPlaySeven("osm"),
        [ActionType.SkipTurn]: new InstructionStrings({
            [Status.Ok]: {you: "Stojíš nebo zahraj eso.", other: "@PLAYERNAME@ hraje."},
            [Status.NotAnAce]: {you: "Tohle tam nemůžeš dát. Buď stojíš, nebo zahraj eso."}
        }),
    };

    readonly lastPlayStrings: {[key in keyof typeof LastAction]: YouOther} = {
        [LastAction.Play]: {you: "Zahráls @CARDS_GENITIVE@.", other: "@PLAYERNAME@ zahrál @CARDS_GENITIVE@."},
        [LastAction.SkipTurn]: {you: "Stojíš.", other: "@PLAYERNAME@ stojí."},
        [LastAction.Draw]: {you: "Líznuls.", other: "@PLAYERNAME@ líznul."},
        [LastAction.DrawTwo]: {you: "Líznuls dvě.", other: "@PLAYERNAME@ líznul dvě."},
        [LastAction.DrawFour]: {you: "Líznuls čtyři.", other: "@PLAYERNAME@ líznul čtyři."},
        [LastAction.DrawSix]: {you: "Líznuls šest.", other: "@PLAYERNAME@ líznul šest."},
        [LastAction.DrawEight]: {you: "Líznuls osm.", other: "@PLAYERNAME@ líznul osm."},
        [LastAction.Change]: {you: "Změnils na @COLORCHANGE@.", other: "@PLAYERNAME@ změnil na @COLORCHANGE@."},
    };

    renderInstructions(wantedAction: ActionType, status: Status, you: string, turn: string, topCard: Card, lastPlay?: LastPlay): React.ReactNode {
        const lastPlayStr = status !== Status.Ok || typeof lastPlay === "undefined" ? undefined :
            this.lastPlayStrings[lastPlay.playerAction][you === lastPlay.who ? "you" : "other"]
            .replace("@PLAYERNAME@", lastPlay.who)
            .replace("@COLORCHANGE@", typeof lastPlay.playDetails === "undefined" ? "PLAYDETAILS unavailable" :
                typeof lastPlay.playDetails.colorChange === "undefined" ? "COLORCHANGE unavailable" :
                this.colorStrings[lastPlay.playDetails.colorChange])
            .replace("@CARDS_GENITIVE@", typeof lastPlay.playDetails === "undefined"? "CARD unavailable" :
                CARDS_GENITIVE[lastPlay.playDetails.card.color][lastPlay.playDetails.card.value])
            .replace(/\.$/, !lastPlay.didWin ? "." : lastPlay.who === you ? " a vyhráls." : " a vyhrál.");
        const instructions = this.instructionStrings[wantedAction][status][you === turn ? "you" : "other"]
            .replace("@PLAYERNAME@", turn)
            .replace("@TOPCOLOR@", this.colorStrings[topCard.color])
            .replace("@TOPVALUE@", this.values[topCard.value]);

        return React.createElement(Prompt, {key: "instructions", instructions, lastPlay: lastPlayStr}, null);
    }

    render() {
        const elems = [];
        elems.push(React.createElement(Title, {key: "title"}, null));
        if (typeof this.state.gameState === "undefined") {
            return elems;
        }
        if (this.state.gameState.gameStarted === "no") {
            elems.push(this.renderStartButton());
        }
        elems.push(this.renderPlayers(this.state.gameState.players, this.state.gameState.gameInfo?.who, this.state.gameState.gameInfo?.cardCount));

        if (typeof this.state.gameState.gameInfo === "undefined") {
            elems.push(this.renderPrompt("Hra nezačala."));
            return elems;
        }
        elems.push(this.renderInstructions(this.state.gameState.gameInfo.wantedAction,
            this.state.gameState.gameInfo.status,
            this.props.thisName,
            this.state.gameState.gameInfo.who,
            this.state.gameState.gameInfo.topCard,
            this.state.gameState.gameInfo.lastPlay));
        elems.push(React.createElement("br", {key: "instructions-linebreak"}));

        elems.push(this.renderPrompt("Na vršku je:"));
        elems.push(this.renderCard(this.state.gameState.gameInfo.topCard));

        if (typeof this.state.gameState.gameInfo.hand !== "undefined") {
            elems.push(this.renderDrawButton(this.state.gameState.gameInfo.wantedAction, this.state.gameState.gameInfo.who));
            elems.push(React.createElement("p", {key: "hand-text", className: "inline-block"}, "Tvoje ruka:"));
            elems.push(this.renderHand(this.state.gameState.gameInfo.hand));
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
