import * as React from "react";
import {FrontendStats} from "../../common/communication";

export default class Stats extends React.Component<{stats: {[key in string]: FrontendStats}}> {
    render(): React.ReactNode {
        return React.createElement("table", {className: "stats-table"},
            [
                React.createElement("thead", {key: "statsTable", className: "stats-header"}, [
                    React.createElement("tr", {key: "statsHeader"},
                        React.createElement("th", {colSpan: "3"}, "Statistika")
                    ),
                    React.createElement("tr", {key: "statsDesc"}, [
                        React.createElement("td", {key: "statsDescName", className: "stats-desc"}, "Jméno"),
                        React.createElement("td", {key: "statsDescSuccess", className: "stats-desc"}, "Úspěšnost"),
                        React.createElement("td", {key: "statsDescPlayed", className: "stats-desc"}, "Odehráno")
                    ])
                ]),
                React.createElement("tbody", {key: "statsMain"}, [
                    ...Object.entries(this.props.stats).map(([player, stats]) => React.createElement("tr", {key: `stats:${player}`}, [
                        React.createElement("td", {key: `stats:${player}:name`}, player),
                        React.createElement("td", {key: `stats:${player}:success`}, `${Math.round(stats.successRate * 100)} %`),
                        React.createElement("td", {key: `stats:${player}:played`}, stats.gamesPlayed),
                    ]))
                ]),
            ]);
    }
}
