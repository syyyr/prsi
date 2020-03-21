import {Card} from "./types"

export function isPlayerRegistration(toCheck: any): toCheck is PlayerRegistration {
    return typeof toCheck.registerPlayer !== "undefined";
}

export function isPlayerInput(toCheck: any): toCheck is PlayerInput {
    return typeof toCheck.playerInput !== "undefined";
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
    name: string;
    playerInput: string;
    constructor(name: string, playerInput: string) {
        this.name = name;
        this.playerInput = playerInput;
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

export class FrontendState {
    gameStarted: "yes" | "no";
    players: string[];
    topCard?: Card;
    hand?: Card[];
    constructor(gameStarted: "yes" | "no", players: string[], topCard?: Card, hand?: Card[]) {
        this.gameStarted = gameStarted;
        this.players = players;
        this.topCard = topCard;
        this.hand = hand;
    }
}
