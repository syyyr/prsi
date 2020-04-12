import * as React from "react";
import {Color} from "../../common/types";
import colors from "./color-images";

export default class extends React.Component<{callback: (color: Color) => void}> {
    render(): React.ReactNode {
        const dialogContent = React.createElement("div", {
            className: "picker",
            onClick: (event: MouseEvent) => {event.stopPropagation();}
        }, [
            ...[Color.Kule, Color.Listy, Color.Srdce, Color.Zaludy].map((color) => React.createElement(
                "img",
                {
                    key: color,
                    className: "clickable halo",
                    onClick: () => this.props.callback(color),
                    src: colors[color],
                    draggable: false
                }
            ))
        ])  ;
        return React.createElement("div", {
            className: "dialog", onClick: (event: MouseEvent) => {
                event.stopPropagation();
                this.setState({picker: null});
            }
        }, dialogContent);
    }
}
