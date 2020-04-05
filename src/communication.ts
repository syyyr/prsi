import {ActionType, Card, LastPlay, PlayType, PlayDetails, Status} from "./types"
import {Place} from "./types";

export function isPlayerRegistration(toCheck: any): toCheck is PlayerRegistration {
    return typeof toCheck.registerPlayer !== "undefined";
}

export function isPlayerInput(toCheck: any): toCheck is PlayerInput {
    return typeof toCheck.playType !== "undefined";
}

export function isErrorResponse(toCheck: any): toCheck is ErrorResponse {
    return typeof toCheck.error !== "undefined";
}

export function isFrontendState(toCheck: any): toCheck is FrontendState {
    return typeof toCheck.players !== "undefined";
}

export function isStartGame(toCheck: any): toCheck is FrontendState {
    return typeof toCheck.startGame !== "undefined";
}

export class PlayerRegistration {
    registerPlayer: string;
    constructor(name: string) {
        this.registerPlayer = name;
    }
}

export class PlayerInput {
    playType: PlayType;
    playDetails?: PlayDetails;
    constructor(playType: PlayType, playDetails?: PlayDetails) {
        this.playType = playType;
        this.playDetails = playDetails;
    }
}

export class StartGame {
    startGame: null = null;
}

export class ErrorResponse {
    error: string;
    constructor(error: string) {
        this.error = error;
    }
}

export class FrontendInfo {
    wantedAction: ActionType;
    status: Status;
    who: string;
    playerInfo: {[key in string]: number | Place};
    topCard: Card;
    hand?: Card[];
    lastPlay?: LastPlay;
    constructor(wantedAction: ActionType, status: Status, who: string, topCard: Card, hand: Card[], playerInfo: {[key in string]: number | Place}) {
        this.wantedAction = wantedAction;
        this.status = status;
        this.who = who;
        this.topCard = topCard;
        this.hand = hand;
        this.playerInfo = playerInfo;
    }
}

export class FrontendState {
    gameStarted: "yes" | "no";
    players: string[];
    gameInfo?: FrontendInfo;
    constructor(gameStarted: "yes" | "no", players: string[], frontendInfo?: FrontendInfo) {
        this.gameStarted = gameStarted;
        this.players = players;
        this.gameInfo = frontendInfo;
    }
}
