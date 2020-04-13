import * as React from "react";

export default class Logo extends React.Component<{center: boolean}> {
    render(): React.ReactNode {
        return React.createElement("img", {className: `playfield-logo${this.props.center ? " logo align-center" : ""}`});
    }
}
