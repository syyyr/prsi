import {Prsi, PlayerAction, PlayType, PlayDetails, Status} from "./prsi"

const prsi = new Prsi();
prsi.registerPlayer("Typek");
prsi.registerPlayer("Frajer");
prsi.registerPlayer("Lama");
prsi.newGame();
while (true) {
    const state = prsi.state();
    state.printHands();
    if (state.gameState === "ended") {
        break;
    }
    const player = state.whoseTurn;
    let status: Status = Status.Ok;
    state.hands.get(player)?.forEach((card) => {
        prsi.resolveAction(new PlayerAction(PlayType.Play, player, new PlayDetails(card)));
        status = prsi.state().status;
    }, false);

    if (status !== Status.Ok) {
        prsi.resolveAction(new PlayerAction(PlayType.Draw, player));
    }
}

console.log(prsi.state().gameResolution);
