import * as React from "react";
import * as ReactDOM from "react-dom";
import {UI} from "./ui";

ReactDOM.render(
    React.createElement(UI, null, null),
    window.document.getElementById("game")
);
