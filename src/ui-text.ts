import * as React from "react";
import {UI} from "./ui-common";
import {Card, Color, ActionType, PlayType} from "./types";
import {PlayerInput} from "./communication";

export class TextUI extends UI {
    renderCard(card: Card, options?: {halo?: "halo", onClick?: () => void}): React.ReactNode {
        const pOptions = {
            onClick: options?.onClick,
            className: `fit-content ${typeof options?.onClick !== "undefined" ? "clickable" : ""}`
        }
        return React.createElement("p", {key: "card", ...pOptions}, `${card.value}${card.color}`);
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

    renderDrawButton(wantedAction: ActionType, whoseTurn: string): React.ReactNode {
        return React.createElement(
            "button",
            {
                key: "drawButton",
                onClick: () => {
                    this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Draw)));
                },
            },
            (() => {
                    if (this.props.thisName !== whoseTurn && wantedAction !== ActionType.Shuffle) {
                        return "Líznout si";
                    }
                    switch (wantedAction) {
                        case ActionType.Play:
                        case ActionType.PlayKule:
                        case ActionType.PlayListy:
                        case ActionType.PlayZaludy:
                        case ActionType.PlaySrdce:
                            return "Líznout si";
                        case ActionType.DrawTwo:
                            return "Líznout dvě";
                        case ActionType.DrawFour:
                            return "Líznout čtyři";
                        case ActionType.DrawSix:
                            return "Líznout šest";
                        case ActionType.DrawEight:
                            return "Líznout osm";
                        case ActionType.SkipTurn:
                            return "Stojím";
                        case ActionType.Shuffle:
                            return "Zamíchat";
                    }
                })()
        );
    }

    renderTitle(): React.ReactNode {
        return React.createElement("h1", {className: "align-center"}, "Prší");
    }
}
