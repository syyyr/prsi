import * as React from "react";
import {isErrorResponse, isFrontendState, FrontendState, StartGame, PlayerInput, FrontendStats} from "../common/communication";
import {Card, PlayDetails, PlayType, Value, Color, ActionType, Status, LastAction} from "../common/types";
import ColorPicker from "./components/colorpicker";
import Game from "./components/game";
import PlayerBox from "./components/playerbox";
import Prompt from "./components/prompt";
import StartButton from "./components/startbutton";
import Stats from "./components/stats";
import Title from "./components/title";
import {audio} from "./sounds";
import Instructions from "./components/instructions";

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

    createStats(stats: { [x: string]: FrontendStats; }): React.ReactNode {
        return React.createElement(Stats, {key: "stats", stats});
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
            elems.push(this.createStats(this.state.gameState.stats));
            return elems;
        }

        elems.push(React.createElement(Instructions, {
            key: "instructions",
            wantedAction: this.state.gameState.gameInfo.wantedAction,
            status: this.state.gameState.gameInfo.status,
            you: this.props.thisName,
            whoseTurn: this.state.gameState.gameInfo.who,
            topCard: this.state.gameState.gameInfo.topCards[this.state.gameState.gameInfo.topCards.length - 1],
            lastPlay: this.state.gameState.gameInfo.lastPlay
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
        elems.push(this.createStats(this.state.gameState.stats));

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
