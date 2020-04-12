import * as React from "react";

export default class Title extends React.Component {
    render(): React.ReactNode {
        return React.createElement("img", {className: "logo align-center playfield-logo"});
    }
}
