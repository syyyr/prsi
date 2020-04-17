import * as React from "react";
import Dialog from "./dialog";
import Button from "./button";

const defaultOnClick = (event: MouseEvent) => {event.stopPropagation()}

export default class ErrorDialog extends React.Component<{error: string, closeDialog?: () => void}> {
    render(): React.ReactNode {
        const dialogContent = React.createElement("div",
            {
                className: "errorDialog",
                onClick: defaultOnClick
            }, [
                React.createElement("p", null, this.props.error),
                typeof this.props.closeDialog !== "undefined" ?
                    React.createElement(Button, {onClick: this.props.closeDialog, text: "OK"})
                    : undefined
            ]);
        return React.createElement(Dialog,
            {
                onClick: typeof this.props.closeDialog !== "undefined" ? this.props.closeDialog : defaultOnClick
            },
            dialogContent);
    }
}
