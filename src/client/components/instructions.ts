import * as React from "react";
import {Card, ActionType, Status, LastPlay} from "../../common/types";
import {cardsGenitive, instructionStrings, lastPlayStrings, colorStrings, values} from "../strings";
import Prompt from "./prompt";

interface InstructionsProps {
    wantedAction: ActionType;
    status: Status;
    you?: string;
    whoseTurn: string;
    topCard: Card;
    lastPlay?: LastPlay;
}

export default class Instructions extends React.PureComponent<InstructionsProps> {
    render(): React.ReactNode {
        const lastPlay = this.props.lastPlay;
        const you = this.props.you;
        const wantedAction = this.props.wantedAction;
        const status = this.props.status;
        const topCard = this.props.topCard;
        const whoseTurn = this.props.whoseTurn;

        const lastPlayStr = status !== Status.Ok || typeof lastPlay === "undefined" ? undefined :
            lastPlayStrings[lastPlay.playerAction][you === lastPlay.who ? "you" : "other"]
            .replace("@PLAYERNAME@", lastPlay.who)
            .replace("@COLORCHANGE@", typeof lastPlay.playDetails === "undefined" ? "PLAYDETAILS unavailable" :
                typeof lastPlay.playDetails.colorChange === "undefined" ? "COLORCHANGE unavailable" :
                colorStrings[lastPlay.playDetails.colorChange])
            .replace("@CARDS_GENITIVE@", typeof lastPlay.playDetails === "undefined"? "CARD unavailable" :
                cardsGenitive[lastPlay.playDetails.card.color][lastPlay.playDetails.card.value])
            .replace("@RETURN@", typeof lastPlay.playDetails === "undefined" || typeof lastPlay.playDetails.returned === "undefined" ? "RETURN unavailable" :
                lastPlay.playDetails.returned)
            .replace(/\.$/, !lastPlay.didWin ? "." : lastPlay.who === you ? " a vyhráls." : " a vyhrál.");
        const instructions = instructionStrings[wantedAction][status][you === whoseTurn ? "you" : "other"]
            .replace("@PLAYERNAME@", whoseTurn)
            .replace("@TOPCOLOR@", colorStrings[topCard.color])
            .replace("@TOPVALUE@", values[topCard.value]);
        return React.createElement(Prompt, {instructions: `${typeof lastPlayStr !== "undefined" ? `${lastPlayStr} ` : ""}${instructions}`});
    }
}
