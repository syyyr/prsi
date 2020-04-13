import * as React from "react";
import {Card as CardType, Color} from "../../common/types";
import {CardTooltip as CardTooltipString} from "../strings";
import images from "./card-images";
import colors from "./color-images";

interface CardProps {
    card: CardType;
    isBottomCard?: "bottom";
    colorChange?: Color;
    halo?: "halo";
    onClick?: () => void;
    tooltip?: CardTooltipString;
}

class CardTooltip extends React.Component<{tooltip: CardTooltipString}> {
    render(): React.ReactNode {
        return React.createElement("div", {
            key: "cardTooltip", className: "absolute centerInsideDiv tooltip topCardTooltip"},
            "❌"
        );
    }
}

class ColorChange extends React.Component<{color: Color}> {
    render(): React.ReactNode {
        return React.createElement("img", {
            key: "colorChange",
            className: "absolute centerInsideDiv colorChange",
            src: colors[this.props.color]
        });
    }
}

class CardImage extends React.Component<{onClick?: () => void, card: CardType, halo: boolean}> {
    render(): React.ReactNode {
        const imgOptions = {
            onClick: this.props.onClick,
            className: `playfield-height${typeof this.props?.onClick !== "undefined" ? " clickable" : ""}${this.props.halo ? " halo" : ""}`,
            src: images[this.props.card.color][this.props.card.value],
            draggable: false,
        }
        return React.createElement("img", {key: "card", ...imgOptions});
    }
}

export default class Card extends React.Component<CardProps> {
    render(): React.ReactNode {
        const children = [];
        children.push(React.createElement(CardImage, {
            onClick: this.props.onClick,
            card: this.props.card,
            halo: this.props.halo === "halo"
        }));
        if (typeof this.props?.colorChange !== "undefined") {
            children.push(React.createElement(ColorChange, {color: this.props.colorChange}));
        }
        if (typeof this.props?.tooltip !== "undefined") {
            children.push(React.createElement(CardTooltip, {tooltip: this.props.tooltip}));
        }
        return React.createElement("div", {
            className: `${typeof this.props?.isBottomCard === "undefined" ? "centerInsideDiv absolute" : "relative"}`},
            children
        );
    }
}
