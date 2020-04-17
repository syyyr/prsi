import * as React from "react";
import Dialog from "./dialog";
import Button from "./button";

interface NameDialogProps {
    closeDialog: () => void;
    confirmName: (name: string) => void;
    initialValue?: string;
}

const alertEmptyName = () => window.alert("Zadals prázdný jméno. To nejde. Nebo jako sice to teoreticky jde, ale dej si neprázdný jméno.");

export default class NameDialog extends React.Component<NameDialogProps, {value: string}> {
    constructor(props: {closeDialog: () => void, confirmName: (name: string) => void}) {
        super(props);
        this.state = {
            value: typeof this.props.initialValue !== "undefined" ? this.props.initialValue : ""
        };
    }

    render(): React.ReactNode {
        const dialogContent = React.createElement("div", {
            className: "nameDialog",
            onClick: (event: MouseEvent) => {event.stopPropagation();}
        }, [
            React.createElement("div", {key: "inputHolder", className: "relative"}, [
                React.createElement("div", {className: "absolute nameInputText", key: "nameInputText"}, "name"),
                React.createElement("input", {
                    key: "nameInputBox",
                    onChange: (event: Event) => {this.setState({value: (<HTMLInputElement>event.target).value})},
                    onKeyUp: (event: KeyboardEvent) => {
                        if (event.keyCode === 13) {
                            if (this.state.value !== "") {
                                this.props.confirmName(this.state.value);
                            } else {
                                alertEmptyName();
                            }
                        }
                    },
                    className: "nameInput",
                    placeholder: "Jméno...",
                    autoFocus: true,
                    value: this.state.value
                })
            ]),
            React.createElement(Button, {
                key: "nameInputButton",
                onClick: () => {
                    if (this.state.value !== "") {
                        this.props.confirmName(this.state.value);
                    } else {
                        alertEmptyName();
                    }
                },
                text: "Potvrdit"
            })
        ]);
        return React.createElement(Dialog, {
            onClick: this.props.closeDialog
        }, dialogContent);
    }
}
