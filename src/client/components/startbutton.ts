import * as React from "react";
import Button from "./button";

export default class StartButton extends React.PureComponent<{startGame: () => void}> {
    render() {
        return React.createElement(Button, {onClick: this.props.startGame}, "Start");
    }
}
