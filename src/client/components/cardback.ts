import * as React from "react";
import image from "../images/cardback-image";

export default class CardBack extends React.PureComponent {
    render(): React.ReactNode {
        return React.createElement("img", {src: image, className: "cardBacks-container-height"}, null);
    }
}
