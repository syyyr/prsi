import * as React from "react";
import Logo from "./logo";

export default class Title extends React.PureComponent {
    render(): React.ReactNode {
        return React.createElement(Logo);
    }
}
