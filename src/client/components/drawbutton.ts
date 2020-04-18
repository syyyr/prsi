import * as React from "react";
import image from "../images/cardback-image";
import {drawButtonString} from "../strings"
import {ActionType} from "../../common/types";

class DrawButtonTooltip extends React.Component<{tooltip: string}> {
    render(): React.ReactNode {
        return React.createElement("div",
            {
                key: "tooltip",
                className: "absolute center-inside-div tooltip"
            },
            this.props.tooltip
        );
    }
}

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
            return React.createElement(DrawButtonTooltip, {key: "drawButtonTooltip", tooltip: drawButtonString[this.props.wantedAction]});
        })();
        return React.createElement("div", {className: "relative"}, [
            tooltip,
            React.createElement(
                "img",
                {
                    key: "drawButton",
                    src: image,
                    className: "clickable halo card",
                    onClick: this.props.callback
                }
            )
        ]);

    }
}
