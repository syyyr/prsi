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

export class UI extends React.Component<{io: PlayerInputOutput, thisName: string}, {gameState?: FrontendState, picker: null | Color, errorHighlight: boolean}> {
    private playReminderTimeout?: NodeJS.Timeout;
    private audioHandle?: HTMLAudioElement;
    private highlightTimeout?: NodeJS.Timeout;

    constructor(props: {io: any, thisName: string}) {
        super(props);
        // FIXME: look for a better solution for picker (don't save color of the played guy)
        this.state = {picker: null, errorHighlight: false};
        this.props.io.onState = (state: FrontendState) => {
            if (typeof this.highlightTimeout !== "undefined") {
                clearTimeout(this.highlightTimeout);
            }
            this.setState({gameState: state, picker: null, errorHighlight: false});
            if (state.gameInfo?.status === Status.Ok) {
                switch (state.gameInfo.lastPlay?.playerAction) {
                    case LastAction.DrawFour:
                    case LastAction.DrawSix:
                    case LastAction.DrawEight:
                        new Audio(audio[state.gameInfo.lastPlay.playerAction]).play();
                }
            } else {
                this.blink();
            }
        };
        this.props.io.onError = (err: ErrorResponse) => {
            // FIXME: allow some sort of a recovery
            window.alert(err.error);
        }
    }

    private blink(): void {
        this.setState({errorHighlight: true});
        const blinkingSpeed = 250;
        const blinker = (iterations: number) => {
            this.setState({errorHighlight: !this.state.errorHighlight});
            if (iterations < 2) {
                this.highlightTimeout = global.setTimeout(blinker, blinkingSpeed, iterations + 1);
            }
        };

        this.highlightTimeout = global.setTimeout(blinker, blinkingSpeed, 0);
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

    clearEffectTimeout() {
        if (typeof this.playReminderTimeout !== "undefined") {
            clearTimeout(this.playReminderTimeout);
            this.playReminderTimeout = undefined;
        }

        // Only clear if status is ok, that way the user can't just press random cards to stop the sound.
        if (typeof this.audioHandle !== "undefined" && this.state.gameState?.gameInfo?.status === Status.Ok) {
            this.audioHandle.pause();
            this.audioHandle = undefined;
        }
    }

    setEffectTimeout() {
        this.clearEffectTimeout();

        if (this.state.gameState?.gameInfo?.status === Status.Ok && this.state.gameState?.gameInfo?.who === this.props.thisName) {
            if (this.state.gameState.gameInfo.wantedAction === ActionType.Shuffle) {
                this.playReminderTimeout = global.setTimeout(() => {
                    window.alert("Mícháš.");
                }, 60000);
            } else {
                this.playReminderTimeout = global.setTimeout(() => {
                    this.audioHandle = new Audio(audio.playReminder);
                    this.audioHandle.play();
                }, 10000);
            }
        }
    }

    render(): React.ReactNode {
        this.clearEffectTimeout();

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
            openPicker: this.onTurn() && this.canPlaySvrsek() ?
                (svrsekColor: Color) => this.setState({picker: svrsekColor}) :
                (svrsekColor: Color) => this.props.io.playCard(new Card(this.state.picker!, Value.Svrsek), svrsekColor),
            hand: this.state.gameState.gameInfo.hand,
            forceHalo: this.state.errorHighlight
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

        this.setEffectTimeout();

        return elems;
    }
}
