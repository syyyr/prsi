import * as React from "react";

export default class Prompt extends React.PureComponent<{instructions: string}> {
    render() {
        return React.createElement(
            "p",
            {className: "flex-row"},
            this.props.instructions
        );
    }
}
