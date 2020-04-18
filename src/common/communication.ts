import {ActionType, Card, LastPlay, PlayType, PlayDetails, Status} from "./types"
import {Place} from "./types";

export function isPlayerRegistration(toCheck: any): toCheck is PlayerRegistration {
    return typeof toCheck.registerPlayer !== "undefined";
}

export function isPlayerUnregistration(toCheck: any): toCheck is PlayerUnregistration {
    return typeof toCheck.unregisterPlayer !== "undefined";
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

export class PlayerUnregistration {
    unregisterPlayer: string;
    constructor(name: string) {
        this.unregisterPlayer = name;
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

export enum ErrorCode {
    NameAlreadyUsed
}

export class ErrorResponse {
    error: string;
    code?: ErrorCode;
    constructor(error: string, code?: ErrorCode) {
        this.error = error;
        this.code = code;
    }
}

export class FrontendInfo {
    wantedAction: ActionType;
    status: Status;
    who: string;
    playerInfo: {[key in string]: {cards?: number, place?: Place}};
    topCards: Card[];
    hand?: Card[];
    lastPlay?: LastPlay;
    loser?: string;
    constructor(wantedAction: ActionType, status: Status, who: string, topCards: Card[], hand: Card[], playerInfo: {[key in string]: {cards?: number, place?: Place}}) {
        this.wantedAction = wantedAction;
        this.status = status;
        this.who = who;
        this.topCards = topCards;
        this.hand = hand;
        this.playerInfo = playerInfo;
    }
}

export class FrontendStats {
    successRate: number;
    gamesPlayed: number;
    constructor(successRate: number, gamesPlayed: number) {
        this.successRate = successRate;
        this.gamesPlayed = gamesPlayed;
    }
}

export class FrontendState {
    gameStarted: "yes" | "no";
    players: string[];
    gameInfo?: FrontendInfo;
    stats: {[key in string]: FrontendStats} = {};
    constructor(gameStarted: "yes" | "no", players: string[], frontendInfo?: FrontendInfo) {
        this.gameStarted = gameStarted;
        this.players = players;
        this.gameInfo = frontendInfo;
    }
}
