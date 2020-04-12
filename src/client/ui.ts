import * as React from "react";
import {isErrorResponse, isFrontendState, FrontendState, StartGame, PlayerInput} from "../common/communication";
import {Card, PlayDetails, PlayType, Value, Color, ActionType, Status, LastPlay, LastAction} from "../common/types";
import ColorPicker from "./components/colorpicker";
import PlayField from "./components/playfield";
import PlayerBox from "./components/playerbox";
import Prompt from "./components/prompt";
import StartButton from "./components/startbutton";
import Stats from "./components/stats";
import Title from "./components/title";
import {CARDS_GENITIVE} from "./strings";
import {audio} from "./sounds";

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

export class UI extends React.Component<{ws: any, thisName: string}, {gameState?: FrontendState, picker: null | Color}> {
    constructor(props: {ws: any, thisName: string}) {
        super(props);
        // FIXME: look for a better solution for picker (don't save color of the played guy)
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
            [Status.MustShuffle]: {you: "Hra skončila, musíš zamíchat.", other: "Hra skončila, @PLAYERNAME@ musí zamíchat."}
        }),
        [ActionType.DrawTwo]: this.genPlaySeven("dvě"),
        [ActionType.DrawFour]: this.genPlaySeven("čtyři"),
        [ActionType.DrawSix]: this.genPlaySeven("šest"),
        [ActionType.DrawEight]: this.genPlaySeven("osm"),
        [ActionType.SkipTurn]: new InstructionStrings({
            [Status.Ok]: {you: "Stojíš nebo zahraj eso.", other: "@PLAYERNAME@ hraje."},
            [Status.NotAnAce]: {you: "Tohle tam nemůžeš dát. Buď stojíš, nebo zahraj eso."},
            [Status.PlayerMismatch]: {other: "Teď nehraješ, hraje @PLAYERNAME@."}
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
        [LastAction.Disconnect]: {you: "Odpojil ses? Tohle bys neměl vidět.", other: "@PLAYERNAME@ se odpojil."},
        [LastAction.Return]: {you: "Zahráls červenou sedmičku a vrátils @RETURN@ do hry!", other: "@PLAYERNAME@ zahrál červenou sedmičku a vrátil @RETURN@ do hry!"},
    };

    // FIXME: Check if this can be refactored inside the prompt
    buildInstructions(wantedAction: ActionType, status: Status, you: string, turn: string, topCard: Card, lastPlay?: LastPlay): string {
        const lastPlayStr = status !== Status.Ok || typeof lastPlay === "undefined" ? undefined :
            this.lastPlayStrings[lastPlay.playerAction][you === lastPlay.who ? "you" : "other"]
            .replace("@PLAYERNAME@", lastPlay.who)
            .replace("@COLORCHANGE@", typeof lastPlay.playDetails === "undefined" ? "PLAYDETAILS unavailable" :
                typeof lastPlay.playDetails.colorChange === "undefined" ? "COLORCHANGE unavailable" :
                this.colorStrings[lastPlay.playDetails.colorChange])
            .replace("@CARDS_GENITIVE@", typeof lastPlay.playDetails === "undefined"? "CARD unavailable" :
                CARDS_GENITIVE[lastPlay.playDetails.card.color][lastPlay.playDetails.card.value])
            .replace("@RETURN@", typeof lastPlay.playDetails === "undefined" || typeof lastPlay.playDetails.returned === "undefined" ? "RETURN unavailable" :
                lastPlay.playDetails.returned)
            .replace(/\.$/, !lastPlay.didWin ? "." : lastPlay.who === you ? " a vyhráls." : " a vyhrál.");
        const instructions = this.instructionStrings[wantedAction][status][you === turn ? "you" : "other"]
            .replace("@PLAYERNAME@", turn)
            .replace("@TOPCOLOR@", this.colorStrings[topCard.color])
            .replace("@TOPVALUE@", this.values[topCard.value]);
        return `${typeof lastPlayStr !== "undefined" ? `${lastPlayStr} ` : ""}${instructions}`;
    }

    private onTurn(): boolean {
        return this.state.gameState!.gameInfo!.who === this.props.thisName;
    }

    private canPlaySvrsek(): boolean {
        switch (this.state.gameState!.gameInfo!.wantedAction) {
            case ActionType.Play:
            case ActionType.PlayKule:
            case ActionType.PlayListy:
            case ActionType.PlayZaludy:
            case ActionType.PlaySrdce:
                return true;
            default:
                return false;
        }
    }

    render(): React.ReactNode {
        const elems = [];
        elems.push(React.createElement(Title, {key: "title"}, null));
        if (typeof this.state.gameState === "undefined") {
            return elems;
        }
        if (this.state.gameState.gameStarted === "no" && this.state.gameState.players.length >= 2) {
            elems.push(React.createElement(StartButton, {key: "startButton", callback: () => startGame(this.props.ws)}));
        }
        elems.push(React.createElement(PlayerBox, {
            thisName: this.props.thisName,
            players: this.state.gameState.players,
            playerInfo: this.state.gameState.gameInfo?.playerInfo
        }));

        if (typeof this.state.gameState.gameInfo === "undefined") {
            elems.push(React.createElement(Prompt, {key: "prompt", instructions: "Hra nezačala."}));
            elems.push(React.createElement(Stats, {stats: this.state.gameState.stats}));
            return elems;
        }

        elems.push(React.createElement(Prompt, {
            instructions: this.buildInstructions(this.state.gameState.gameInfo.wantedAction,
                this.state.gameState.gameInfo.status,
                this.props.thisName,
                this.state.gameState.gameInfo.who,
                this.state.gameState.gameInfo.topCards[this.state.gameState.gameInfo.topCards.length - 1],
                this.state.gameState.gameInfo.lastPlay)
        }));

        elems.push(React.createElement(PlayField, {
            onTurn: this.onTurn(),
            drawCard: () => this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Draw))),
            playCard: (card: Card) => this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Play, new PlayDetails(card)))), // FIXME: Refactor to a function
            wantedAction: this.state.gameState.gameInfo.wantedAction,
            topCards: this.state.gameState.gameInfo.topCards,
            openPicker: this.onTurn() && this.canPlaySvrsek() ? (svrsekColor: Color) => this.setState({picker: svrsekColor}) : () => {},
            hand: this.state.gameState.gameInfo.hand
        }));
        elems.push(React.createElement(Stats, {stats: this.state.gameState.stats}));

        if (this.state.picker !== null) {
            elems.push(React.createElement(
                ColorPicker,
                {
                    key: "picker",
                    callback: (color: Color) => {
                        this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Play, new PlayDetails(new Card(this.state.picker!, Value.Svrsek), color))));
                        this.setState({picker: null});
                    }
                }
            ));
        }

        if (this.state.gameState.gameInfo.status === Status.Ok) {
            switch (this.state.gameState.gameInfo.lastPlay?.playerAction) {
                case LastAction.DrawFour:
                case LastAction.DrawSix:
                case LastAction.DrawEight:
                    new Audio(audio[this.state.gameState.gameInfo.lastPlay.playerAction]).play();
            }
        }

        return elems;
    }
}
