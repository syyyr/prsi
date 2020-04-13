import * as React from "react";
import image from "./logo-image";

export default class Logo extends React.Component<{center: boolean}> {
    render(): React.ReactNode {
        return React.createElement("img", {src: image, className: `${this.props.center ? "logo align-center" : ""}`});
    }
}
