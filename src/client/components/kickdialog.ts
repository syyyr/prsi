import * as React from "react";
import Dialog from "./dialog";
import Button from "./button";

export default class KickDialog extends React.PureComponent<{players: string[], kickPlayer: (name: string) => void, closeDialog: () => void}> {
    render(): React.ReactNode {
        const dialogContent = React.createElement("div", {
            className: "kick-dialog",
            onClick: (event: MouseEvent) => {event.stopPropagation();}
        }, this.props.players.map((player) => React.createElement(Button, {
            key: `kick${player}`,
            onClick: () => this.props.kickPlayer(player)
        }, player)));
        return React.createElement(Dialog, {
            onClick: this.props.closeDialog
        }, dialogContent);

    }
}
