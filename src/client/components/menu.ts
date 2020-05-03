import * as React from "react";
import Button from "./button";

export default class Menu extends React.PureComponent<{openKickDialog: () => void}> {
    render(): React.ReactNode {
        return React.createElement("div", {className: "flex-column menu"}, React.createElement(Button, {
            onClick: this.props.openKickDialog,
        }, "Vyhodit hráče"));
    }
}
