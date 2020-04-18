import {ErrorResponse, PlayerRegistration, FrontendState, isErrorResponse, isFrontendState, PlayerInput, StartGame, PlayerUnregistration} from "../common/communication";
import {PlayType, Card, Color, PlayDetails} from "../common/types";

export default class PlayerInputOutput {
    ws: globalThis.WebSocket;
    onError: (message: ErrorResponse) => void = () => {};
    onState: (message: FrontendState) => void = () => {};
    onClose: (code: number) => void = () => {};
    self: PlayerInputOutput = this;
    constructor() {
        this.ws = new window.WebSocket(`ws${window.location.protocol === "https:" ? "s" : ""}://${window.location.host}`);
        this.ws.onopen = () => {
            console.log("ws opened");
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
}
