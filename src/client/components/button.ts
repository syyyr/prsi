import * as React from "react";

export default class Button extends React.Component<{onClick: () => void, text: string}> {
    render(): React.ReactNode {
        return React.createElement("button", {
            onClick: this.props.onClick,
            className: "fancyButton"
        }, this.props.text)
    }
}
