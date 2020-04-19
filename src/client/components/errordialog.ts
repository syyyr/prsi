import * as React from "react";
import Dialog from "./dialog";
import Button from "./button";

const defaultOnClick = (event: MouseEvent) => {event.stopPropagation();};

export default class ErrorDialog extends React.PureComponent<{error: string, fatal: boolean, closeDialog?: () => void, buttonText?: string}> {
    render(): React.ReactNode {
        const dialogContent = React.createElement("div",
            {
                className: `error-dialog ${this.props.fatal ? "fatal-error" : ""}`,
                onClick: defaultOnClick
            }, [
                React.createElement("p", {key: "errorDialogText"}, this.props.error),
                typeof this.props.buttonText !== "undefined" ?
                    React.createElement(Button, {
                        key: "errorDialogButton",
                        onClick: typeof this.props.closeDialog !== "undefined" ? this.props.closeDialog : () => {},
                        text: this.props.buttonText
                    })
                    : undefined
            ]);
        return React.createElement(Dialog,
            {
                onClick: typeof this.props.closeDialog !== "undefined" ? this.props.closeDialog : defaultOnClick
            },
            dialogContent);
    }
}
