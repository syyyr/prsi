import * as React from "react";
import image from "./cardback-image";

export default class CardBack extends React.Component {
    render(): React.ReactNode {
        return React.createElement("img", {src: image, className: "cardBacks-container-height"}, null);
    }
}
