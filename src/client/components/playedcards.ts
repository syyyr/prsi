import * as React from "react";
import {Card, Color, Transformation, sameCards} from "../../common/types";
import CardComponent from "./card";
import {CardTooltip} from "../strings";

// https://stackoverflow.com/a/39187274
// This is basically the Central Limit Theorem. Using other transformation
// method would probably be more precise, but this is enough for my usecase.
const gaussianRand = () => {
    const tightness = 6;
    return Array(tightness).fill(null).reduce((prev) => prev + Math.random(), 0) / tightness;
};

const getRandomTransform = (): Transformation => ({
    rotation: Math.floor(gaussianRand() * 180 - 90),
    translateX: Math.floor(Math.random() * 40) - 20,
    translateY: Math.floor(Math.random() * 40) - 20,
});

export default class TopCards extends React.PureComponent<{cards: Card[], colorChange?: Color, tooltip?: CardTooltip}> {
    transformations: Transformation[];
    lastTopCard: Card;
    constructor(props: {cards: Card[], colorChange?: Color, tooltip?: CardTooltip}) {
        super(props);
        this.transformations = [];
        this.lastTopCard = props.cards[props.cards.length - 1];
    }
    render(): React.ReactNode {
        if (this.props.cards.length === 1) {
            this.transformations = [new Transformation(0, 0, 0)];
        } else if (!sameCards(this.props.cards[this.props.cards.length - 1], this.lastTopCard)) {
            this.transformations.push(getRandomTransform());
            if (this.transformations.length > 3) {
                this.transformations.shift();
            }
        }

        this.lastTopCard = this.props.cards[this.props.cards.length - 1];
        return React.createElement("div", {className: "relative playedCards"},
            this.props.cards.map((card, index, array) => {
                return React.createElement(CardComponent, {
                    key: `topCard:${index}`,
                    card: card,
                    stack: true,
                    colorChange: index === array.length - 1 ? this.props.colorChange : undefined,
                    tooltip: index === array.length - 1 ? this.props.tooltip : undefined,
                    transform: this.transformations[index]
                });
            })
        );
    }
}
