import * as React from "react";
import {UI} from "./ui-common";
import {Card, Color, Place, ActionType, PlayType} from "./types";
import images from "./card-images";
import colors from "./color-images";
import { PlayerInput } from "./communication";

class Player extends React.Component<{name: string, shouldEmphasize: boolean}> {
    render(): React.ReactNode {
        return [
            React.createElement("img", {key: `${this.props.name}text`, className: "align-center", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAAAAAA7VNdtAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAHdElNRQfkAxoBNCHPhLeBAAAC1klEQVRIx72VUW8TRxSFz5ldex0nkITIlYBiIGkqtRJCSJUQBfoH4K0q/41n3vgDgBDiAfrQhgpSkNpASoIoaUKDgJBtMMnew8N6vbNrJsBLrV1Zsu7nc87MnTtcwud+3GcT/xMSB36nHADp0xCiB/enOqmaY2MJ7eMI/51/omgF0bbi1uThmQONmhTri2zzt56LIAFC4Mj06S+rzFD8nW2KICRIIP77ZzWF4y7GaCtrAsTB++r6XHe22yqV6sbsxk2BQPESgJB0z06HjLmFnzPJNHhNEth7+bQXMvb2l00nQiCU+xcBIR1tBhD3fBkqQuRPjjYSMaCynqoU8eQ20miQv5ZlKzOZFSnKPO/+2A5loZWWPDkkjXeDJqghCYyDas9f59yIAipOEqvVhGjJGEPGRqIdVpzlctaKQg2jdrLFvsrggajxcsGqCNOrb4S6CiEbcVlAJV3suTxLkb8v9GKzHdgX54qdqGyO6c5yKH4UG2oS+eaYd2CqSLNphCpLLBBCeyIQX3Fb5i9uIWcHp0qkmqV5SDKTqZ+lSISZBAHEHZ/IhsObJTMIITZ7vuGVFnJZ1x8y9YN89tusX106s/YPox5S6zGNnrirak8iOnPya39k1s8Lx5lVe9Kmf5rIEES4scdJgH/C3PfjFaLWlncvn4nNMwbRjp2qzWQfcfcvri23MvjzxQ5c2GshhFy/tOp6PaKcSUDy40z9toj75dhJdWUhbxFv6Nk33w3dSjFAauPvhcWVnfX+/C7qRfBEOxtCIqXLv917lhpJqqzPv9kghpDbjx8svYGjA1B44EAuu3bkK9SsRY/urW3TAfm9gOqfii/m7WCrykRTZF427AAgsPn70ngn9qGoAx/gsJxW7qxNTnhDqUA8ri7H3uLc6ujkQKmChOS49ejXZ519IeTDcq731/3ufu2CfECOrx/OfqHdkbocXz/uTvHjiI9x/UF81AHvAUsu4a2o7jG+AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIwLTAzLTI2VDAxOjUxOjE0KzAwOjAwU4EjDAAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMC0wMy0yNlQwMTo1MToxNCswMDowMCLcm7AAAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAAAAElFTkSuQmCC"}),
            React.createElement("p", {key: this.props.name, className: `${this.props.shouldEmphasize ? "bold" : ""}`}, this.props.name)
        ];
    }
}

export class ImgUI extends UI {
    renderCard(card: Card, halo: boolean, onClick?: () => void): React.ReactNode {
        const options = {
            onClick,
            className: `max-height${typeof onClick !== "undefined" ? " clickable" : ""}${halo ? " halo" : ""}`,
            src: images[card.color][card.value],
            draggable: false
        }
        return React.createElement("img", {key: "card", ...options});
    }
    renderPicker(onClick: (color: Color) => void): React.ReactNode {
        return [
            React.createElement("p", {key: "changeTo"}, "Měním na:"),
            ...[Color.Kule, Color.Listy, Color.Srdce, Color.Zaludy].map((color) => React.createElement(
                "img",
                {
                    key: color,
                    className: "clickable",
                    onClick: () => onClick(color),
                    src: colors[color],
                    draggable: false
                }
            ))
        ];
    }

    private renderCardBack(key: string): React.ReactNode {
        return React.createElement("img", {src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAUCAMAAACK2/weAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAABa1BMVEX53tH1yrX2zrv30cD30sD308L308H30sH30b/64dXof03ne0jpglHpg1LphVbofkzphVXphFTpg1PofUvqh1n31cXpglLneETogE7nfEnnd0LmdkHneEPogVDofErqiFv42sv2z73ofk3mcz3kazHlbTXlbzflbTTqi1742sz2y7flazLslWzunXjuoXzsl2/lbDPqiVv41sb2zLjkZyzrjmLphlfphljrkmjqilz41sf2z7znd0Psk2npg1Tslm7qil353M7tmXHogVHunnn5283slGvmcjzmdUDlbjbmdD/tm3XphFX53M/mdD7rkGXrjWHndkL1yLPofEnogE/mcjvqiFnmdkD418fsk2rtmHDsl27ph1jtnHXqiFrrkWfslGrmdT/1ybTrkWbqjGD42cr1yLLmcTvkaTDtnHbnekfkaC7kajDneUbkaS7ne0flcDj42cv42Mr31MT30L731cT2zLn65dz///8zUOq/AAAAAWJLR0R41tvkRgAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+QDHQsGEg1kP4kAAAEiSURBVBjTBcGJQ8FQHADgnzl7jh3W27QmjJAOs3pMLB1q1hwV0qV06y4d/37fB+CgnC43RXm8bh81BRTyB4IhGjEsF+anwYsFMTIjSbNIjs7FIM4mlKQ/NR9NCziThQVZyS0uIXl5JS+oBdDkVXWNJ0W+pKf0MqzjSjVg6DxDNiq1TaBwaIth5W2W3wnV6uAUye6e2WhY5r6tNkGjkdyS2p0Di0EkBodHXU7pdfrKcRHZA/CJ5KTXyqct65TUmuDrBs4w2xXx+QU3rENcNi9l3CeccTXS63DNJtUbldjDarFxewf36OGxNH4Kj9vPo+EA4kFaeXnNpYQ3KaFmQcNC5N1UPloRWlA/wYFpg7MRbXNGOPMFoHnKE/e3szD5cf3+/QMdKDN/xeNWOAAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMC0wMy0yOVQxMTowNDo0NSswMDowMDmNx5YAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjAtMDMtMjlUMTE6MDQ6NDUrMDA6MDBI0H8qAAAAAElFTkSuQmCC", key})
    }

    private renderPlace(place: Place): React.ReactNode {
        return React.createElement("div", null, (() => {
            switch (place) {
                case Place.First:
                    return "První";
                case Place.Second:
                    return "Druhej";
                case Place.Third:
                    return "Třetí";
                case Place.Fourth:
                    return "Čtvrtej";
                case Place.Fifth:
                    return "Pátej";
                case Place.Sixth:
                    return "Šeštej";
            }
        })());
    }

    renderPlayers(players: string[], whoseTurn?: string, playerInfo?: {[key in string]: number | Place}): React.ReactNode {
        console.log(playerInfo);
        return React.createElement("div", {key: "players", className: "flex-row"},
            [
                ...players.map((player) => {
                    let playerInfoRender: undefined | React.ReactNode = undefined;
                    if (typeof playerInfo !== "undefined") {
                        if (typeof playerInfo[player]! === "number") {
                            playerInfoRender = React.createElement("div",
                                {className: "flex-row cardBacks-container"},
                                Array.from({length: playerInfo[player] as number}).map((_value, index) => this.renderCardBack(`card:${player}${index}`)))
                        } else {
                            playerInfoRender = this.renderPlace(playerInfo[player] as Place);
                        }
                    }
                    return [
                        React.createElement("div", {className: "flex-column player-container"}, [
                            React.createElement(Player, {
                                name: this.props.thisName === player ? `${player} (ty)` : player,
                                key: player,
                                shouldEmphasize: typeof whoseTurn !== "undefined" && whoseTurn === player}, null
                            ),
                            playerInfoRender
                        ])
                    ];
                }),
            ]
        )
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
}
