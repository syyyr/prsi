import * as React from "react";

export default class Button extends React.Component<{onClick: () => void, text: string}> {
    render(): React.ReactNode {
        return React.createElement("button", {
            key: "nameInputButton",
            onClick: this.props.onClick,
            className: "nameButton"
        }, this.props.text)
    }
}
