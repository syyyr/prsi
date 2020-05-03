import * as React from "react";
import {FrontendStats} from "../../common/communication";

const calcSuccess = (stats: FrontendStats) => {
    if (stats.acquiredPts.length === 0) {
        return 0;
    }
    return Math.round(stats.acquiredPts.reduce((a, b) => a + b, 0) / stats.acquiredPts.length * 100);
};

export default class Stats extends React.PureComponent<{stats: {[key in string]: FrontendStats}}> {
    render(): React.ReactNode {
        return React.createElement("table", {className: "stats-table"},
            [
                React.createElement("thead", {key: "statsTable", className: "stats-header"}, [
                    React.createElement("tr", {key: "statsHeader"},
                        React.createElement("th", {colSpan: "2"}, "Statistika")
                    ),
                    React.createElement("tr", {key: "statsDesc"}, [
                        React.createElement("td", {key: "statsDescName", className: "stats-desc"}, "Jméno"),
                        React.createElement("td", {key: "statsDescSuccess", className: "stats-desc"}, "Úspěšnost"),
                    ])
                ]),
                React.createElement("tbody", {key: "statsMain"}, [
                    ...Object.entries(this.props.stats).map(([player, stats]) => React.createElement("tr", {key: `stats:${player}`}, [
                        React.createElement("td", {key: `stats:${player}:name`}, player),
                        React.createElement("td", {key: `stats:${player}:success`}, `${calcSuccess(stats)} %`)
                    ]))
                ]),
            ]);
    }
}
