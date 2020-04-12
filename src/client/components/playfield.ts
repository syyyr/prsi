import * as React from "react";
import DrawButton from "./drawbutton";
import {Card, Color, Value, ActionType, changeActionToColor} from "../../common/types";
import {CardTooltip} from "../strings";
import CardComponent from "./card";

class Hand extends React.Component<{hand: Card[], playCard: (card: Card) => void, openPicker: (svrsekColor: Color) => void}> {
    render(): React.ReactNode {
        return React.createElement("div", {className: "flex-row hand-container"}, this.props.hand.map((card, index) => React.createElement(CardComponent, {
            key: `hand:${index}`,
            card: card,
            options: {
                isBottomCard: "bottom",
                halo: "halo",
                onClick: () => {
                    if (card.value === Value.Svrsek) {
                        this.props.openPicker(card.color);
                        return;
                    }
                    this.props.playCard(card);
                }
            }
        })));
    }
}

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
}

export default class PlayField extends React.Component<PlayFieldProps> {
    render(): React.ReactNode {
        const playfield = [];
        const topCard = [];

        // FIXME: look at this
        if (typeof this.props.hand !== "undefined") {
            topCard.push(React.createElement(DrawButton, {
                callback: this.props.drawCard,
                wantedAction: this.props.wantedAction,
                // FIXME: Fix this, somehow
                shouldDrawTooltip: this.props.onTurn || this.props.wantedAction === ActionType.Shuffle
            }));
        }

        topCard.push(React.createElement("div", {className: "relative"}, this.props.topCards.map((card, index, array) => {
            const firstCardOptions: {isBottomCard?: "bottom"} = {
                isBottomCard: index === 0 ? "bottom" : undefined
            };
            const lastCardOptions = index === array.length - 1 ? {
                colorChange: isColorChange(this.props.wantedAction) ? changeActionToColor(this.props.wantedAction) : undefined,
                tooltip: (() => {
                    // FIXME: Refactor to method
                    if (!this.props.onTurn) {
                        return;
                    }
                    if (card.value === Value.Eso && this.props.wantedAction !== ActionType.SkipTurn) {
                        return CardTooltip.NoSkip;
                    }
                    if (card.value === Value.Sedmicka && !isDrawX(this.props.wantedAction)) {
                        return CardTooltip.NoDraw;
                    }
                })()
            } : {};


            return React.createElement(CardComponent, {
                card: card,
                options: {
                ...firstCardOptions,
                ...lastCardOptions
            }});
        })));
        playfield.push(React.createElement("div", {className: "flex-row topCard-container"}, topCard));
        if (typeof this.props.hand !== "undefined") {
            playfield.push(React.createElement(Hand, {
                hand: this.props.hand,
                playCard: this.props.playCard,
                openPicker: this.props.openPicker
            }));
        }

        playfield.push(React.createElement("img", {className: "playfield-logo"}, null));
        return React.createElement("div", {className: `playfield${this.props.onTurn ? " bigRedHalo" : ""}`}, playfield);
    }
}
