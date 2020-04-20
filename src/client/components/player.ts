import * as React from "react";
import CardBack from "./cardback";
import PlaceComponent from "./place";
import {Place} from "../../common/types";

class PlayerDetails extends React.PureComponent<{name: string, shouldEmphasize: boolean}> {
    render(): React.ReactNode {
        return [
            React.createElement("img", {key: `${this.props.name}:img`, src: "data:image/webp;base64,UklGRnIEAABXRUJQVlA4TGYEAAAvMUAMEDWCgrZtmIY/7e4PQERMgJ6EPkuuSm5WbrZty56cAVqXjs5ddnB3d3epYAF3GIGko8oSGQDo3N3dvz/yfvYi9fs7kCTJtIP5bPPbcBvbtqqsEn8D/CrIaMJThsidSDMKcJcONHKTQ9vWIWYT20mX1radyuaPyrbtyrZt27Ztx8nYM+9OgOtItk0r45vD/bR977Ntr8nzPAZtIznOAfn+e9XjOpJt0wpu1rXte59tfr4cXsQMI0lSkn8o5OHukIDDO/eGRvrPhiv64Tj+wICGb9iLCjhGg1L8BHLxEqmRYDoIKAgdrVFgJFAcFkojQCT0EgldCKwPR4HSWFobQmCWQyec6kITUCGS6sLcKtBaF5ZVgaF1YR6AO1iERwB6IRZCS13DaFrBrTOUbuDQJUoOM2gRyR1UjmQveDyEnIOEeho4PSbvCQu/seUZfdfAA/595sp16DHWN86+YtkV5swmDn8CaINjLQ2cGjR/wMhAhtUAGdSAmg2QgQaUQW/BZc4NZWEAC8HU2iCxwbcM/AS/kX8gfOHfE9qe8u07t75x/Rd8A/oNHnFvA7t6oA1+9XSw8QdqhpTuhp+bR9MbjgR/bCku2FScsDD40ar4gZPhR3vGo5twN7g4DwNICSaKwVQPV2RjLEbcYuhb5DuwV4Ov2XYYvmz/B3NWLGWl9RsebvtEDi2Y2kr7P5hx9hF9NLU4YSrsDNAXAAkKasFUDFfkYx5uQAFSGolygEdrObOjOGIzbwVwrOOP3+zSOO9XgPE8Yzxr7AAikBIeIA5MpQjFSJyDCOTCRteWPUs/hgV21OZakf5P26gBamsTDEivAItf2IwiMFXCE0NxHwQUxt9Dp7ig6AXfajRWkRXJ8j9IgJrausOrA9CHSjCVogptQFnsOXaLCYpe8G5mZcGvyKTfBQCajtEdW68AC8PhUAVKYQNlYUDZe8hA0QfuYVsoRUYE6XcBgKZjdCfWM4DFaxzErpQS9mI/FqMIjgXwEiiLdvSAVq1FgB/s4fM4RWCyOgNA0zG6E5sZwAIF8RGVeaBC4HAWp8DhE/pgL51q+DEM4G1t5I9Jfkxc/zsA+3K0ydRmhEIpYR2cQujKgY4bmIkWNGAtnoBg4T346WMf9+1vQBd1hOPMyuPKCvv6wW2F7X4Ww9K5BnDFEg7CMYD5ASh4huN4AhFICT1QYIKA3tEXm7bcv9ZP+GjaMKCFY0tcMLWVyfUEq5aitGbJtw1Kz4BdwmBxAM7YBAIKQwcLAdTsE3wwotyjd/AF0BM2fpVpIrdHSgjDWKzHMVzGTdzGTVzDBZzEQezGKRzHB3AQYYCasKFCgQ4BHLrLJLyGU6A0ZgL4gf/gIYDDX/yHhN/4AZRH/2owHagVr/+AhOyYwIewISasCqEDjhGhCZ8CBikxYWkIk2NCQQgnY4I79AD+xAQGTwIJ/jFhawhZMWFiCANjQlUIc2JCQgibYkJwCKdigiOsAO7FlNAdwPuo8C2Af1HhVQAs"}),

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
