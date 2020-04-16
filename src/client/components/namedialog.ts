import * as React from "react";
import Dialog from "./dialog";

export default class NameDialog extends React.Component<{closeDialog: () => void, confirmName: (name: string) => void}, {value: string}> {
    constructor(props: {closeDialog: () => void, confirmName: (name: string) => void}) {
        super(props);
        this.state = {value: ""};
    }

    render(): React.ReactNode {
        const dialogContent = React.createElement("div", {
            className: "nameDialog",
            onClick: (event: MouseEvent) => {event.stopPropagation();}
        }, [
            React.createElement("input", {
                onChange: (event: Event) => {this.setState({value: (<HTMLInputElement>event.target).value})},
                onKeyUp: (event: KeyboardEvent) => {
                    if (event.keyCode === 13) {
                        if (this.state.value !== "") {
                            this.props.confirmName(this.state.value);
                        } else {
                            window.alert("Zadals prázdný jméno. To nejde. Nebo jako sice to teoreticky jde, ale dej si neprázdný jméno.");
                        }
                    }
                },
                className: "nameInput",
                placeholder: "Jméno...",
                autoFocus: true,
                value: this.state.value
            }),
            React.createElement("button", {
                onClick: () => {if (this.state.value !== "") this.props.confirmName(this.state.value)},
                className: "nameButton"
            }, "Potvrdit")
        ]);
        return React.createElement(Dialog, {
            onClick: this.props.closeDialog
        }, dialogContent);
    }
}
