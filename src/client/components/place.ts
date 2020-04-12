import * as React from "react";
import {Place as PlaceType} from "../../common/types";

export default class Place extends React.Component<{place: PlaceType}> {
    render() {
        return React.createElement("div", null, (() => {
            switch (this.props.place) {
                case PlaceType.First:
                    return "1️⃣";
                case PlaceType.Second:
                    return "2️⃣";
                case PlaceType.Third:
                    return "3️⃣";
                case PlaceType.Fourth:
                    return "4️⃣";
                case PlaceType.Fifth:
                    return "5️⃣";
                case PlaceType.Sixth:
                    return "6️⃣";
            }
        })());
    }
}
