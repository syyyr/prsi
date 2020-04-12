import * as React from "react";
import {isErrorResponse, isFrontendState, FrontendState, StartGame, PlayerInput, FrontendStats} from "../common/communication";
import {Card, PlayDetails, PlayType, Value, Color, ActionType, Status, LastPlay, LastAction, Place, changeActionToColor} from "../common/types";
import {CARDS_GENITIVE} from "./card-strings"
import images from "./card-images";
import colors from "./color-images";
import {audio} from "./sounds";

class Title extends React.Component<Renderer> {
    render(): React.ReactNode {
        return this.props.renderer();
    }
}

class Prompt extends React.Component<{instructions: string, lastPlay?: string}> {
    render() {
        return React.createElement(
            "p",
            {key: "prompt", className: "flex-row align-center"},
            `${typeof this.props.lastPlay !== "undefined" ? this.props.lastPlay  + " " : ""}${this.props.instructions}`);
    }
}

type Renderer = {renderer: () => React.ReactNode};

class CardComponentBase extends React.Component<Renderer> {
    render() {
        return this.props.renderer();
    }
}

class StartButton extends React.Component<{onClick: () => void}> {
    render() {
        return React.createElement(
            "button",
            {
                onClick: this.props.onClick
            },
            "Start");

    }
}

const renderPlace = (place: Place): React.ReactNode => {
    return React.createElement("div", null, (() => {
        switch (place) {
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

interface PlayerBoxProps {
    thisName: string;
    players: string[];
    whoseTurn?: string;
    playerInfo?: {[key in string]: {cards?: number, place?: Place}};
}

class PlayerBox extends React.Component<PlayerBoxProps> {
    render(): React.ReactNode {
        const players = this.props.players;
        const playerInfo = this.props.playerInfo;
        const whoseTurn = this.props.whoseTurn;
        return React.createElement("div", {key: "players", className: "flex-row"},
            [
                ...players.map((player) => {
                    let playerInfoRender: undefined | React.ReactNode = undefined;
                    if (typeof playerInfo !== "undefined" && typeof playerInfo[player] !== "undefined") {
                        if (typeof playerInfo[player]!.cards === "number") {
                            playerInfoRender = React.createElement("div",
                                {className: "flex-row cardBacks-container"},
                                // I have no idea why Typescript complains without an `!`
                                Array.from({length: playerInfo[player].cards!}).map((_value, index) => renderCardBack(`card:${player}${index}`)))
                        } else {
                            playerInfoRender = renderPlace(playerInfo[player].place!);
                        }
                    }
                    return [
                        React.createElement("div", {className: "flex-column player-container"}, [
                            React.createElement(Player, {
                                name: this.props.thisName === player ? `${player} (ty)` : player,
                                key: player,
                                shouldEmphasize: typeof whoseTurn !== "undefined" && whoseTurn === player}, null
                            ),
                            playerInfoRender
                        ])
                    ];
                }),
            ]
        )
    }
}

interface YouOther {
    you: string;
    other: string;
}

type InstructionOverride = {
    [key in keyof typeof Status]?: {you?: string, other?: string};
}

class InstructionStrings {
    [Status.Ok]: YouOther = {you: "ERROR: Ok/you", other: "ERROR: Ok/other"};
    [Status.PlayerMismatch]: YouOther = {you: "ERROR: PlayerMismatch/you", other: "ERROR: PlayerMismatch/other"};
    [Status.CardMismatch]: YouOther = {you: "ERROR: CardMismatch/you", other: "ERROR: CardMismatch/other"};
    [Status.ActionMismatch]: YouOther = {you: "ERROR: ActionMismatch/you", other: "ERROR: ActionMismatch/other"};
    [Status.DontHaveCard]: YouOther = {you: "ERROR: DontHaveCard/you", other: "ERROR: DontHaveCard/other"};
    [Status.NotAnAce]: YouOther = {you: "ERROR: NotAnAce/you", other: "ERROR: NotAnAce/other"};
    [Status.NotASeven]: YouOther = {you: "ERROR: NotASeven/you", other: "ERROR: NotASeven/other"};
    [Status.MustShuffle]: YouOther = {you: "ERROR: MustShuffle/you", other: "ERROR: MustShuffle/other"};
    constructor(overrides?: InstructionOverride) {
        if (typeof overrides === "undefined") {
            return;
        }

        Object.keys(overrides).forEach((key: string) => {
            const actualKey = key as Status; // TODO: check if Object.keys can return the enum
            const override = overrides[actualKey]!;
            if (typeof override.you !== "undefined") {
                this[actualKey].you = override.you;
            }
            if (typeof override.other !== "undefined") {
                this[actualKey].other = override.other;
            }
        });
    }
}

const startGame = (ws: any) => ws.send(JSON.stringify(new StartGame()));

const isColorChange = (action: ActionType) => {
    switch (action) {
    case ActionType.PlayListy:
    case ActionType.PlayZaludy:
    case ActionType.PlaySrdce:
    case ActionType.PlayKule:
        return true;
    default:
        return false;
    }
}

const isDrawX = (action: ActionType) => {
    switch (action) {
    case ActionType.DrawTwo:
    case ActionType.DrawFour:
    case ActionType.DrawSix:
    case ActionType.DrawEight:
        return true;
    default:
        return false;
    }
}

export enum CardTooltip {
    NoSkip = "(nestojíš)",
    NoDraw = "(nelížeš)"
}

export interface CardOptions {
    isBottomCard?: "bottom",
    colorChange?: Color,
    halo?: "halo",
    onClick?: () => void,
    tooltip?: CardTooltip,
    key: string
}

class Player extends React.Component<{name: string, shouldEmphasize: boolean}> {
    render(): React.ReactNode {
        return [
            React.createElement("img", {key: `${this.props.name}text`, className: "align-center", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAAAAAA7VNdtAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAHdElNRQfkAxoBNCHPhLeBAAAC1klEQVRIx72VUW8TRxSFz5ldex0nkITIlYBiIGkqtRJCSJUQBfoH4K0q/41n3vgDgBDiAfrQhgpSkNpASoIoaUKDgJBtMMnew8N6vbNrJsBLrV1Zsu7nc87MnTtcwud+3GcT/xMSB36nHADp0xCiB/enOqmaY2MJ7eMI/51/omgF0bbi1uThmQONmhTri2zzt56LIAFC4Mj06S+rzFD8nW2KICRIIP77ZzWF4y7GaCtrAsTB++r6XHe22yqV6sbsxk2BQPESgJB0z06HjLmFnzPJNHhNEth7+bQXMvb2l00nQiCU+xcBIR1tBhD3fBkqQuRPjjYSMaCynqoU8eQ20miQv5ZlKzOZFSnKPO/+2A5loZWWPDkkjXeDJqghCYyDas9f59yIAipOEqvVhGjJGEPGRqIdVpzlctaKQg2jdrLFvsrggajxcsGqCNOrb4S6CiEbcVlAJV3suTxLkb8v9GKzHdgX54qdqGyO6c5yKH4UG2oS+eaYd2CqSLNphCpLLBBCeyIQX3Fb5i9uIWcHp0qkmqV5SDKTqZ+lSISZBAHEHZ/IhsObJTMIITZ7vuGVFnJZ1x8y9YN89tusX106s/YPox5S6zGNnrirak8iOnPya39k1s8Lx5lVe9Kmf5rIEES4scdJgH/C3PfjFaLWlncvn4nNMwbRjp2qzWQfcfcvri23MvjzxQ5c2GshhFy/tOp6PaKcSUDy40z9toj75dhJdWUhbxFv6Nk33w3dSjFAauPvhcWVnfX+/C7qRfBEOxtCIqXLv917lhpJqqzPv9kghpDbjx8svYGjA1B44EAuu3bkK9SsRY/urW3TAfm9gOqfii/m7WCrykRTZF427AAgsPn70ngn9qGoAx/gsJxW7qxNTnhDqUA8ri7H3uLc6ujkQKmChOS49ejXZ519IeTDcq731/3ufu2CfECOrx/OfqHdkbocXz/uTvHjiI9x/UF81AHvAUsu4a2o7jG+AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIwLTAzLTI2VDAxOjUxOjE0KzAwOjAwU4EjDAAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMC0wMy0yNlQwMTo1MToxNCswMDowMCLcm7AAAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAAAAElFTkSuQmCC"}),
            React.createElement("p", {key: this.props.name, className: `${this.props.shouldEmphasize ? "bold" : ""}`}, this.props.name)
        ];
    }
}

class CardBack extends React.Component {
    render(): React.ReactNode {
        return React.createElement("img", {className: "cardback cardBacks-container-height"}, null);
    }
}

const renderCardBack = (key: string): React.ReactNode => {
    return React.createElement(CardBack, {key}, null);
}

class CardComponent extends React.Component<{card: Card, options?: CardOptions}> {
    render(): React.ReactNode {
        const options = this.props.options;
        const card = this.props.card;
        const imgOptions = {
            onClick: options?.onClick,
            className: `playfield-height${typeof options?.onClick !== "undefined" ? " clickable" : ""}${options?.halo === "halo" ? " halo" : ""}`,
            src: images[card.color][card.value],
            draggable: false,
            key: options?.key
        }
        const children = [];
        children.push(React.createElement("img", {key: "card", ...imgOptions}));
        if (typeof options?.colorChange !== "undefined") {
            children.push(React.createElement("img", {
                className: "absolute centerInsideDiv colorChange",
                src: colors[options.colorChange],
            }));
        }
        if (typeof options?.tooltip !== "undefined") {
            children.push(React.createElement("div", {className: "absolute centerInsideDiv tooltip topCardTooltip"}, "❌"));
        }
        return React.createElement("div", {
            className: `${typeof options?.isBottomCard === "undefined" ? "centerInsideDiv absolute" : "relative"}`},
            children
        );
    }
}

class ColorPicker extends React.Component<{callback: (color: Color) => void}> {
    render(): React.ReactNode {
        const dialogContent = React.createElement("div", {
            className: "picker",
            onClick: (event: MouseEvent) => {event.stopPropagation();}
        }, [
            ...[Color.Kule, Color.Listy, Color.Srdce, Color.Zaludy].map((color) => React.createElement(
                "img",
                {
                    key: color,
                    className: "clickable halo",
                    onClick: () => this.props.callback(color),
                    src: colors[color],
                    draggable: false
                }
            ))
        ])  ;
        return React.createElement("div", {
            className: "dialog", onClick: (event: MouseEvent) => {
                event.stopPropagation();
                this.setState({picker: null});
            }
        }, dialogContent);
    }
}

const drawButtonString = {
    [ActionType.DrawTwo]: "Líznout 2",
    [ActionType.DrawFour]: "Líznout 4",
    [ActionType.DrawSix]: "Líznout 6",
    [ActionType.DrawEight]: "Líznout 8",
    [ActionType.SkipTurn]: "Stojím",
    [ActionType.Shuffle]: "Zamíchat",
};

class DrawButton extends React.Component<{callback: () => void, wantedAction: ActionType, shouldDrawTooltip: boolean}> {
    render(): React.ReactNode {
        const tooltip = (() => {
            if (!this.props.shouldDrawTooltip) {
                return;
            }
            switch (this.props.wantedAction) {
                case ActionType.Play:
                case ActionType.PlayKule:
                case ActionType.PlayListy:
                case ActionType.PlaySrdce:
                case ActionType.PlayZaludy:
                    return;
            }
            return React.createElement("div", {className: "absolute centerInsideDiv tooltip"}, drawButtonString[this.props.wantedAction]);
        })();
        return React.createElement("div", {className: "relative drawButton-width"}, [
            tooltip,
            React.createElement(
                "img",
                {
                    key: "drawButton",
                    className: "cardback clickable halo playfield-height",
                    onClick: this.props.callback
                }
            )
        ]);

    }
}

export class UI extends React.Component<{ws: any, thisName: string}, {gameState?: FrontendState, picker: null | Color}> {
    renderCard(card: Card, options?: CardOptions): React.ReactNode {
        return React.createElement(CardComponent, {key: options?.key, card, options});
    }

    renderTitle(): React.ReactNode {
        return React.createElement("img", {className: "logo align-center playfield-logo"});
    }

    constructor(props: {ws: any, thisName: string}) {
        super(props);
        // FIXME: look for a better solution for picker (don't save color of the played guy)
        this.state = {picker: null};
        this.props.ws.onmessage = (message: any) => {
            const parsed = JSON.parse(message.data);

            if (isErrorResponse(parsed)) {
                console.log(parsed.error);
                return;
            }

            if (isFrontendState(parsed)) {
                console.log("new state ", parsed);
                this.setState({gameState: parsed, picker: null});
            }
        };
    }

    renderStartButton(): React.ReactNode {
        return React.createElement(
            StartButton,
            {
                key: "startButton",
                onClick: () => startGame(this.props.ws)
            },
            "Start");
    }

    renderHand(hand: Card[]): React.ReactNode {
        return React.createElement("div", {className: "flex-row hand-container"}, hand.map((card, index) => React.createElement(CardComponentBase, {
            key: `hand:${card.value}${card.color}`,
            renderer: () => this.renderCard(card, {key: `hand${index}`, isBottomCard: "bottom", halo: "halo", onClick: () => {
                if (this.state.gameState!.gameInfo!.who === this.props.thisName && card.value === Value.Svrsek) {
                    switch (this.state.gameState!.gameInfo!.wantedAction) {
                    // FIXME: use isColorChange for this
                    case ActionType.Play:
                    case ActionType.PlayKule:
                    case ActionType.PlayListy:
                    case ActionType.PlayZaludy:
                    case ActionType.PlaySrdce:
                        this.setState({picker: card.color});
                        return;
                    }
                }
                if (this.state.picker !== null) {
                    this.setState({picker: null});
                }
                this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Play, new PlayDetails(card))));
            }})
        })));
    }

    readonly colorStrings = {
        [Color.Kule]: "kule",
        [Color.Listy]: "listy",
        [Color.Srdce]: "srdce",
        [Color.Zaludy]: "žaludy",
    }

    readonly values = {
        [Value.Sedmicka]: "sedmu",
        [Value.Osmicka]: "osmičku",
        [Value.Devitka]: "devítku",
        [Value.Desitka]: "desítku",
        [Value.Spodek]: "spodka",
        [Value.Svrsek]: "svrška",
        [Value.Kral]: "krále",
        [Value.Eso]: "eso",
    }

    genPlayColor(color: Color): InstructionStrings {
        return new InstructionStrings({
            [Status.Ok]: {you: `Hraješ. (${this.colorStrings[color]})`, other: "@PLAYERNAME@ hraje."},
            [Status.CardMismatch]: {you: `Tohle tam nemůžeš dát. Musíš zahrát ${this.colorStrings[color]}.`},
            [Status.PlayerMismatch]: {other: "Teď nehraješ, hraje @PLAYERNAME@."}
        });
    }

    genPlaySeven(drawCount: string): InstructionStrings {
        return new InstructionStrings({
            [Status.Ok]: {you: `Lížeš ${drawCount}${drawCount !== "osm" ? ", nebo zahraj sedmu" : ""}.`, other: "@PLAYERNAME@ hraje."},
            [Status.NotASeven]: {you: `Tohle tam nemůžeš dát. Lízej ${drawCount}${drawCount !== "osm" ? ", nebo zahraj sedmu" : ""}.`},
            [Status.PlayerMismatch]: {other: "Teď nehraješ, hraje @PLAYERNAME@."}
        });
    }

    readonly instructionStrings: {[key in keyof typeof ActionType]: InstructionStrings} = {
        [ActionType.Play]: new InstructionStrings({
            [Status.Ok]: {you: "Hraješ.", other: "@PLAYERNAME@ hraje."},
            [Status.CardMismatch]: {you: "Tohle tam nemůžeš dát. Musíš zahrát @TOPVALUE@ nebo @TOPCOLOR@ (nebo si lízni)."},
            [Status.PlayerMismatch]: {other: "Teď nehraješ, hraje @PLAYERNAME@."},
            [Status.MustShuffle]: {you: "Hra skončila, musíš zamíchat.", other: "Hra skončila, @PLAYERNAME@ musí zamíchat."}
        }),
        [ActionType.PlayKule]: this.genPlayColor(Color.Kule),
        [ActionType.PlayListy]: this.genPlayColor(Color.Listy),
        [ActionType.PlayZaludy]: this.genPlayColor(Color.Zaludy),
        [ActionType.PlaySrdce]: this.genPlayColor(Color.Srdce),
        [ActionType.Shuffle]: new InstructionStrings({
            [Status.Ok]: {you: "Mícháš.", other: "Míchá @PLAYERNAME@."},
            [Status.PlayerMismatch]: {other: "Ty nemícháš, míchá @PLAYERNAME@."},
            [Status.MustShuffle]: {you: "Hra skončila, musíš zamíchat.", other: "Hra skončila, @PLAYERNAME@ musí zamíchat."}
        }),
        [ActionType.DrawTwo]: this.genPlaySeven("dvě"),
        [ActionType.DrawFour]: this.genPlaySeven("čtyři"),
        [ActionType.DrawSix]: this.genPlaySeven("šest"),
        [ActionType.DrawEight]: this.genPlaySeven("osm"),
        [ActionType.SkipTurn]: new InstructionStrings({
            [Status.Ok]: {you: "Stojíš nebo zahraj eso.", other: "@PLAYERNAME@ hraje."},
            [Status.NotAnAce]: {you: "Tohle tam nemůžeš dát. Buď stojíš, nebo zahraj eso."},
            [Status.PlayerMismatch]: {other: "Teď nehraješ, hraje @PLAYERNAME@."}
        }),
    };

    readonly lastPlayStrings: {[key in keyof typeof LastAction]: YouOther} = {
        [LastAction.Play]: {you: "Zahráls @CARDS_GENITIVE@.", other: "@PLAYERNAME@ zahrál @CARDS_GENITIVE@."},
        [LastAction.SkipTurn]: {you: "Stojíš.", other: "@PLAYERNAME@ stojí."},
        [LastAction.Draw]: {you: "Líznuls.", other: "@PLAYERNAME@ líznul."},
        [LastAction.DrawTwo]: {you: "Líznuls dvě.", other: "@PLAYERNAME@ líznul dvě."},
        [LastAction.DrawFour]: {you: "Líznuls čtyři.", other: "@PLAYERNAME@ líznul čtyři."},
        [LastAction.DrawSix]: {you: "Líznuls šest.", other: "@PLAYERNAME@ líznul šest."},
        [LastAction.DrawEight]: {you: "Líznuls osm.", other: "@PLAYERNAME@ líznul osm."},
        [LastAction.Change]: {you: "Změnils na @COLORCHANGE@.", other: "@PLAYERNAME@ změnil na @COLORCHANGE@."},
        [LastAction.Disconnect]: {you: "Odpojil ses? Tohle bys neměl vidět.", other: "@PLAYERNAME@ se odpojil."},
        [LastAction.Return]: {you: "Zahráls červenou sedmičku a vrátils @RETURN@ do hry!", other: "@PLAYERNAME@ zahrál červenou sedmičku a vrátil @RETURN@ do hry!"},
    };

    renderInstructions(wantedAction: ActionType, status: Status, you: string, turn: string, topCard: Card, lastPlay?: LastPlay): React.ReactNode {
        const lastPlayStr = status !== Status.Ok || typeof lastPlay === "undefined" ? undefined :
            this.lastPlayStrings[lastPlay.playerAction][you === lastPlay.who ? "you" : "other"]
            .replace("@PLAYERNAME@", lastPlay.who)
            .replace("@COLORCHANGE@", typeof lastPlay.playDetails === "undefined" ? "PLAYDETAILS unavailable" :
                typeof lastPlay.playDetails.colorChange === "undefined" ? "COLORCHANGE unavailable" :
                this.colorStrings[lastPlay.playDetails.colorChange])
            .replace("@CARDS_GENITIVE@", typeof lastPlay.playDetails === "undefined"? "CARD unavailable" :
                CARDS_GENITIVE[lastPlay.playDetails.card.color][lastPlay.playDetails.card.value])
            .replace("@RETURN@", typeof lastPlay.playDetails === "undefined" || typeof lastPlay.playDetails.returned === "undefined" ? "RETURN unavailable" :
                lastPlay.playDetails.returned)
            .replace(/\.$/, !lastPlay.didWin ? "." : lastPlay.who === you ? " a vyhráls." : " a vyhrál.");
        const instructions = this.instructionStrings[wantedAction][status][you === turn ? "you" : "other"]
            .replace("@PLAYERNAME@", turn)
            .replace("@TOPCOLOR@", this.colorStrings[topCard.color])
            .replace("@TOPVALUE@", this.values[topCard.value]);

        return React.createElement(Prompt, {key: "instructions", instructions, lastPlay: lastPlayStr}, null);
    }

    renderStats(stats: {[key in string]: FrontendStats}): React.ReactNode {
        return React.createElement("table", {className: "statsTable"},
            [
                React.createElement("thead", {className: "statsHeader"}, [
                    React.createElement("th", {colSpan: "3"}, "Statistika"),
                    React.createElement("tr", null, [
                        React.createElement("td", {className: "statsDesc"}, "Jméno"),
                        React.createElement("td", {className: "statsDesc"}, "Úspěšnost"),
                        React.createElement("td", {className: "statsDesc"}, "Odehráno")
                    ]
                )]),
                ...Object.entries(stats).map(([player, stats]) => React.createElement("tr", null, [
                    React.createElement("td", null, player),
                    React.createElement("td", null, `${Math.round(stats.successRate * 100)} %`),
                    React.createElement("td", null, stats.gamesPlayed),
                ]))
            ]);
    }

    render() {
        const elems = [];
        elems.push(React.createElement(Title, {key: "title", renderer: this.renderTitle}, null));
        if (typeof this.state.gameState === "undefined") {
            return elems;
        }
        if (this.state.gameState.gameStarted === "no" && this.state.gameState.players.length >= 2) {
            elems.push(this.renderStartButton());
        }
        elems.push(React.createElement(PlayerBox, {
            thisName: this.props.thisName,
            players: this.state.gameState.players,
            playerInfo: this.state.gameState.gameInfo?.playerInfo
        }));

        if (typeof this.state.gameState.gameInfo === "undefined") {
            elems.push(React.createElement(Prompt, {key: "prompt", instructions: "Hra nezačala."}));
            elems.push(this.renderStats(this.state.gameState.stats));
            return elems;
        }

        elems.push(this.renderInstructions(this.state.gameState.gameInfo.wantedAction,
            this.state.gameState.gameInfo.status,
            this.props.thisName,
            this.state.gameState.gameInfo.who,
            this.state.gameState.gameInfo.topCards[this.state.gameState.gameInfo.topCards.length - 1],
            this.state.gameState.gameInfo.lastPlay));

        const playfield = [];
        const topCard = [];

        if (typeof this.state.gameState.gameInfo.hand !== "undefined") {
            topCard.push(React.createElement(DrawButton, {
                callback: () => this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Draw))),
                wantedAction: this.state.gameState.gameInfo.wantedAction,
                shouldDrawTooltip: this.props.thisName !== this.state.gameState.gameInfo.who && this.state.gameState.gameInfo.wantedAction !== ActionType.Shuffle
            }));
        }

        playfield.push(React.createElement("div", {className: "flex-row topCard-container"}, topCard));

        topCard.push(React.createElement("div", {className: "relative"}, this.state.gameState.gameInfo.topCards.map((card, index, array) => {
            const firstCardOptions: {isBottomCard?: "bottom"} = {
                isBottomCard: index === 0 ? "bottom" : undefined
            };
            const lastCardOptions = index === array.length - 1 ? {
                colorChange: isColorChange(this.state.gameState!.gameInfo!.wantedAction) ? changeActionToColor(this.state.gameState!.gameInfo!.wantedAction) : undefined,
                tooltip: (() => {
                    // FIXME: Refactor to method
                    if (this.state.gameState!.gameInfo!.who !== this.props.thisName) {
                        return;
                    }
                    if (card.value === Value.Eso && this.state.gameState!.gameInfo!.wantedAction !== ActionType.SkipTurn) {
                        return CardTooltip.NoSkip;
                    }
                    if (card.value === Value.Sedmicka && !isDrawX(this.state.gameState!.gameInfo!.wantedAction)) {
                        return CardTooltip.NoDraw;
                    }
                })()
            } : {};


            return this.renderCard(card, {
                key: `topCard${index}`,
                ...firstCardOptions,
                ...lastCardOptions
            });
        })));

        if (typeof this.state.gameState.gameInfo.hand !== "undefined") {
            playfield.push(this.renderHand(this.state.gameState.gameInfo.hand));
        }

        playfield.push(React.createElement("img", {className: "playfield-logo"}, null));
        elems.push(React.createElement("div", {className: `playfield${this.state.gameState.gameInfo.who === this.props.thisName ? " bigRedHalo" : ""}`}, playfield));
        elems.push(this.renderStats(this.state.gameState.stats));

        if (this.state.picker !== null) {
            elems.push(React.createElement(
                ColorPicker,
                {
                    key: "picker",
                    callback: () => (color: Color) => {
                        this.props.ws.send(JSON.stringify(new PlayerInput(PlayType.Play, new PlayDetails(new Card(this.state.picker!, Value.Svrsek), color))));
                        this.setState({picker: null});
                    }
                }
            ));
        }

        if (this.state.gameState.gameInfo.status === Status.Ok) {
            switch (this.state.gameState.gameInfo.lastPlay?.playerAction) {
                case LastAction.DrawFour:
                case LastAction.DrawSix:
                case LastAction.DrawEight:
                    new Audio(audio[this.state.gameState.gameInfo.lastPlay.playerAction]).play();
            }
        }

        return React.createElement("div", {key: "root"}, [...elems]);
    }
}
