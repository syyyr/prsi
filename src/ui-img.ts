import * as React from "react";
import {UI, CardTooltip} from "./ui-common";
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

class CardBack extends React.Component {
    render(): React.ReactNode {
        return React.createElement("img", {className: "cardback cardBacks-container-height"}, null);
    }
}

export class ImgUI extends UI {
    renderCard(card: Card, options?: {colorChange?: Color, halo?: "halo", onClick?: () => void, tooltip?: CardTooltip}): React.ReactNode {
        const imgOptions = {
            onClick: options?.onClick,
            className: `playfield-height${typeof options?.onClick !== "undefined" ? " clickable" : ""}${options?.halo === "halo" ? " halo" : ""}`,
            src: images[card.color][card.value],
            draggable: false
        }
        const children = [];
        children.push(React.createElement("img", {key: "card", ...imgOptions}));
        if (typeof options?.colorChange !== "undefined") {
            children.push(React.createElement("img", {
                className: "absolute centerInsideDiv colorChange",
                src: colors[options.colorChange]
            }));
        }
        if (typeof options?.tooltip !== "undefined") {
            children.push(React.createElement("div", {className: "absolute centerInsideDiv tooltip topCardTooltip"}, "❌"));
        }
        return React.createElement("div", {className: "relative"}, children);
    }
    renderPicker(onClick: (color: Color) => void): React.ReactNode {
        const dialogContent = React.createElement("div", {
            className: "picker",
            onClick: (event: MouseEvent) => {event.stopPropagation();}
        }, [
            ...[Color.Kule, Color.Listy, Color.Srdce, Color.Zaludy].map((color) => React.createElement(
                "img",
                {
                    key: color,
                    className: "clickable halo",
                    onClick: () => onClick(color),
                    src: colors[color],
                    draggable: false
                }
            ))
        ])  ;
        return React.createElement("div", {
            className: "dialog", onClick: (event: MouseEvent) => {
                event.stopPropagation();
                this.setState({picker: null});
            }
        }, dialogContent);
    }

    private renderCardBack(key: string): React.ReactNode {
        return React.createElement(CardBack, {key}, null);
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

    renderPlayers(players: string[], whoseTurn?: string, playerInfo?: {[key in string]: {cards?: number, place?: Place}}): React.ReactNode {
        return React.createElement("div", {key: "players", className: "flex-row"},
            [
                ...players.map((player) => {
                    let playerInfoRender: undefined | React.ReactNode = undefined;
                    if (typeof playerInfo !== "undefined" && typeof playerInfo[player] !== "undefined") {
                        if (typeof playerInfo[player]!.cards === "number") {
                            playerInfoRender = React.createElement("div",
                                {className: "flex-row cardBacks-container"},
                                // I have no idea why Typescript complains without an `!`
                                Array.from({length: playerInfo[player].cards!}).map((_value, index) => this.renderCardBack(`card:${player}${index}`)))
                        } else {
                            playerInfoRender = this.renderPlace(playerInfo[player].place!);
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

    readonly drawButtonString = {
        [ActionType.DrawTwo]: "Líznout 2",
        [ActionType.DrawFour]: "Líznout 4",
        [ActionType.DrawSix]: "Líznout 6",
        [ActionType.DrawEight]: "Líznout 8",
        [ActionType.SkipTurn]: "Stojím",
        [ActionType.Shuffle]: "Zamíchat",
    };

    renderDrawButton(wantedAction: ActionType, whoseTurn: string): React.ReactNode {
        const tooltip = (() => {
            if (this.props.thisName !== whoseTurn && wantedAction !== ActionType.Shuffle) {
                return;
            }
            switch (wantedAction) {
                case ActionType.Play:
                case ActionType.PlayKule:
                case ActionType.PlayListy:
                case ActionType.PlaySrdce:
                case ActionType.PlayZaludy:
                    return;
            }
            return React.createElement("div", {className: "absolute centerInsideDiv tooltip"}, this.drawButtonString[wantedAction]);
            })();
        return React.createElement("div", {className: "relative"}, [
            tooltip,
            React.createElement(
                "img",
                {
                    key: "drawButton",
                    className: "cardback clickable halo playfield-height",
                    onClick: () => {
                        this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Draw)));
                    },
                }
            )
        ]);
    }

    renderTitle(): React.ReactNode {
        return React.createElement("img", {className: "logo align-center playfield-logo"});
    }
}
