import * as React from "react";
import {Rooms as RoomsType} from "../../common/communication";
import Button from "./button";
import PlayerDetails from "./playerdetails";

class RoomPlayers extends React.PureComponent<{players: string[]}> {
    render(): React.ReactNode {
        return React.createElement("div", {className: "flex-row"}, this.props.players.map((player) =>
            React.createElement("div", {key: `${player}:container`, className: "flex-column"},
                React.createElement(PlayerDetails, {name: player, shouldEmphasize: false})
            ))
        );
    }
}

class Room extends React.PureComponent<{joinRoom: () => void, name: string, players: string[]}> {
    render(): React.ReactNode {
        return [
            React.createElement("p", {key: "roomText", className: "bold"}, this.props.name),
            React.createElement("div", {key: "roomPlayersCount"}, `počet hráčů: ${this.props.players.length}`),
            React.createElement(RoomPlayers, {key: "roomPlayers", players: this.props.players}),
            React.createElement(Button, {key: "roomButton", onClick: this.props.joinRoom, text: "Připojit se"})
        ];
    }
}

export default class Rooms extends React.PureComponent<{rooms: RoomsType, joinRoom: (name: string) => void}> {
    render(): React.ReactNode {
        return Object.entries(this.props.rooms.rooms).map(([name, players]) =>
            React.createElement(Room, {key: `room${name}`, name: name, players: players, joinRoom: () => this.props.joinRoom(name)}));
    }
}
