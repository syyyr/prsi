import Prsi from "./server/backend";
import {Color, PlayType, PlayDetails, Status, PlayerAction, ActionType} from "./common/types";

const prsi = new Prsi();
prsi.registerPlayer("Typek");
prsi.registerPlayer("Frajer");
prsi.registerPlayer("Lama");
prsi.newGame();
// eslint-disable-next-line no-constant-condition
while (true) {
    const state = prsi.state();
    state!.printHands();
    if (state!.wantedAction === ActionType.Shuffle) {
        break;
    }
    const player = state!.whoseTurn;
    let status: Status = Status.Ok;
    state!.hands.get(player)?.forEach((card) => {
        status = prsi.resolveAction(
            new PlayerAction(
                PlayType.Play,
                player,
                new PlayDetails(
                    card,
                    [Color.Kule, Color.Listy, Color.Srdce, Color.Zaludy][Math.floor(Math.random() * 4)])));
    }, false);

    if (status !== Status.Ok) {
        prsi.resolveAction(new PlayerAction(PlayType.Draw, player));
    }
}
