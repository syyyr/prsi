import * as React from "react";
import Button from "./button";

export default class KickState extends React.PureComponent<{secondsLeft: number, kickState: { who: string; state: { [key in string]: boolean;}}, vote: (vote: boolean) => void}> {
    countDownRef: React.RefObject<HTMLElement> = React.createRef();
    render(): React.ReactNode {
        const dialogContent = React.createElement("div", {className: "flex-column kick-state"}, [
            React.createElement("p", {key: "kickStateText"}, `Probíhá vyhazování hráče ${this.props.kickState.who}`),
            React.createElement("div", {
                key: "kickState",
                onClick: (event: MouseEvent) => {event.stopPropagation();}
            }, Object.entries(this.props.kickState.state).map(([player, vote]) => React.createElement("p", {
                key: `kickPlayer${player}`,
            }, `${player} - ${vote ? "souhlasí" : "nesouhlasí"}`))),
            React.createElement(Button, {key: "kickStateVote", onClick: () => this.props.vote(true)}, "+1"),
            React.createElement("p", {key: "kickStateCountdown", ref: this.countDownRef}, `${this.props.secondsLeft}s`)
        ]);
        return dialogContent;
    }

    componentDidMount() {
        window.setInterval(() => {
            if (this.countDownRef.current === null) {
                return;
            }
            const parsed = window.parseInt(this.countDownRef.current.innerText);
            this.countDownRef.current.innerText = `${parsed - 1}s`;
        }, 1000);
    }
}
