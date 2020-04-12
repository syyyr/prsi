import * as React from "react";

export default class extends React.Component<{instructions: string}> {
    render() {
        return React.createElement(
            "p",
            {key: "prompt", className: "flex-row align-center"},
            this.props.instructions
        );
    }
}