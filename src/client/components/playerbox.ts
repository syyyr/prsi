import * as React from "react";
import CardBack from "./cardback";
import PlaceComponent from "./place";
import Player from "./player";
import {Place} from "../../common/types";

interface PlayerBoxProps {
    thisName: string;
    players: string[];
    whoseTurn?: string;
    playerInfo?: {[key in string]: {cards?: number, place?: Place}};
}

export default class extends React.Component<PlayerBoxProps> {
    render(): React.ReactNode {
        const players = this.props.players;
        const playerInfo = this.props.playerInfo;
        const whoseTurn = this.props.whoseTurn;
        return React.createElement("div", {key: "players", className: "flex-row"},
            [
                ...players.map((player) => {
                    let playerInfoRender: undefined | React.ReactNode = undefined;
                    if (typeof playerInfo !== "undefined" && typeof playerInfo[player] !== "undefined") {
                        if (typeof playerInfo[player]!.cards === "number") {
                            playerInfoRender = React.createElement("div",
                                {className: "flex-row cardBacks-container"},
                                // I have no idea why Typescript complains without an `!`
                                Array.from({length: playerInfo[player].cards!}).map((_value, index) => React.createElement(CardBack, {key: `card:${player}${index}`})));
                        } else {
                            playerInfoRender = React.createElement(PlaceComponent, {place: playerInfo[player].place!});
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
}
