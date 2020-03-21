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
    // TODO: add proper check
    return true;
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

export class Response {
}

export class ErrorResponse extends Response {
    error: string;
    constructor(error: string) {
        super();
        this.error = error;
    }
}

export class FrontendState extends Response {
    // TODO: add what frontend needs
}
