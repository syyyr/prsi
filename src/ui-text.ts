import * as React from "react";
import {UI} from "./ui-common";
import {Card, Color} from "./types";

export class TextUI extends UI {
    renderCard(card: Card, onClick?: () => void): React.ReactNode {
        const options = {
            onClick,
            className: `fit-content ${typeof onClick !== "undefined" ? "clickable" : ""}`
        }
        return React.createElement("p", {...options}, `${card.value}${card.color}`);
    }
    renderPicker(onClick: (color: Color) => void): React.ReactNode {
        return [Color.Kule, Color.Listy, Color.Srdce, Color.Zaludy].map((color) => React.createElement(
            "p",
            {
                onClick: () => onClick()
            }
        ));
    }
}
