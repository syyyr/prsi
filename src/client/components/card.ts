import * as React from "react";
import {Card as CardType, Color, Transformation} from "../../common/types";
import {CardTooltip as CardTooltipString} from "../strings";
import images from "../images/card-images";
import colors from "../images/color-images";

interface CardProps {
    card: CardType;
    transform?: Transformation;
    stack: boolean;
    colorChange?: Color;
    halo?: "halo";
    onClick?: () => void;
    tooltip?: CardTooltipString;
}

class CardTooltip extends React.PureComponent<{tooltip: CardTooltipString}> {
    render(): React.ReactNode {
        return React.createElement("div",
            {
                className: "absolute center-inside-div tooltip topCard-tooltip",
            },
            "❌"
        );
    }
}

const transformationToString = (transformation: Transformation) => {
    return `rotate(${transformation.rotation}deg) translateX(${transformation.translateX}px) translateY(${transformation.translateY}px)`;
};

class ColorChange extends React.PureComponent<{color: Color, transformation?: Transformation}> {
    render(): React.ReactNode {
        return React.createElement("img", {
            className: "absolute center-inside-div color-change",
            src: colors[this.props.color],
            style: typeof this.props.transformation !== "undefined" ? {transform: transformationToString(this.props.transformation)} : undefined
        });
    }
}

interface CardImageProps {
    onClick?: () => void;
    card: CardType;
    halo: boolean;
}

class CardImage extends React.PureComponent<CardImageProps> {
    render(): React.ReactNode {
        const imgOptions = {
            onClick: this.props.onClick,
            className: `card${typeof this.props?.onClick !== "undefined" ? " clickable" : ""}${this.props.halo ? " halo" : ""}`,
            src: images[this.props.card.color][this.props.card.value],
            draggable: false,
        };
        return React.createElement("img", {key: "card", ...imgOptions});
    }
}

export default class Card extends React.PureComponent<CardProps> {
    render(): React.ReactNode {
        const children = [];
        children.push(React.createElement(CardImage, {
            key: "cardImage",
            onClick: this.props.onClick,
            card: this.props.card,
            halo: this.props.halo === "halo",
        }));
        if (typeof this.props?.colorChange !== "undefined") {
            children.push(React.createElement(ColorChange, {
                key: "colorChange",
                color: this.props.colorChange,
                transformation: typeof this.props.transform !== "undefined" ? new Transformation(-this.props.transform.rotation, 0, 0) : undefined
            }));
        }
        if (typeof this.props?.tooltip !== "undefined") {
            children.push(React.createElement(CardTooltip, {
                key: "cardTooltip",
                tooltip: this.props.tooltip,
            }));
        }
        return React.createElement("div",
            {
                className: `${this.props.stack ? "absolute" : "relative"}`,
                style: {
                    transform: typeof this.props.transform !== "undefined" ?
                    transformationToString(this.props.transform)
                    : undefined
                }
            },
            children
        );
    }
}
