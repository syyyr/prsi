import * as React from "react";
import Dialog from "./dialog";
import {Color} from "../../common/types";
import colors from "../images/color-images";

class ColorComponent extends React.PureComponent<{color: Color, pickColor: (color: Color) => void}> {
    render(): React.ReactNode {
        return React.createElement(
            "img",
            {
                className: "clickable halo",
                onClick: () => this.props.pickColor(this.props.color),
                src: colors[this.props.color],
                draggable: false
            }
        )
    }
}

export default class ColorPicker extends React.PureComponent<{pickColor: (color: Color) => void, closePicker: (event: MouseEvent) => void}> {
    render(): React.ReactNode {
        const dialogContent = React.createElement("div", {
            className: "picker",
            onClick: (event: MouseEvent) => {event.stopPropagation();}
        }, [
            ...[Color.Kule, Color.Listy, Color.Srdce, Color.Zaludy].map(
                (color) => React.createElement(ColorComponent, {
                    key: color,
                    color: color,
                    pickColor: this.props.pickColor
                })
            )
        ]);
        return React.createElement(Dialog, {
            onClick: this.props.closePicker
        }, dialogContent);
    }
}
