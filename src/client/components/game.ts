import * as React from "react";
import DrawButton from "./drawbutton";
import {Card, Color, Value, ActionType, changeActionToColor} from "../../common/types";
import Hand from "./hand";
import PlayedCards from "./playedcards";
import {CardTooltip} from "../strings";
import Logo from "./logo";

const isColorChange = (action: ActionType) => {
    switch (action) {
    case ActionType.PlayListy:
    case ActionType.PlayZaludy:
    case ActionType.PlaySrdce:
    case ActionType.PlayKule:
        return true;
    default:
        return false;
    }
}

const isDrawX = (action: ActionType) => {
    switch (action) {
    case ActionType.DrawTwo:
    case ActionType.DrawFour:
    case ActionType.DrawSix:
    case ActionType.DrawEight:
        return true;
    default:
        return false;
    }
}

interface PlayFieldProps {
    onTurn: boolean;
    drawCard: () => void;
    playCard: (card: Card) => void;
    openPicker: (svrsekColor: Color) => void;
    wantedAction: ActionType;
    topCards: Card[];
    hand?: Card[];
    forceHalo?: boolean;
}

interface CoreGameProps {
    onTurn: boolean;
    topCards: Card[];
    wantedAction: ActionType;
    shouldDrawDrawButton: boolean;
    drawCard: () => void;
}

class PlayField extends React.Component<CoreGameProps> {
    private genTooltip() {
        const card = this.props.topCards[this.props.topCards.length - 1];
        if (!this.props.onTurn) {
            return;
        }
        if (card.value === Value.Eso && this.props.wantedAction !== ActionType.SkipTurn) {
            return CardTooltip.NoSkip;
        }
        if (card.value === Value.Sedmicka && !isDrawX(this.props.wantedAction)) {
            return CardTooltip.NoDraw;
        }
    }

    render(): React.ReactNode {
        const res = [];

        if (this.props.shouldDrawDrawButton) {
            res.push(React.createElement(DrawButton, {
                key: "drawButton",
                callback: this.props.drawCard,
                wantedAction: this.props.wantedAction,
                shouldDrawTooltip: this.props.onTurn || this.props.wantedAction === ActionType.Shuffle
            }));
        }

        res.push(React.createElement(PlayedCards, {
            key: "topCards",
            cards: this.props.topCards,
            colorChange: isColorChange(this.props.wantedAction) ? changeActionToColor(this.props.wantedAction) : undefined,
            tooltip: this.genTooltip()
        }));
        return React.createElement("div", {className: "topCard-container flex-row"}, res);
    }
}

export default class Game extends React.Component<PlayFieldProps> {
    render(): React.ReactNode {
        const playfield = [];
        playfield.push(React.createElement(PlayField, {
            key: "topPlayfield",
            onTurn: this.props.onTurn,
            topCards: this.props.topCards,
            wantedAction: this.props.wantedAction,
            shouldDrawDrawButton: typeof this.props.hand !== "undefined",
            drawCard: this.props.drawCard
        }));

        playfield.push(React.createElement(Logo, {key: "logo"}));

        if (typeof this.props.hand !== "undefined") {
            playfield.push(React.createElement(Hand, {
                key: "hand",
                hand: this.props.hand,
                playCard: this.props.playCard,
                openPicker: this.props.openPicker
            }));
        }

        const shouldDrawHalo = typeof this.props.forceHalo !== "undefined" ? this.props.forceHalo : this.props.onTurn;

        return React.createElement("div", {
            className: `playfield${shouldDrawHalo ? " big-red-halo" : ""}`}, playfield);
    }
}
