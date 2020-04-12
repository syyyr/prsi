import * as React from "react";
import {Place} from "../../common/types";

export default class extends React.Component<{place: Place}> {
    render() {
        return React.createElement("div", null, (() => {
            switch (this.props.place) {
                case Place.First:
                    return "1️⃣";
                case Place.Second:
                    return "2️⃣";
                case Place.Third:
                    return "3️⃣";
                case Place.Fourth:
                    return "4️⃣";
                case Place.Fifth:
                    return "5️⃣";
                case Place.Sixth:
                    return "6️⃣";
            }
        })());
    }
}
