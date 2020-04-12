import * as React from "react";
import images from "./card-images";
import colors from "./color-images";
import {Card, Color, Value, ActionType, changeActionToColor} from "../../common/types";

interface CardOptions {
    isBottomCard?: "bottom",
    colorChange?: Color,
    halo?: "halo",
    onClick?: () => void,
    tooltip?: CardTooltip,
    key: string
}

enum CardTooltip {
    NoSkip = "(nestojíš)",
    NoDraw = "(nelížeš)"
}

type Renderer = {renderer: () => React.ReactNode};
class CardComponentBase extends React.Component<Renderer> {
    render() {
        return this.props.renderer();
    }
}

const renderCard = (card: Card, options?: CardOptions): React.ReactNode => {
    return React.createElement(CardComponent, {key: options?.key, card, options});
};

class CardComponent extends React.Component<{card: Card, options?: CardOptions}> {
    render(): React.ReactNode {
        const options = this.props.options;
        const card = this.props.card;
        const imgOptions = {
            onClick: options?.onClick,
            className: `playfield-height${typeof options?.onClick !== "undefined" ? " clickable" : ""}${options?.halo === "halo" ? " halo" : ""}`,
            src: images[card.color][card.value],
            draggable: false,
            key: options?.key
        }
        const children = [];
        children.push(React.createElement("img", {key: "card", ...imgOptions}));
        if (typeof options?.colorChange !== "undefined") {
            children.push(React.createElement("img", {
                className: "absolute centerInsideDiv colorChange",
                src: colors[options.colorChange],
            }));
        }
        if (typeof options?.tooltip !== "undefined") {
            children.push(React.createElement("div", {className: "absolute centerInsideDiv tooltip topCardTooltip"}, "❌"));
        }
        return React.createElement("div", {
            className: `${typeof options?.isBottomCard === "undefined" ? "centerInsideDiv absolute" : "relative"}`},
            children
        );
    }
}

class Hand extends React.Component<{hand: Card[], playCard: (card: Card) => void, openPicker: (svrsekColor: Color) => void}> {
    render(): React.ReactNode {
        return React.createElement("div", {className: "flex-row hand-container"}, this.props.hand.map((card, index) => React.createElement(CardComponentBase, {
            key: `hand:${card.value}${card.color}`,
            renderer: () => renderCard(card, {key: `hand${index}`, isBottomCard: "bottom", halo: "halo", onClick: () => {
                if (card.value === Value.Svrsek) {
                    this.props.openPicker(card.color);
                    return;
                }
                this.props.playCard(card);
            }})
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

const drawButtonString = {
    [ActionType.DrawTwo]: "Líznout 2",
    [ActionType.DrawFour]: "Líznout 4",
    [ActionType.DrawSix]: "Líznout 6",
    [ActionType.DrawEight]: "Líznout 8",
    [ActionType.SkipTurn]: "Stojím",
    [ActionType.Shuffle]: "Zamíchat",
};

class DrawButton extends React.Component<{callback: () => void, wantedAction: ActionType, shouldDrawTooltip: boolean}> {
    render(): React.ReactNode {
        const tooltip = (() => {
            if (!this.props.shouldDrawTooltip) {
                return;
            }
            switch (this.props.wantedAction) {
                case ActionType.Play:
                case ActionType.PlayKule:
                case ActionType.PlayListy:
                case ActionType.PlaySrdce:
                case ActionType.PlayZaludy:
                    return;
            }
            return React.createElement("div", {className: "absolute centerInsideDiv tooltip"}, drawButtonString[this.props.wantedAction]);
        })();
        return React.createElement("div", {className: "relative drawButton-width"}, [
            tooltip,
            React.createElement(
                "img",
                {
                    key: "drawButton",
                    className: "cardback clickable halo playfield-height",
                    onClick: this.props.callback
                }
            )
        ]);

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


            return renderCard(card, {
                key: `topCard${index}`,
                ...firstCardOptions,
                ...lastCardOptions
            });
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
