import * as React from "react";
import {UI} from "./ui-common";
import {Card, Color} from "./types";
import images from "./card-images";
import colors from "./color-images";
import {CardCounts} from "./communication";

class Player extends React.Component<{name: string, shouldEmphasize: boolean}> {
    render(): React.ReactNode {
        return [
            React.createElement("img", {key: `${this.props.name}text`, className: "inline-block", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAAAAAA7VNdtAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAHdElNRQfkAxoBNCHPhLeBAAAC1klEQVRIx72VUW8TRxSFz5ldex0nkITIlYBiIGkqtRJCSJUQBfoH4K0q/41n3vgDgBDiAfrQhgpSkNpASoIoaUKDgJBtMMnew8N6vbNrJsBLrV1Zsu7nc87MnTtcwud+3GcT/xMSB36nHADp0xCiB/enOqmaY2MJ7eMI/51/omgF0bbi1uThmQONmhTri2zzt56LIAFC4Mj06S+rzFD8nW2KICRIIP77ZzWF4y7GaCtrAsTB++r6XHe22yqV6sbsxk2BQPESgJB0z06HjLmFnzPJNHhNEth7+bQXMvb2l00nQiCU+xcBIR1tBhD3fBkqQuRPjjYSMaCynqoU8eQ20miQv5ZlKzOZFSnKPO/+2A5loZWWPDkkjXeDJqghCYyDas9f59yIAipOEqvVhGjJGEPGRqIdVpzlctaKQg2jdrLFvsrggajxcsGqCNOrb4S6CiEbcVlAJV3suTxLkb8v9GKzHdgX54qdqGyO6c5yKH4UG2oS+eaYd2CqSLNphCpLLBBCeyIQX3Fb5i9uIWcHp0qkmqV5SDKTqZ+lSISZBAHEHZ/IhsObJTMIITZ7vuGVFnJZ1x8y9YN89tusX106s/YPox5S6zGNnrirak8iOnPya39k1s8Lx5lVe9Kmf5rIEES4scdJgH/C3PfjFaLWlncvn4nNMwbRjp2qzWQfcfcvri23MvjzxQ5c2GshhFy/tOp6PaKcSUDy40z9toj75dhJdWUhbxFv6Nk33w3dSjFAauPvhcWVnfX+/C7qRfBEOxtCIqXLv917lhpJqqzPv9kghpDbjx8svYGjA1B44EAuu3bkK9SsRY/urW3TAfm9gOqfii/m7WCrykRTZF427AAgsPn70ngn9qGoAx/gsJxW7qxNTnhDqUA8ri7H3uLc6ujkQKmChOS49ejXZ519IeTDcq731/3ufu2CfECOrx/OfqHdkbocXz/uTvHjiI9x/UF81AHvAUsu4a2o7jG+AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIwLTAzLTI2VDAxOjUxOjE0KzAwOjAwU4EjDAAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMC0wMy0yNlQwMTo1MToxNCswMDowMCLcm7AAAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAAAAElFTkSuQmCC"}),
            React.createElement("p", {key: this.props.name, className: `inline-block ${this.props.shouldEmphasize ? "bold" : ""}`}, this.props.name)
        ];
    }
}

export class ImgUI extends UI {
    renderCard(card: Card, halo: boolean, onClick?: () => void): React.ReactNode {
        const options = {
            onClick,
            className: `left-margin inline-block fit-content ${typeof onClick !== "undefined" ? "clickable" : ""} ${halo ? "halo" : ""}`,
            src: images[card.color][card.value],
            draggable: false
        }
        return React.createElement("img", {key: "card", ...options});
    }
    renderPicker(onClick: (color: Color) => void): React.ReactNode {
        return [
            React.createElement("p", {key: "changeTo", className: "fit-content inline-block"}, "Měním na:"),
            ...[Color.Kule, Color.Listy, Color.Srdce, Color.Zaludy].map((color) => React.createElement(
                "img",
                {
                    key: color,
                    className: "inline-block clickable left-margin",
                    onClick: () => onClick(color),
                    src: colors[color],
                    draggable: false
                }
            ))
        ];
    }

    renderPlayers(players: string[], whoseTurn?: string, cardCounts?: CardCounts): React.ReactNode {
        return React.createElement("div", {key: "players"},
            [
                ...players.map((player) => {
                    const countElements = Array.from({length: typeof cardCounts !== "undefined" ? cardCounts[player] : 0});
                    return [
                        React.createElement(Player, {
                            name: this.props.thisName === player ? `${player} (ty)` : player,
                            key: player,
                            shouldEmphasize: typeof whoseTurn !== "undefined" && whoseTurn === player}, null
                        ),
                        ...countElements.map((_value, index) =>
                            React.createElement("img", {src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAnCAMAAADNRxOMAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABcVBMVEU1NTWFhYSGhoWSkpSMjI/OztpubpdfX4xgYIxhYY2ZmZmEhKdRUYFqapNxcZh0dJtKSnxmZpBycplzc5pjY46Wlpd7e6BtbZVfX4tiYo1nZ5FpaZJJSXtZWYc6OnA5OW9hYYxbW4g5OXBeXopiYo5ubpZWVoVBQXU+PnNcXIlXV4VAQHQ/P3RpaZNMTH5OTn9ra5RoaJFLS31MTH18fKBNTX5UVINeXotDQ3d/f6KAgKNHR3pFRXhQUIBGRnlPT39WVoSdnbiSkrCTk7CamrZvb5ZAQHWQkK92dpxoaJJ1dZuNjax0dJo7O3FaWoh3d5xaWodERHhlZZBsbJRdXYpTU4I1NW0zM2t8fKFISHtCQnZPT4BVVYRYWIZERHddXYk+PnQyMmorK2UuLmcyMmtTU4NwcJhsbJVBQXZlZY9vb5eBgaR3d512dptXV4Z7e5+Dg6WpqcG1tcpJSXw9PXJOTn6hobuoqMCWlrNqapT///9loAQxAAAAA3RSTlOE8fHbV2X0AAAAAWJLR0R6ONWFagAAAAd0SU1FB+QDGgE5J5NJbPkAAAABb3JOVAHPoneaAAACbUlEQVQoz32Ta1eiUBiFraY6lSDYSZSLgqR5icQLammaZaZFaZhNkd1Lyu73mX8/Ai11zSyHD3x51jnvPvvd22IZGvnx7zcyZLEMj46NAwAmQP9vfGx02DI5ZUVQG8Bw+zTE4LQdx4ANRaxTk5YZB044XSSGgAmKpiYAgpEuJ4E7ZjrExrg9LOTcXn6W97o5yHrcjM0gPv9cIMiEwvMMw8yHQ0wwMOf3GQQVFiIiF43FKY6Kx6KcGFkQUJ0kpGQK0mn74hKRIZYW7WkappJSwiS8Kx7KLlulmGS15kJxF28SB4pIeXt0pbDKRsBakYva8xJi3OZY95cCkExtFMqVzeKWi4SBkn/dIDKz7SGRSi6zU63tRlCE9GwzskGU+h4g2EaO3qd/0nQQEGCvrujkADtshNSj5jFMSyf4KZ9XQ41D7EDX1gCKwCSdZ+cX6uWVqlwzggIahrYqDJdaBMj4AOGkaERrlcKwaswRm9kbcMtF2/Id1cLZW/Ym2xQNcp9yewkNlZM8w/vLDxrhdafuDVIjcQE+ik/k88trPdF+hIhC1gxtb2os//6hfbJfv77YT+3j/Simvh30zrQT9deXZ/JJfITC95nvOQ9lf2dOUkb75pjaWLxF3cntKHcLutqM92gITTkJ4MsAovse04NrRb26VC/Oz5zJrgemb3n+FD+R0vC4edT1zaGIHa9BkO44vU/nGmzHa1Hp2w8a2a1VdzK5yu/efsyduraKm5VyYSPVt1NU0HPAFddAhF0trOg56KZKz07OamRnOdvLTi9v2l95G5zR/+Ra1rsw2+3CrN4FU/Wg/gzu3OCeDuz2H2ram4tWubMYAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIwLTAzLTI2VDAxOjU1OjU1KzAwOjAweFeGOAAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMC0wMy0yNlQwMTo1NTo1NSswMDowMAkKPoQAAAAASUVORK5CYII=", key: `card:${player}${index}`})
                        )
                    ];
                }),
            ]
        )
    }
}
