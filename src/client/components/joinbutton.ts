import * as React from "react";

export default class JoinButton extends React.Component<{openDialog: () => void}> {
    render() {
        return React.createElement(
            "button",
            {
                onClick: this.props.openDialog
            },
            "Přidat se");
    }
}
