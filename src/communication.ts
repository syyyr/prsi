export function isPlayerRegistration(toCheck: any): toCheck is PlayerRegistration {
    return typeof toCheck.name !== "undefined";
}

export function isToken(toCheck: any): toCheck is Token {
    return typeof toCheck.token !== "undefined";
}

export class PlayerRegistration {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}

export enum ConnStatus {
    Ok,
    InvalidRequest,
}

export class Response {
    status: ConnStatus;
    constructor(status: ConnStatus) {
        this.status = status;
    }
}

export class Token extends Response {
    token: string;
    constructor(token: string) {
        super(ConnStatus.Ok);
        this.token = token;
    }
}
