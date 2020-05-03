import * as React from "react";
import CardBack from "./cardback";
import PlaceComponent from "./place";
import PlayerDetails from "./playerdetails";

class PlayerCards extends React.PureComponent<{cards: number}> {
    render(): React.ReactNode {
        return React.createElement("div",
            {className: "flex-row cardBacks-container"},
            Array.from({length: this.props.cards}).map((_value, index) => React.createElement(CardBack, {key: `card:${index}`})));
    }
}

interface PlayerProps {
    name: string;
    onTurn: boolean;
    lastPlace: boolean;
    cards?: number;
    place?: number;
}

export default class Player extends React.PureComponent<PlayerProps> {
    render(): React.ReactNode {
        const playerInfoRender =
            typeof this.props.cards !== "undefined" ? React.createElement(PlayerCards, {key: `${this.props.name}:cards`, cards: this.props.cards})
            : typeof this.props.place !== "undefined" ? React.createElement(PlaceComponent, {
                key: `${this.props.name}:place`,
                lastPlace: this.props.lastPlace,
                place: this.props.place
            })
            : undefined;

        return React.createElement("div", {className: "flex-column player-container"}, [
            React.createElement(PlayerDetails, {
                key: `${this.props.name}:detail`,
                name: this.props.name,
                shouldEmphasize: this.props.onTurn
            }),
            playerInfoRender
        ]);
    }
}
