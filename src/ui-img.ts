import * as React from "react";
import {UI} from "./ui-common";
import {Card, Color} from "./types";
import images from "./card-images";
import colors from "./color-images";

export class ImgUI extends UI {
    renderCard(card: Card, onClick?: () => void): React.ReactNode {
        const options = {
            onClick,
            className: `left-margin inline-block fit-content ${typeof onClick !== "undefined" ? "clickable" : ""}`,
            src: images[card.color][card.value]
        }
        return React.createElement("img", {key: "card", ...options});
    }
    renderPicker(onClick: (color: Color) => void): React.ReactNode {
        return [
            React.createElement("p", {key: "changeTo", className: "fit-content inline-block"}, "Měním na:"),
            ...[Color.Kule, Color.Listy, Color.Srdce, Color.Zaludy].map((color) => React.createElement(
                "img",
                {
                    key: color,
                    className: "inline-block clickable left-margin",
                    onClick: () => onClick(color),
                    src: colors[color]
                }
            ))
        ];
    }
}
