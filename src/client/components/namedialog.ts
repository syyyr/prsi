import * as React from "react";
import Dialog from "./dialog";
import Button from "./button";

interface NameDialogProps {
    closeDialog: () => void;
    confirmName: (name: string) => void;
    initialValue?: string;
}

const alertEmptyName = () => window.alert("Zadals prázdný jméno. To nejde. Nebo jako sice to teoreticky jde, ale dej si neprázdný jméno.");
const alertBinaryChars = () => window.alert("Co mi tam dáváš binární hodnoty???");

export default class NameDialog extends React.PureComponent<NameDialogProps, {value: string}> {
    constructor(props: {closeDialog: () => void, confirmName: (name: string) => void}) {
        super(props);
        this.state = {
            value: typeof this.props.initialValue !== "undefined" ? this.props.initialValue : ""
        };
    }

    render(): React.ReactNode {
        const dialogContent = React.createElement("div", {
            className: "name-dialog",
            onClick: (event: MouseEvent) => {event.stopPropagation();}
        }, [
            React.createElement("div", {key: "inputHolder", className: "relative"}, [
                React.createElement("div", {className: "absolute name-input-text", key: "nameInputText"}, "jméno"),
                React.createElement("input", {
                    key: "nameInputBox",
                    onChange: (event: Event) => {this.setState({value: (<HTMLInputElement>event.target).value});},
                    onKeyUp: (event: KeyboardEvent) => {
                        if (event.keyCode === 13) {
                            if (this.state.value === "") {
                                alertEmptyName();
                            } else if (/[\x00-\x1F]/.test(this.state.value)) {
                                alertBinaryChars();
                            } else {
                                this.props.confirmName(this.state.value);
                            }
                        }
                    },
                    className: "name-input",
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
            }, "Potvrdit")
        ]);
        return React.createElement(Dialog, {
            onClick: this.props.closeDialog
        }, dialogContent);
    }
}
