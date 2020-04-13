import * as React from "react";
import {FrontendStats} from "../../common/communication";

export default class Stats extends React.Component<{stats: {[key in string]: FrontendStats}}> {
    render(): React.ReactNode {
        return React.createElement("table", {className: "statsTable"},
            [
                React.createElement("thead", {key: "statsTable"}, [
                    React.createElement("tr", {key: "statsHeader"},
                        React.createElement("th", {colSpan: "3"}, "Statistika")
                    ),
                    React.createElement("tr", {key: "statsDesc"}, [
                        React.createElement("td", {key: "statsDescName", className: "statsDesc"}, "Jméno"),
                        React.createElement("td", {key: "statsDescSuccess", className: "statsDesc"}, "Úspěšnost"),
                        React.createElement("td", {key: "statsDescPlayed", className: "statsDesc"}, "Odehráno")
                    ])
                ]),
                React.createElement("tbody", {key: "statsMain", className: "statsHeader"}, [
                    ...Object.entries(this.props.stats).map(([player, stats]) => React.createElement("tr", {key: `stats:${player}`}, [
                        React.createElement("td", {key: `stats:${player}:name`}, player),
                        React.createElement("td", {key: `stats:${player}:success`}, `${Math.round(stats.successRate * 100)} %`),
                        React.createElement("td", {key: `stats:${player}:played`}, stats.gamesPlayed),
                    ]))
                ]),
            ]);
    }
}
