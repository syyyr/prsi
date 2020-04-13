import * as React from "react";
import {isErrorResponse, isFrontendState, FrontendState, StartGame, PlayerInput} from "../common/communication";
import {Card, PlayDetails, PlayType, Value, Color, ActionType, Status, LastPlay, LastAction} from "../common/types";
import ColorPicker from "./components/colorpicker";
import Game from "./components/game";
import PlayerBox from "./components/playerbox";
import Prompt from "./components/prompt";
import StartButton from "./components/startbutton";
import Stats from "./components/stats";
import Title from "./components/title";
import {cardsGenitive, instructionStrings, lastPlayStrings, colorStrings, values} from "./strings";
import {audio} from "./sounds";

const drawCard = (ws: any) => ws.send(JSON.stringify(new PlayerInput(PlayType.Draw)))
const startGame = (ws: any) => ws.send(JSON.stringify(new StartGame()));
const playCard = (ws: any, card: Card) => ws.send(JSON.stringify(new PlayerInput(PlayType.Play, new PlayDetails(card))));

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

                if (parsed.gameInfo?.status === Status.Ok) {
                    switch (parsed.gameInfo.lastPlay?.playerAction) {
                        case LastAction.DrawFour:
                        case LastAction.DrawSix:
                        case LastAction.DrawEight:
                            new Audio(audio[parsed.gameInfo.lastPlay.playerAction]).play();
                    }
                }
            }
        };
    }

    // FIXME: Check if this can be refactored inside the prompt
    buildInstructions(wantedAction: ActionType, status: Status, you: string, turn: string, topCard: Card, lastPlay?: LastPlay): string {
        const lastPlayStr = status !== Status.Ok || typeof lastPlay === "undefined" ? undefined :
            lastPlayStrings[lastPlay.playerAction][you === lastPlay.who ? "you" : "other"]
            .replace("@PLAYERNAME@", lastPlay.who)
            .replace("@COLORCHANGE@", typeof lastPlay.playDetails === "undefined" ? "PLAYDETAILS unavailable" :
                typeof lastPlay.playDetails.colorChange === "undefined" ? "COLORCHANGE unavailable" :
                colorStrings[lastPlay.playDetails.colorChange])
            .replace("@CARDS_GENITIVE@", typeof lastPlay.playDetails === "undefined"? "CARD unavailable" :
                cardsGenitive[lastPlay.playDetails.card.color][lastPlay.playDetails.card.value])
            .replace("@RETURN@", typeof lastPlay.playDetails === "undefined" || typeof lastPlay.playDetails.returned === "undefined" ? "RETURN unavailable" :
                lastPlay.playDetails.returned)
            .replace(/\.$/, !lastPlay.didWin ? "." : lastPlay.who === you ? " a vyhráls." : " a vyhrál.");
        const instructions = instructionStrings[wantedAction][status][you === turn ? "you" : "other"]
            .replace("@PLAYERNAME@", turn)
            .replace("@TOPCOLOR@", colorStrings[topCard.color])
            .replace("@TOPVALUE@", values[topCard.value]);
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
            elems.push(React.createElement(StartButton, {key: "startButton", startGame: () => startGame(this.props.ws)}));
        }
        elems.push(React.createElement(PlayerBox, {
            key: "playerbox",
            thisName: this.props.thisName,
            players: this.state.gameState.players,
            playerInfo: this.state.gameState.gameInfo?.playerInfo
        }));

        if (typeof this.state.gameState.gameInfo === "undefined") {
            elems.push(React.createElement(Prompt, {key: "prompt", instructions: "Hra nezačala."}));
            // FIXME: standardize this somehow (don't have two creators of Stats)
            elems.push(React.createElement(Stats, {key: "stats", stats: this.state.gameState.stats}));
            return elems;
        }

        elems.push(React.createElement(Prompt, {
            key: "prompt",
            instructions: this.buildInstructions(this.state.gameState.gameInfo.wantedAction,
                this.state.gameState.gameInfo.status,
                this.props.thisName,
                this.state.gameState.gameInfo.who,
                this.state.gameState.gameInfo.topCards[this.state.gameState.gameInfo.topCards.length - 1],
                this.state.gameState.gameInfo.lastPlay)
        }));

        elems.push(React.createElement(Game, {
            key: "playfield",
            onTurn: this.onTurn(),
            drawCard: () => drawCard(this.props.ws),
            playCard: (card: Card) => playCard(this.props.ws, card),
            wantedAction: this.state.gameState.gameInfo.wantedAction,
            topCards: this.state.gameState.gameInfo.topCards,
            openPicker: this.onTurn() && this.canPlaySvrsek() ? (svrsekColor: Color) => this.setState({picker: svrsekColor}) : () => {},
            hand: this.state.gameState.gameInfo.hand
        }));
        elems.push(React.createElement(Stats, {key: "stats", stats: this.state.gameState.stats}));

        if (this.state.picker !== null) {
            elems.push(React.createElement(
                ColorPicker,
                {
                    key: "picker",
                    pickColor: (color: Color) => {
                        this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Play, new PlayDetails(new Card(this.state.picker!, Value.Svrsek), color))));
                        this.setState({picker: null});
                    },
                    closePicker: (event: MouseEvent) => {
                        event.stopPropagation();
                        this.setState({picker: null});
                    }
                }
            ));
        }

        return elems;
    }
}
