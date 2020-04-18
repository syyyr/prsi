import * as React from "react";
import {Place as PlaceType} from "../../common/types";

export default class Place extends React.PureComponent<{place: PlaceType, lastPlace: boolean}> {
    render() {
        return React.createElement("div", null, (() => {
            if (this.props.lastPlace) {
                return "👎";
            }
            switch (this.props.place) {
                case PlaceType.First:
                    return "🍺🍺🍺";
                case PlaceType.Second:
                    return "🍺🍺";
                case PlaceType.Third:
                    return "🍺";
                case PlaceType.Fourth:
                    return "✔";
                case PlaceType.Fifth:
                    return "✔";
                case PlaceType.Sixth:
                    return "✔";
            }
        })());
    }
}
