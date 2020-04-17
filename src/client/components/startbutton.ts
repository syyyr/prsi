import * as React from "react";
import Button from "./button";

export default class StartButton extends React.Component<{startGame: () => void}> {
    render() {
        return React.createElement(Button, {onClick: this.props.startGame, text: "Start"});
    }
}
