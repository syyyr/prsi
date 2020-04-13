import * as React from "react";
import {Card, Color, Value} from "../../common/types";
import CardComponent from "./card";

export default class Hand extends React.Component<{hand: Card[], playCard: (card: Card) => void, openPicker: (svrsekColor: Color) => void}> {
    render(): React.ReactNode {
        return React.createElement("div", {className: "flex-row hand-container"}, this.props.hand.map((card, index) => React.createElement(CardComponent, {
            key: `hand:${index}`,
            card: card,
            isBottomCard: "bottom",
            halo: "halo",
            onClick: () => {
                if (card.value === Value.Svrsek) {
                    this.props.openPicker(card.color);
                    return;
                }
                this.props.playCard(card);
            }
        })));
    }
}
