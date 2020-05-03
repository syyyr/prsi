import {ActionType, Card, LastPlay, PlayType, PlayDetails, Status} from "./types";

export function isJoinRoom(toCheck: any): toCheck is JoinRoom {
    return typeof toCheck.joinRoom !== "undefined";
}

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

export function isFrontendConnected(toCheck: any): toCheck is FrontendConnected {
    return typeof toCheck.connected !== "undefined";
}

export function isRooms(toCheck: any): toCheck is Rooms {
    return typeof toCheck.rooms !== "undefined";
}

export function isBadStatus(toCheck: any): toCheck is BadStatus {
    return typeof toCheck.badStatus !== "undefined";
}

export function isStartGame(toCheck: any): toCheck is FrontendState {
    return typeof toCheck.startGame !== "undefined";
}

export class FrontendConnected {
    connected: string;
    stats: {[key in string]: FrontendStats};
    constructor(connected: string, stats: {[key in string]: FrontendStats}) {
        this.connected = connected;
        this.stats = stats;
    }
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

export class JoinRoom {
    joinRoom: string;
    constructor(joinRoom: string) {
        this.joinRoom = joinRoom;
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
    who: string;
    playerInfo: {[key in string]: {cards?: number, place?: number}};
    topCards: Card[];
    hand?: Card[];
    lastPlay?: LastPlay;
    loser?: string;
    constructor(wantedAction: ActionType, who: string, topCards: Card[], hand: Card[], playerInfo: {[key in string]: {cards?: number, place?: number}}) {
        this.wantedAction = wantedAction;
        this.who = who;
        this.topCards = topCards;
        this.hand = hand;
        this.playerInfo = playerInfo;
    }
}

export class BadStatus {
    badStatus: Status;
    constructor(status: Status) {
        this.badStatus = status;
    }
}

export class FrontendStats {
    acquiredPts: number[];
    constructor(acquiredPts: number[]) {
        this.acquiredPts = acquiredPts;
    }
}

export class Rooms {
    rooms: {[key in string]: string[]};
    constructor(rooms: {[key in string]: string[]}) {
        this.rooms = rooms;
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
