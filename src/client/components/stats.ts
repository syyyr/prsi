import * as React from "react";
import {FrontendStats} from "../../common/communication";

export default class extends React.Component<{stats: {[key in string]: FrontendStats}}> {
    render(): React.ReactNode {
        return React.createElement("table", {className: "statsTable"},
            [
                React.createElement("thead", null, [
                    React.createElement("tr", null,
                        React.createElement("th", {colSpan: "3"}, "Statistika")
                    ),
                    React.createElement("tr", null, [
                        React.createElement("td", {className: "statsDesc"}, "Jméno"),
                        React.createElement("td", {className: "statsDesc"}, "Úspěšnost"),
                        React.createElement("td", {className: "statsDesc"}, "Odehráno")
                    ])
                ]),
                React.createElement("tbody", {className: "statsHeader"}, [
                    ...Object.entries(this.props.stats).map(([player, stats]) => React.createElement("tr", null, [
                        React.createElement("td", null, player),
                        React.createElement("td", null, `${Math.round(stats.successRate * 100)} %`),
                        React.createElement("td", null, stats.gamesPlayed),
                    ]))
                ]),
            ]);
    }
}
