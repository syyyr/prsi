import * as React from "react";
import Logo from "./logo";

export default class Title extends React.Component {
    render(): React.ReactNode {
        return React.createElement(Logo, {center: true});
    }
}
