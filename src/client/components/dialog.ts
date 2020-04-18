import * as React from "react";

export default class Dialog extends React.PureComponent<{onClick: (event: MouseEvent) => void}> {
    render(): React.ReactNode {
        return React.createElement("div", {
            className: "dialog",
            onClick: this.props.onClick
        }, this.props.children);
    }
}
