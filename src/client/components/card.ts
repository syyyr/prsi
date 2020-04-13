import * as React from "react";
import {Card as CardType, Color} from "../../common/types";
import {CardTooltip} from "../strings";
import images from "./card-images";
import colors from "./color-images";

interface CardOptions {
    isBottomCard?: "bottom",
    colorChange?: Color,
    halo?: "halo",
    onClick?: () => void,
    tooltip?: CardTooltip
}

export default class Card extends React.Component<{card: CardType, options?: CardOptions}> {
    render(): React.ReactNode {
        const options = this.props.options;
        const card = this.props.card;
        const imgOptions = {
            onClick: options?.onClick,
            className: `playfield-height${typeof options?.onClick !== "undefined" ? " clickable" : ""}${options?.halo === "halo" ? " halo" : ""}`,
            src: images[card.color][card.value],
            draggable: false,
        }
        const children = [];
        children.push(React.createElement("img", {key: "card", ...imgOptions}));
        if (typeof options?.colorChange !== "undefined") {
            // FIXME: refactor to a component
            children.push(React.createElement("img", {
                key: "colorChange",
                className: "absolute centerInsideDiv colorChange",
                src: colors[options.colorChange],
            }));
        }
        if (typeof options?.tooltip !== "undefined") {
            children.push(React.createElement("div", {key: "cardTooltip", className: "absolute centerInsideDiv tooltip topCardTooltip"}, "❌"));
        }
        return React.createElement("div", {
            className: `${typeof options?.isBottomCard === "undefined" ? "centerInsideDiv absolute" : "relative"}`},
            children
        );
    }
}
