import * as React from "react";
import {UI} from "./ui-common";
import {Card, Color} from "./types";

export class TextUI extends UI {
    renderCard(card: Card, halo: boolean, onClick?: () => void): React.ReactNode {
        const options = {
            onClick,
            className: `fit-content ${typeof onClick !== "undefined" ? "clickable" : ""}`
        }
        return React.createElement("p", {key: "card", ...options}, `${card.value}${card.color}`);
    }
    renderPicker(onClick: (color: Color) => void): React.ReactNode {
        return [
            React.createElement("p", {key: "changeTo", className: "fit-content "}, "Měním na:"),
            ...[Color.Kule, Color.Listy, Color.Srdce, Color.Zaludy].map((color) => React.createElement(
                "p",
                {
                    key: color,
                    className: "clickable",
                    onClick: () => onClick(color)
                },
                color
            ))
        ];
    }

    renderPlayers(players: string[], whoseTurn?: string): React.ReactNode {
        return [
            React.createElement("p", {className: "fit-content ", key: "players"}, "Hráči:"),
            ...players.map((player) => React.createElement(
                "p",
                {
                    className: `fit-content  ${typeof whoseTurn !== "undefined" && player == whoseTurn ? "bold" : ""}`,
                    key: "player:" + player
                },
                player)
            ),
            React.createElement("br", {key: "players-linebreak"})
        ]
    }
}
