import * as React from "react";

export default class StartButton extends React.Component<{startGame: () => void}> {
    render() {
        return React.createElement(
            "button",
            {
                onClick: this.props.startGame
            },
            "Start");
    }
}
