import {ErrorResponse, PlayerRegistration, FrontendState, isErrorResponse, isFrontendState, PlayerInput, StartGame} from "../common/communication";
import {PlayType, Card, Color, PlayDetails} from "../common/types";

export default class PlayerInputOutput {
    ws: any;
    onError: (message: ErrorResponse) => void = () => {};
    onState: (message: FrontendState) => void = () => {};
    self: PlayerInputOutput = this;
    constructor(playerName: string) {
        this.ws = new window.WebSocket(`ws${window.location.protocol === "https:" ? "s" : ""}://${window.location.host}`);
        this.ws.onopen = () => {
            console.log("ws opened");
            this.ws.send(JSON.stringify(new PlayerRegistration(playerName!)));
        };

        this.ws.onmessage = (message: any) => {
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

        this.ws.onclose = () => {
            console.log("ws closed");
        };
    }

    // These have to be specified as properties, otherwise they lose the meaning of `this`.
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
