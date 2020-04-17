import * as React from "react";
import Dialog from "./dialog";

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
                    React.createElement("button", {onClick: this.props.closeDialog}, "OK")
                    : undefined
            ]);
        return React.createElement(Dialog,
            {
                onClick: typeof this.props.closeDialog !== "undefined" ? this.props.closeDialog : defaultOnClick
            },
            dialogContent);
    }
}
