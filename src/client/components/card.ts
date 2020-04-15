import * as React from "react";
import {Card as CardType, Color, Transformation} from "../../common/types";
import {CardTooltip as CardTooltipString} from "../strings";
import images from "../images/card-images";
import colors from "../images/color-images";

interface CardProps {
    card: CardType;
    transform?: Transformation;
    isBottomCard?: "bottom";
    colorChange?: Color;
    halo?: "halo";
    onClick?: () => void;
    tooltip?: CardTooltipString;
}

class CardTooltip extends React.Component<{tooltip: CardTooltipString}> {
    render(): React.ReactNode {
        return React.createElement("div", {
            className: "absolute centerInsideDiv tooltip topCardTooltip"},
            "❌"
        );
    }
}

class ColorChange extends React.Component<{color: Color}> {
    render(): React.ReactNode {
        return React.createElement("img", {
            className: "absolute centerInsideDiv colorChange",
            src: colors[this.props.color]
        });
    }
}

interface CardImageProps {
    onClick?: () => void;
    card: CardType;
    halo: boolean;
    transform?: Transformation;
}

class CardImage extends React.Component<CardImageProps> {
    render(): React.ReactNode {
        const imgOptions = {
            onClick: this.props.onClick,
            className: `card${typeof this.props?.onClick !== "undefined" ? " clickable" : ""}${this.props.halo ? " halo" : ""}`,
            src: images[this.props.card.color][this.props.card.value],
            draggable: false,
            style: {
                transform: typeof this.props.transform !== "undefined" ?
                `rotate(${this.props.transform.rotation}deg) translateX(${this.props.transform.translateX}px) translateY(${this.props.transform.translateY}px)`
                : undefined
            }
        }
        return React.createElement("img", {key: "card", ...imgOptions});
    }
}

export default class Card extends React.Component<CardProps> {
    render(): React.ReactNode {
        const children = [];
        children.push(React.createElement(CardImage, {
            key: "cardImage",
            onClick: this.props.onClick,
            card: this.props.card,
            halo: this.props.halo === "halo",
            transform: this.props.transform
        }));
        if (typeof this.props?.colorChange !== "undefined") {
            children.push(React.createElement(ColorChange, {key: "colorChange", color: this.props.colorChange}));
        }
        if (typeof this.props?.tooltip !== "undefined") {
            children.push(React.createElement(CardTooltip, {key: "cardTooltip", tooltip: this.props.tooltip}));
        }
        return React.createElement("div", {
            className: `${typeof this.props?.isBottomCard === "undefined" ? "centerInsideDiv absolute" : "relative"}`},
            children
        );
    }
}
