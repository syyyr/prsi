import * as React from "react";

export default class Button extends React.PureComponent<{onClick: () => void, text: string}> {
    render(): React.ReactNode {
        return React.createElement("button", {
            onClick: this.props.onClick,
            className: "fancy-button"
        }, this.props.text)
    }
}
