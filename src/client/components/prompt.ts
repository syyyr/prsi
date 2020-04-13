import * as React from "react";

export default class Prompt extends React.Component<{instructions: string}> {
    render() {
        return React.createElement(
            "p",
            {className: "flex-row align-center"},
            this.props.instructions
        );
    }
}
