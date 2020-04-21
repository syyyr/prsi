import * as React from "react";

export default class Place extends React.PureComponent<{place: number, lastPlace: boolean}> {
    render() {
        return React.createElement("div", null, (() => {
            if (this.props.lastPlace) {
                return "👎";
            }
            switch (this.props.place) {
                case 1:
                    return "🍺🍺🍺";
                case 2:
                    return "🍺🍺";
                case 3:
                    return "🍺";
                default:
                    return "✔";
            }
        })());
    }
}
