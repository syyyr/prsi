import * as React from "react";
import CardBack from "./cardback";
import PlaceComponent from "./place";
import {Place} from "../../common/types";

class PlayerDetails extends React.PureComponent<{name: string, shouldEmphasize: boolean}> {
    render(): React.ReactNode {
        return [
            React.createElement("img", {key: `${this.props.name}:img`, src: "data:image/png;base64,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"}),
            React.createElement("p", {key: `${this.props.name}:text`, className: `${this.props.shouldEmphasize ? "bold" : ""}`}, this.props.name)
        ];
    }
}

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
    place?: Place;
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
