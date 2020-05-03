import * as React from "react";
import playerImage from "../images/player";

export default class PlayerDetails extends React.PureComponent<{name: string, shouldEmphasize: boolean}> {
    render(): React.ReactNode {
        return [
            React.createElement("img", {key: `${this.props.name}:img`, src: playerImage}),
            React.createElement("p", {key: `${this.props.name}:text`, className: `${this.props.shouldEmphasize ? "bold" : ""}`}, this.props.name)
        ];
    }
}
