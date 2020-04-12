import * as React from "react";
import CardBack from "./cardback";
import PlaceComponent from "./place";
import {Place} from "../../common/types";

class PlayerDetails extends React.Component<{name: string, shouldEmphasize: boolean}> {
    render(): React.ReactNode {
        return [
            React.createElement("img", {key: `${this.props.name}text`, className: "align-center", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAAAAAA7VNdtAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAHdElNRQfkAxoBNCHPhLeBAAAC1klEQVRIx72VUW8TRxSFz5ldex0nkITIlYBiIGkqtRJCSJUQBfoH4K0q/41n3vgDgBDiAfrQhgpSkNpASoIoaUKDgJBtMMnew8N6vbNrJsBLrV1Zsu7nc87MnTtcwud+3GcT/xMSB36nHADp0xCiB/enOqmaY2MJ7eMI/51/omgF0bbi1uThmQONmhTri2zzt56LIAFC4Mj06S+rzFD8nW2KICRIIP77ZzWF4y7GaCtrAsTB++r6XHe22yqV6sbsxk2BQPESgJB0z06HjLmFnzPJNHhNEth7+bQXMvb2l00nQiCU+xcBIR1tBhD3fBkqQuRPjjYSMaCynqoU8eQ20miQv5ZlKzOZFSnKPO/+2A5loZWWPDkkjXeDJqghCYyDas9f59yIAipOEqvVhGjJGEPGRqIdVpzlctaKQg2jdrLFvsrggajxcsGqCNOrb4S6CiEbcVlAJV3suTxLkb8v9GKzHdgX54qdqGyO6c5yKH4UG2oS+eaYd2CqSLNphCpLLBBCeyIQX3Fb5i9uIWcHp0qkmqV5SDKTqZ+lSISZBAHEHZ/IhsObJTMIITZ7vuGVFnJZ1x8y9YN89tusX106s/YPox5S6zGNnrirak8iOnPya39k1s8Lx5lVe9Kmf5rIEES4scdJgH/C3PfjFaLWlncvn4nNMwbRjp2qzWQfcfcvri23MvjzxQ5c2GshhFy/tOp6PaKcSUDy40z9toj75dhJdWUhbxFv6Nk33w3dSjFAauPvhcWVnfX+/C7qRfBEOxtCIqXLv917lhpJqqzPv9kghpDbjx8svYGjA1B44EAuu3bkK9SsRY/urW3TAfm9gOqfii/m7WCrykRTZF427AAgsPn70ngn9qGoAx/gsJxW7qxNTnhDqUA8ri7H3uLc6ujkQKmChOS49ejXZ519IeTDcq731/3ufu2CfECOrx/OfqHdkbocXz/uTvHjiI9x/UF81AHvAUsu4a2o7jG+AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIwLTAzLTI2VDAxOjUxOjE0KzAwOjAwU4EjDAAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMC0wMy0yNlQwMTo1MToxNCswMDowMCLcm7AAAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAAAAElFTkSuQmCC"}),
            React.createElement("p", {key: this.props.name, className: `${this.props.shouldEmphasize ? "bold" : ""}`}, this.props.name)
        ];
    }
}

class PlayerCards extends React.Component<{cards: number}> {
    render(): React.ReactNode {
        return React.createElement("div",
            {className: "flex-row cardBacks-container"},
            Array.from({length: this.props.cards}).map((_value, index) => React.createElement(CardBack, {key: `card:${index}`})))
    }
}

interface PlayerProps {
    name: string;
    onTurn: boolean;
    cards?: number;
    place?: Place;
}

export default class extends React.Component<PlayerProps> {
    render(): React.ReactNode {
        const playerInfoRender =
            typeof this.props.cards !== "undefined" ? React.createElement(PlayerCards, {cards: this.props.cards})
            : typeof this.props.place !== "undefined" ? React.createElement(PlaceComponent, {place: this.props.place})
            : undefined;

        return React.createElement("div", {className: "flex-column player-container"}, [
            React.createElement(PlayerDetails, {
                name: this.props.onTurn ? `${this.props.name} (ty)` : this.props.name,
                shouldEmphasize: this.props.onTurn
            }),
            playerInfoRender
        ]);
    }
}
