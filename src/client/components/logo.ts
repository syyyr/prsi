import * as React from "react";
import image from "../images/logo-image";

export default class Logo extends React.Component {
    render(): React.ReactNode {
        return React.createElement("img", {src: image, className: "logo"});
    }
}
