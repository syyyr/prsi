import {ErrorResponse, PlayerRegistration, FrontendState, isErrorResponse, isFrontendState, isKickResolution, PlayerInput, StartGame, PlayerUnregistration, BadStatus, isBadStatus, Rooms, isRooms, JoinRoom, FrontendConnected, isFrontendConnected, VoteKick, Vote, KickResolution, KickState, isKickState} from "../common/communication";
import {PlayType, Card, Color, PlayDetails} from "../common/types";

export default class PlayerInputOutput {
    ws: globalThis.WebSocket;
    onError: (message: ErrorResponse) => void = () => {};
    onState: (message: FrontendState) => void = () => {};
    onRooms: (message: Rooms) => void = () => {};
    onBadStatus: (message: BadStatus) => void = () => {};
    onPlayerConnect: (message: FrontendConnected) => void = () => {};
    onKickState: (message: KickState) => void = () => {};
    onKickResolution: (message: KickResolution) => void = () => {};
    onClose: (code: number) => void = () => {};
    self: PlayerInputOutput = this;
    constructor(onOpen?: () => void) {
        this.ws = new window.WebSocket(`ws${window.location.protocol === "https:" ? "s" : ""}://${window.location.host}`);
        this.ws.onopen = () => {
            console.log("ws opened");
            if (typeof onOpen !== "undefined") {
                onOpen();
            }
        };

        this.ws.onmessage = (message: MessageEvent) => {
            const parsed = JSON.parse(message.data);
            console.log("response from server:", parsed);

            if (isErrorResponse(parsed)) {
                this.onError(parsed);
                return;
            }

            if (isFrontendState(parsed)) {
                this.onState(parsed);
                return;
            }

            if (isBadStatus(parsed)) {
                this.onBadStatus(parsed);
                return;
            }

            if (isFrontendConnected(parsed)) {
                this.onPlayerConnect(parsed);
                return;
            }

            if (isRooms(parsed)) {
                this.onRooms(parsed);
                return;
            }

            if (isKickState(parsed)) {
                this.onKickState(parsed);
                return;
            }

            if (isKickResolution(parsed)) {
                this.onKickResolution(parsed);
                return;
            }
        };

        this.ws.onclose = (event: CloseEvent) => {
            console.log("ws closed");
            this.onClose(event.code);
        };
    }

    // These have to be specified as properties, otherwise they lose the meaning of `this`.
    readonly unregisterPlayer = (name: string): void => {
        this.ws.send(JSON.stringify(new PlayerUnregistration(name)));
    };

    readonly registerPlayer = (name: string): void => {
        this.ws.send(JSON.stringify(new PlayerRegistration(name)));
    };

    readonly drawCard = (): void => {
        this.ws.send(JSON.stringify(new PlayerInput(PlayType.Draw)));
    };

    readonly startGame = (): void => {
        this.ws.send(JSON.stringify(new StartGame()));
    }

    readonly playCard = (card: Card, colorChange?: Color): void => {
        this.ws.send(JSON.stringify(new PlayerInput(PlayType.Play, new PlayDetails(card, colorChange))));
    };

    readonly joinRoom = (name: string): void => {
        this.ws.send(JSON.stringify(new JoinRoom(name)));
    };

    readonly initiateKick = (name: string): void => {
        this.ws.send(JSON.stringify(new VoteKick(name)));
    };

    readonly voteKick = (vote: boolean): void => {
        this.ws.send(JSON.stringify(new Vote(vote)));
    };
}
