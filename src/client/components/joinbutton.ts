import * as React from "react";
import Button from "./button";

export default class JoinButton extends React.PureComponent<{openDialog: () => void}> {
    render() {
        return React.createElement(Button, {onClick: this.props.openDialog}, "Přidat se");
    }
}
