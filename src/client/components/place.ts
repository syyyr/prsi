import * as React from "react";
import {Place} from "../../common/types";

export default class extends React.Component<{place: Place}> {
    render() {
        return React.createElement("div", null, (() => {
            switch (this.props.place) {
                case Place.First:
                    return "První";
                case Place.Second:
                    return "Druhej";
                case Place.Third:
                    return "Třetí";
                case Place.Fourth:
                    return "Čtvrtej";
                case Place.Fifth:
                    return "Pátej";
                case Place.Sixth:
                    return "Šeštej";
            }
        })());
    }
}
