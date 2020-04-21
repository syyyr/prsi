import * as React from "react";
import Player from "./player";

interface PlayerBoxProps {
    thisName?: string;
    players: string[];
    lastPlace?: string;
    whoseTurn?: string;
    playerInfo?: {[key in string]: {cards?: number, place?: number}};
}

export default class PlayerBox extends React.PureComponent<PlayerBoxProps> {
    render(): React.ReactNode {
        const playerInfo = this.props.playerInfo;
        return React.createElement("div", {key: "players", className: "flex-row playerbox"},
            [
                ...this.props.players.map((player) => {
                    return React.createElement(Player, ({
                        key: player,
                        name: this.props.thisName === player ? `${player} (ty)` : player,
                        onTurn: this.props.whoseTurn === player,
                        cards: playerInfo?.[player]?.cards,
                        place: playerInfo?.[player]?.place,
                        lastPlace: player === this.props.lastPlace
                    }));
                }),
            ]
        );
    }
}
