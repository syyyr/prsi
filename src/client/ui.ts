import * as React from "react";
import {FrontendState, FrontendStats, ErrorResponse, ErrorCode} from "../common/communication";
import {Card, Value, Color, ActionType, Status, LastAction} from "../common/types";
import ColorPicker from "./components/colorpicker";
import Game from "./components/game";
import PlayerBox from "./components/playerbox";
import Prompt from "./components/prompt";
import StartButton from "./components/startbutton";
import Stats from "./components/stats";
import Title from "./components/title";
import Instructions from "./components/instructions";
import JoinButton from "./components/joinbutton";
import {audio} from "./sounds";
import PlayerInputOutput from "./io";
import NameDialog from "./components/namedialog";

export class UI extends React.Component<{}, {nameDialog: boolean, gameState?: FrontendState, picker: null | Color, errorHighlight: boolean | null}> {
    // FIXME: use browser setTimeout
    private playReminderTimeout?: NodeJS.Timeout;
    private audioHandle?: HTMLAudioElement;
    private highlightTimeout?: NodeJS.Timeout;
    private io: PlayerInputOutput;
    private thisName?: string;

    constructor(props: {}) {
        super(props);
        this.io = new PlayerInputOutput();
        this.io.onState = (state: FrontendState) => {
            if (typeof this.highlightTimeout !== "undefined") {
                clearTimeout(this.highlightTimeout);
            }
            this.setState({gameState: state, picker: null, errorHighlight: null});
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
        this.io.onError = (err: ErrorResponse) => {
            if (err.code === ErrorCode.NameAlreadyUsed) {
                this.thisName = undefined;
                this.setState({nameDialog: true});
            }
            window.alert(err.error);
        }
        // FIXME: look for a better solution for picker (don't save color of the played guy)
        this.state = {picker: null, errorHighlight: false, nameDialog: false};
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
        return this.state.gameState!.gameInfo!.who === this.thisName;
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

        if (this.state.gameState?.gameInfo?.status === Status.Ok && this.state.gameState?.gameInfo?.who === this.thisName) {
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
            elems.push(React.createElement(StartButton, {key: "startButton", startGame: this.io.startGame}));
        }

        if (typeof this.thisName === "undefined") {
            elems.push(React.createElement(JoinButton, {key: "joinButton", openDialog: () => this.setState({nameDialog: true})}));
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
            thisName: this.thisName,
            players: this.state.gameState.players,
            playerInfo: this.state.gameState.gameInfo?.playerInfo,
            whoseTurn: this.state.gameState.gameInfo?.who,
            lastPlace: lastPlace
        }));

        if (this.state.nameDialog) {
            const confirmName = (name: string) => {
                this.setState({nameDialog: false});
                this.io.registerPlayer(name);
                window.localStorage.setItem("name", name);
                this.thisName = name;
            };

            const lastName = window.localStorage.getItem("name") || undefined;
            elems.push(React.createElement(NameDialog, {
                confirmName,
                closeDialog: () => this.setState({nameDialog: false}),
                initialValue: lastName
            }));
        }

        if (typeof this.state.gameState.gameInfo === "undefined") {
            elems.push(React.createElement(Prompt, {key: "prompt", instructions: "Hra nezačala."}));
            elems.push(this.createStats(this.state.gameState.stats));
            return elems;
        }

        elems.push(React.createElement(Instructions, {
            key: "instructions",
            wantedAction: this.state.gameState.gameInfo.wantedAction,
            status: this.state.gameState.gameInfo.status,
            you: this.thisName,
            whoseTurn: this.state.gameState.gameInfo.who,
            topCard: this.state.gameState.gameInfo.topCards[this.state.gameState.gameInfo.topCards.length - 1],
            lastPlay: this.state.gameState.gameInfo.lastPlay
        }));

        elems.push(React.createElement(Game, {
            key: "playfield",
            onTurn: this.onTurn(),
            drawCard: this.io.drawCard,
            playCard: this.io.playCard,
            wantedAction: this.state.gameState.gameInfo.wantedAction,
            topCards: this.state.gameState.gameInfo.topCards,
            openPicker: this.onTurn() && this.canPlaySvrsek() ?
                (svrsekColor: Color) => this.setState({picker: svrsekColor}) :
                (svrsekColor: Color) => this.io.playCard(new Card(this.state.picker!, Value.Svrsek), svrsekColor),
            hand: this.state.gameState.gameInfo.hand,
            forceHalo: this.state.errorHighlight !== null ? this.state.errorHighlight : undefined
        }));
        elems.push(this.createStats(this.state.gameState.stats));

        if (this.state.picker !== null) {
            elems.push(React.createElement(
                ColorPicker,
                {
                    key: "picker",
                    pickColor: (color: Color) => {
                        this.io.playCard(new Card(this.state.picker!, Value.Svrsek), color);
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
