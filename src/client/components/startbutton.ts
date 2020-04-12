import * as React from "react";

export default class extends React.Component<{callback: () => void}> {
    render() {
        return React.createElement(
            "button",
            {
                onClick: this.props.callback
            },
            "Start");
    }
}
