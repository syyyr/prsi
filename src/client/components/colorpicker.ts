import * as React from "react";
import {Color} from "../../common/types";
import colors from "./color-images";

class Dialog extends React.Component<{onClick: (event: MouseEvent) => void}> {
    render(): React.ReactNode {
        return React.createElement("div", {
            className: "dialog",
            onClick: this.props.onClick
        }, this.props.children);
    }
}

class ColorComponent extends React.Component<{color: Color, pickColor: (color: Color) => void}> {
    render(): React.ReactNode {
        return React.createElement(
            "img",
            {
                key: this.props.color,
                className: "clickable halo",
                onClick: () => this.props.pickColor(this.props.color),
                src: colors[this.props.color],
                draggable: false
            }
        )
    }
}

export default class ColorPicker extends React.Component<{pickColor: (color: Color) => void}> {
    render(): React.ReactNode {
        const dialogContent = React.createElement("div", {
            className: "picker",
            onClick: (event: MouseEvent) => {event.stopPropagation();}
        }, [
            ...[Color.Kule, Color.Listy, Color.Srdce, Color.Zaludy].map(
                (color) => React.createElement(ColorComponent, {color, pickColor: this.props.pickColor})
            )
        ]);
        return React.createElement(Dialog, {
            onClick: (event: MouseEvent) => {
                event.stopPropagation();
                this.setState({picker: null});
            }
        }, dialogContent);
    }
}
