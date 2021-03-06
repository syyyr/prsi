import * as React from "react";
import {FrontendState, ErrorResponse, ErrorCode, BadStatus, Rooms, isFrontendState, FrontendConnected, KickResolution, KickState, KickResolutionEnum} from "../common/communication";
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
import ErrorDialog from "./components/errordialog";
import LeaveButton from "./components/leavebutton";
import RoomsComponent from "./components/rooms";
import Menu from "./components/menu";
import KickDialog from "./components/kickdialog";
import KickStateComponent from "./components/kickstate";
import {wsErrCodeToString, promptExit} from "./strings";

// FIXME: get rid of nulls, undefined works
interface UIState {
    nameDialog: boolean;
    kickDialog: boolean;
    kickInProgress?: {
        who: string;
        state: {
            [key in string]: boolean;
        }
    }
    gameState?: FrontendState | Rooms;
    status: Status;
    picker: null | Color;
    errorHighlight: boolean | null;
    error: {
        message: string;
        fatal: boolean;
        buttonText?: string;
    } | null;
}

export class UI extends React.Component<{}, UIState> {
    private playReminderTimeout?: number;
    private audioHandle?: HTMLAudioElement;
    private highlightTimeout?: number;
    private io: PlayerInputOutput;
    private thisName?: string;
    private thisRoom?: string;
    private kickTimeout?: {
        intervalHandle: number,
        secondsLeft: number;
    };

    constructor(props: {}) {
        super(props);
        this.io = new PlayerInputOutput();
        this.initIO();
        // FIXME: look for a better solution for picker (don't save color of the played guy)
        this.state = {picker: null, error: null, errorHighlight: false, nameDialog: false, kickDialog: false, status: Status.Ok};
        window.onbeforeunload = () => {
            this.clearEffectTimeout();
            if (this.playing()) {
                return promptExit;
            }
        };
    }

    private readonly insideRoom = (state?: FrontendState | Rooms): state is FrontendState => {
        return isFrontendState(state);
    }

    private readonly playing = (): boolean => {
        if (this.insideRoom(this.state.gameState)) {
            return this.state.error?.fatal !== true &&
                typeof this.thisName !== "undefined" &&
                typeof this.state.gameState?.gameInfo?.hand?.length !== "undefined" &&
                this.state.gameState.gameInfo.hand.length !== 0;
        }

        throw new Error("playing: Not inside a room");
    }

    private readonly initIO = (): void => {
        this.io.onState = (state: FrontendState) => {
            if (typeof this.highlightTimeout !== "undefined") {
                window.clearTimeout(this.highlightTimeout);
                this.highlightTimeout = undefined;
            }
            this.setState({
                error: null,
                nameDialog: typeof this.thisName !== "undefined" ? false : this.state.nameDialog,
                gameState: state,
                picker: null,
                errorHighlight: null,
                status: Status.Ok
            });
            if (typeof state.gameInfo !== "undefined") {
                switch (state.gameInfo.lastPlay?.playerAction) {
                    case LastAction.DrawFour:
                    case LastAction.DrawSix:
                    case LastAction.DrawEight:
                        new Audio(audio[state.gameInfo.lastPlay.playerAction]).play();
                }

                if (state.gameInfo.lastPlay?.didWin && state.gameInfo.lastPlay.who == this.thisName) {
                    new Audio(audio.win).play();
                }

                if (typeof state.gameInfo.loser !== "undefined"
                    && state.gameInfo.loser === this.thisName
                    && state.gameInfo.lastPlay?.playerAction !== LastAction.Disconnect) {
                    new Audio(audio.lose).play();
                }
            }
        };

        this.io.onBadStatus = (status: BadStatus) => {
            this.setState({status: status.badStatus});
            this.blink();
        };

        this.io.onRooms = (rooms: Rooms) => {
            this.setState({gameState: rooms});
        };

        this.io.onPlayerConnect = (message: FrontendConnected) => {
            if (this.insideRoom(this.state.gameState)) {
                this.setState({
                    gameState: {
                        ...this.state.gameState,
                        players: [...this.state.gameState.players, message.connected],
                        stats: message.stats
                    },
                    nameDialog: message.connected === this.thisName ? false : this.state.nameDialog
                });
            }
        };

        this.io.onKickResolution = (message: KickResolution) => {
            if (this.state.kickInProgress?.who === this.thisName && message.kickResolution === KickResolutionEnum.Kicked) {
                this.thisName = undefined;
            }

            this.setState({kickInProgress: undefined});
        };

        this.io.onKickState = (message: KickState) => {
            if (typeof this.kickTimeout === "undefined") {
                const countDowner = () => {
                    if (this.kickTimeout!.secondsLeft === 0) {
                        window.clearTimeout(this.kickTimeout!.intervalHandle);
                        this.kickTimeout = undefined;
                    };
                }

                this.kickTimeout = {
                    secondsLeft: 30,
                    intervalHandle: window.setInterval(countDowner, 1000)
                }
            }
            this.setState({kickInProgress: {state: message.kickState, who: message.who}, kickDialog: false});
        };

        this.io.onError = (err: ErrorResponse) => {
            if (err.code === ErrorCode.NameAlreadyUsed) {
                this.thisName = undefined;
                this.openNameDialog();
            }
            this.showError(err.error, "OK");
        };

        this.io.onClose = (code: number) => {
            this.setState({picker: null});
            this.showError(`Byls odpojen. Kód: ${code}. Důvod: ${wsErrCodeToString(code)}`, "Připojit se znovu", "fatal");
            if (typeof this.playReminderTimeout !== "undefined") {
                window.clearTimeout(this.playReminderTimeout);
            }
        };
    }

    private readonly blink = (): void => {
        if (typeof this.highlightTimeout !== "undefined") {
            return;
        }
        this.setState({errorHighlight: this.onTurn() ? false : true});
        const blinkingSpeed = 250;
        const blinker = (iterations: number) => {
            this.setState({errorHighlight: !this.state.errorHighlight});
            if (iterations < 2) {
                this.highlightTimeout = window.setTimeout(blinker, blinkingSpeed, iterations + 1);
            } else {
                this.highlightTimeout = window.setTimeout(() => {
                    this.setState({errorHighlight: null}), blinkingSpeed;
                    this.highlightTimeout = undefined;
                });
            }
        };

        this.highlightTimeout = window.setTimeout(blinker, blinkingSpeed, 0);
    }

    private readonly onTurn = (): boolean => {
        if (this.insideRoom(this.state.gameState)) {
            return this.state.gameState!.gameInfo!.who === this.thisName;
        }

        throw new Error("onTurn: Not inside a room");
    }

    private readonly canPlaySvrsek = (): boolean => {
        if (this.insideRoom(this.state.gameState)) {
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

        throw new Error("canPlaySvrsek: Not inside a room");
    }

    private readonly createStats = (stats: { [x: string]: number[]; }): React.ReactNode | undefined => {
        if (this.insideRoom(this.state.gameState)) {
            if (this.state.gameState?.players.length !== 0) {
                return React.createElement(Stats, {key: "stats", stats});
            }
            return;
        }

        throw new Error("createStats: Not inside a room");
    }

    private readonly clearEffectTimeout = () => {
        if (typeof this.playReminderTimeout !== "undefined") {
            window.clearTimeout(this.playReminderTimeout);
            this.playReminderTimeout = undefined;
        }

        // Only clear if status is ok, that way the user can't just press random cards to stop the sound.
        if (typeof this.audioHandle !== "undefined" && this.state.status === Status.Ok) {
            this.audioHandle.pause();
            this.audioHandle = undefined;
        }
    }

    private readonly setEffectTimeout = () => {
        if (this.insideRoom(this.state.gameState)) {
            this.clearEffectTimeout();

            if (this.state.status === Status.Ok && this.state.gameState?.gameInfo?.who === this.thisName) {
                if (this.state.gameState?.gameInfo?.wantedAction === ActionType.Shuffle) {
                    this.playReminderTimeout = window.setTimeout(() => {
                        window.alert("Mícháš.");
                    }, 60000);
                } else {
                    this.playReminderTimeout = window.setTimeout(() => {
                        this.audioHandle = new Audio(audio.playReminder);
                        this.audioHandle.play();
                    }, 10000);
                }
            }
            return;
        }

        throw new Error("setEffectTimeout: Not inside a room");
    }

    private readonly reconnect = (): void => {
        this.showError("Připojování...", undefined, "fatal");
        this.io = new PlayerInputOutput(() => {
            this.setState({kickInProgress: undefined});
            if (typeof this.thisRoom !== "undefined") {
                this.io.joinRoom(this.thisRoom);
                if (typeof this.thisName !== "undefined") {
                    this.io.registerPlayer(this.thisName);
                }
            }
        });
        this.initIO();
    }

    private readonly openKickDialog = (): void => {
        this.setState({kickDialog: true});
    }

    private readonly closeKickDialog = (): void => {
        this.setState({kickDialog: false});
    }

    private readonly openNameDialog = (): void => {
        this.setState({nameDialog: true});
    }

    private readonly closeNameDialog = (): void => {
        this.setState({nameDialog: false});
    }

    private readonly showError = (message: string, buttonText?: string, fatal?: "fatal"): void => {
        this.setState({error: {
            message: message,
            fatal: fatal === "fatal",
            buttonText: buttonText
        }});
    }

    private readonly clearError = (): void => {
        this.setState({error: null});
    }

    private readonly openPicker = (svrsekColor: Color): void => {
        if (this.onTurn() && this.canPlaySvrsek()) {
            this.setState({picker: svrsekColor});
        } else {
            this.io.playCard(new Card(this.state.picker!, Value.Svrsek), svrsekColor);
        }
    }

    private readonly playSvrsek = (color: Color) => {
        this.io.playCard(new Card(this.state.picker!, Value.Svrsek), color);
        this.closePicker();
    }

    private readonly closePicker = (event?: MouseEvent) => {
        if (typeof event !== "undefined") {
            event.stopPropagation();
        }
        this.setState({picker: null});
    }

    private readonly leaveGame = () => {
        if (this.playing()) {
            if (!window.confirm(promptExit)) {
                return;
            }
        }
        if (typeof this.thisName === "undefined") {
            this.showError("Už jsi opustil hru. (jak se ti povedlo ji opustit znova?)");
            return;
        }

        const name = this.thisName;
        // I need to unset the name first so that state update won't happen before that.
        this.thisName = undefined;
        this.io.unregisterPlayer(name);
    }

    private readonly joinGame = (name: string) => {
        this.io.registerPlayer(name);
        window.localStorage.setItem("name", name);
        this.thisName = name;
    }

    private readonly joinRoom = (name: string) => {
        this.io.joinRoom(name);
        this.thisRoom = name;
    }

    private renderState = (gameState: FrontendState): React.ReactNode[] => {
        this.clearEffectTimeout();
        const elems = [];
        const buttons = [];

        if (gameState.gameStarted === "no" && gameState.players.length >= 2 && typeof this.thisName !== "undefined") {
            buttons.push(React.createElement(StartButton, {key: "startButton", startGame: this.io.startGame}));
        }

        if (typeof this.thisName === "undefined") {
            buttons.push(React.createElement(JoinButton, {key: "joinButton", openDialog: this.openNameDialog}));
        } else {
            buttons.push(React.createElement(LeaveButton, {key: "leaveButton", leaveGame: this.leaveGame}));
            elems.push(React.createElement(Menu, {key: "menu", openKickDialog: this.openKickDialog}));
        }

        if (typeof this.state.kickInProgress !== "undefined") {
            // FIXME: get rid of null enforce
            elems.push(React.createElement(KickStateComponent, {key: "kickState", kickState: this.state.kickInProgress, vote: this.io.voteKick, secondsLeft: this.kickTimeout!.secondsLeft}));
        }

        elems.push(React.createElement("div", {key: "buttonHolder", className: "flex-row button-holder"}, buttons));

        elems.push(React.createElement(PlayerBox, {
            key: "playerbox",
            thisName: this.thisName,
            players: gameState.players,
            playerInfo: gameState.gameInfo?.playerInfo,
            whoseTurn: gameState.gameInfo?.who,
            lastPlace: gameState.gameInfo?.loser
        }));

        if (this.state.nameDialog) {
            const lastName = window.localStorage.getItem("name") || undefined;
            elems.push(React.createElement(NameDialog, {
                key: "nameDialog",
                confirmName: this.joinGame,
                closeDialog: this.closeNameDialog,
                initialValue: lastName
            }));
        }

        if (this.state.kickDialog) {
            elems.push(React.createElement(KickDialog, {
                key: "kickDialog",
                players: gameState.players,
                kickPlayer: this.io.initiateKick,
                closeDialog: this.closeKickDialog,
            }));
        }

        if (this.state.error !== null) {
            elems.push(React.createElement(ErrorDialog, {
                key: "errorDialog",
                error: this.state.error.message,
                fatal: this.state.error.fatal,
                buttonText: this.state.error.buttonText,
                closeDialog: !this.state.error.fatal ?
                    this.clearError :
                    this.reconnect
            }));
        }

        if (typeof gameState.gameInfo === "undefined") {
            elems.push(React.createElement(Prompt, {
                key: "prompt",
                instructions: gameState.players.length < 2 ? "Čeká se alespoň na dva hráče." : "Stisknutím Start se spustí hra."
            }));
            elems.push(this.createStats(gameState.stats));
            return elems;
        }

        elems.push(React.createElement(Instructions, {
            key: "instructions",
            wantedAction: gameState.gameInfo.wantedAction,
            status: this.state.status,
            you: this.thisName,
            whoseTurn: gameState.gameInfo.who,
            topCard: gameState.gameInfo.topCards[gameState.gameInfo.topCards.length - 1],
            lastPlay: gameState.gameInfo.lastPlay
        }));

        elems.push(React.createElement(Game, {
            key: "playfield",
            onTurn: this.onTurn(),
            drawCard: this.io.drawCard,
            playCard: this.io.playCard,
            wantedAction: gameState.gameInfo.wantedAction,
            lastPlay: gameState.gameInfo.lastPlay,
            topCards: gameState.gameInfo.topCards,
            openPicker: this.openPicker,
            hand: gameState.gameInfo.hand,
            forceHalo: this.state.errorHighlight !== null ? this.state.errorHighlight : undefined
        }));
        elems.push(this.createStats(gameState.stats));

        if (this.state.picker !== null) {
            elems.push(React.createElement(
                ColorPicker,
                {
                    key: "picker",
                    pickColor: this.playSvrsek,
                    closePicker: this.closePicker
                }
            ));
        }

        this.setEffectTimeout();

        return elems;
    }

    readonly render = (): React.ReactNode => {

        const elems = [];
        elems.push(React.createElement(Title, {key: "title"}, null));
        if (typeof this.state.gameState === "undefined") {
            return elems;
        }

        if (this.insideRoom(this.state.gameState)) {
            elems.push(...this.renderState(this.state.gameState));
        } else {
            elems.push(React.createElement(RoomsComponent, {key: "rooms", rooms: this.state.gameState, joinRoom: this.joinRoom}));
        }


        return elems;
    }
}
