import * as React from "react";
import {FrontendState, FrontendStats, ErrorResponse} from "../common/communication";
import {Card, Value, Color, ActionType, Status, LastAction} from "../common/types";
import ColorPicker from "./components/colorpicker";
import Game from "./components/game";
import PlayerBox from "./components/playerbox";
import Prompt from "./components/prompt";
import StartButton from "./components/startbutton";
import Stats from "./components/stats";
import Title from "./components/title";
import {audio} from "./sounds";
import Instructions from "./components/instructions";
import PlayerInputOutput from "./io";

export class UI extends React.Component<{io: PlayerInputOutput, thisName: string}, {gameState?: FrontendState, picker: null | Color}> {
    constructor(props: {io: any, thisName: string}) {
        super(props);
        // FIXME: look for a better solution for picker (don't save color of the played guy)
        this.state = {picker: null};
        this.props.io.onState = (state: FrontendState) => {
            this.setState({gameState: state, picker: null});
            if (state.gameInfo?.status === Status.Ok) {
                switch (state.gameInfo.lastPlay?.playerAction) {
                    case LastAction.DrawFour:
                    case LastAction.DrawSix:
                    case LastAction.DrawEight:
                        new Audio(audio[state.gameInfo.lastPlay.playerAction]).play();
                }
            }
        };
        this.props.io.onError = (err: ErrorResponse) => {
            // FIXME: allow some sort of a recovery
            window.alert(err.error);
        }
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
            elems.push(React.createElement(StartButton, {key: "startButton", startGame: this.props.io.startGame}));
        }

        // FIXME: This algorithm feels a bit clunky, I think it can be improved
        const lastPlace: string | undefined = (() => {
            if (typeof this.state.gameState.gameInfo === "undefined") {
                return;
            }

            const values = Object.entries(this.state.gameState.gameInfo.playerInfo);
            const playerCount = values.length;
            const index = values.findIndex(([_, info]) => typeof info.place === "undefined" ? false : info.place === playerCount);
            if (index !== -1) {
                return values[index][0];
            }
        })();

        elems.push(React.createElement(PlayerBox, {
            key: "playerbox",
            thisName: this.props.thisName,
            players: this.state.gameState.players,
            playerInfo: this.state.gameState.gameInfo?.playerInfo,
            whoseTurn: this.state.gameState.gameInfo?.who,
            lastPlace: lastPlace
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
            drawCard: this.props.io.drawCard,
            playCard: this.props.io.playCard,
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
                        this.props.io.playCard(new Card(this.state.picker!, Value.Svrsek), color);
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
