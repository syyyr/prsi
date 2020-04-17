import * as React from "react";
import Button from "./button";

export default class LeaveButton extends React.Component<{leaveGame: () => void}> {
    render() {
        return React.createElement(Button, {onClick: this.props.leaveGame, text: "Opustit hru"});
    }
}
