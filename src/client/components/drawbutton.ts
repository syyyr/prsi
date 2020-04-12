import * as React from "react";
import {drawButtonString} from "../strings"
import {ActionType} from "../../common/types";

export default class DrawButton extends React.Component<{callback: () => void, wantedAction: ActionType, shouldDrawTooltip: boolean}> {
    render(): React.ReactNode {
        const tooltip = (() => {
            if (!this.props.shouldDrawTooltip) {
                return;
            }
            switch (this.props.wantedAction) {
                case ActionType.Play:
                case ActionType.PlayKule:
                case ActionType.PlayListy:
                case ActionType.PlaySrdce:
                case ActionType.PlayZaludy:
                    return;
            }
            return React.createElement("div", {className: "absolute centerInsideDiv tooltip"}, drawButtonString[this.props.wantedAction]);
        })();
        return React.createElement("div", {className: "relative drawButton-width"}, [
            tooltip,
            React.createElement(
                "img",
                {
                    key: "drawButton",
                    className: "cardback clickable halo playfield-height",
                    onClick: this.props.callback
                }
            )
        ]);

    }
}
