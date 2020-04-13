import * as React from "react";
import {Card, Color} from "../../common/types";
import CardComponent from "./card";
import {CardTooltip} from "../strings";

export default class TopCards extends React.Component<{cards: Card[], colorChange?: Color, tooltip?: CardTooltip}> {
    render(): React.ReactNode {
        return React.createElement("div", {className: "flex-row topCard-container relative"},
            this.props.cards.map((card, index, array) => {
                return React.createElement(CardComponent, {
                    key: `topCard:${index}`,
                    card: card,
                    isBottomCard: index === 0 ? "bottom" : undefined,
                    colorChange: index === array.length - 1 ? this.props.colorChange : undefined,
                    tooltip: index === array.length - 1 ? this.props.tooltip : undefined,
                });
            })
        );
    }
}
