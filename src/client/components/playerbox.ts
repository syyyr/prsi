import * as React from "react";
import Player from "./player";
import {Place} from "../../common/types";

interface PlayerBoxProps {
    thisName: string;
    players: string[];
    whoseTurn?: string;
    playerInfo?: {[key in string]: {cards?: number, place?: Place}};
}

export default class PlayerBox extends React.Component<PlayerBoxProps> {
    render(): React.ReactNode {
        const playerInfo = this.props.playerInfo;
        return React.createElement("div", {key: "players", className: "flex-row"},
            [
                ...this.props.players.map((player) => {
                    return React.createElement(Player, ({
                        name: player,
                        onTurn: this.props.whoseTurn === name,
                        cards: playerInfo?.[player].cards,
                        place: playerInfo?.[player].place
                    }));
                }),
            ]
        )
    }
}
