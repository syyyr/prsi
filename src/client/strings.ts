import {ActionType, Color, Value, LastAction, Status} from "../common/types"

interface YouOther {
    you: string;
    other: string;
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
            Object.assign(this[key as Status], overrides[key as Status]);
        });
    }
}

export const colorStrings = {
    [Color.Kule]: "kule",
    [Color.Listy]: "listy",
    [Color.Srdce]: "srdce",
    [Color.Zaludy]: "žaludy",
}

export const values = {
    [Value.Sedmicka]: "sedmu",
    [Value.Osmicka]: "osmičku",
    [Value.Devitka]: "devítku",
    [Value.Desitka]: "desítku",
    [Value.Spodek]: "spodka",
    [Value.Svrsek]: "svrška",
    [Value.Kral]: "krále",
    [Value.Eso]: "eso",
}

const genPlayColor = (color: Color): InstructionStrings => {
    return new InstructionStrings({
        [Status.Ok]: {you: `Hraješ. (${colorStrings[color]})`, other: "@PLAYERNAME@ hraje."},
        [Status.CardMismatch]: {you: `Tohle tam nemůžeš dát. Musíš zahrát ${colorStrings[color]}.`},
        [Status.PlayerMismatch]: {other: "Teď nehraješ, hraje @PLAYERNAME@."}
    });
}

const genPlaySeven = (drawCount: string): InstructionStrings => {
    return new InstructionStrings({
        [Status.Ok]: {you: `Lížeš ${drawCount}${drawCount !== "osm" ? ", nebo zahraj sedmu" : ""}.`, other: "@PLAYERNAME@ hraje."},
        [Status.NotASeven]: {you: `Tohle tam nemůžeš dát. Lízej ${drawCount}${drawCount !== "osm" ? ", nebo zahraj sedmu" : ""}.`},
        [Status.PlayerMismatch]: {other: "Teď nehraješ, hraje @PLAYERNAME@."}
    });
}

export const instructionStrings: {[key in keyof typeof ActionType]: InstructionStrings} = {
    [ActionType.Play]: new InstructionStrings({
        [Status.Ok]: {you: "Hraješ.", other: "@PLAYERNAME@ hraje."},
        [Status.CardMismatch]: {you: "Tohle tam nemůžeš dát. Musíš zahrát @TOPVALUE@ nebo @TOPCOLOR@ (nebo si lízni)."},
        [Status.PlayerMismatch]: {other: "Teď nehraješ, hraje @PLAYERNAME@."},
        [Status.MustShuffle]: {you: "Hra skončila, musíš zamíchat.", other: "Hra skončila, @PLAYERNAME@ musí zamíchat."}
    }),
    [ActionType.PlayKule]: genPlayColor(Color.Kule),
    [ActionType.PlayListy]: genPlayColor(Color.Listy),
    [ActionType.PlayZaludy]: genPlayColor(Color.Zaludy),
    [ActionType.PlaySrdce]: genPlayColor(Color.Srdce),
    [ActionType.Shuffle]: new InstructionStrings({
        [Status.Ok]: {you: "Mícháš.", other: "Míchá @PLAYERNAME@."},
        [Status.PlayerMismatch]: {other: "Ty nemícháš, míchá @PLAYERNAME@."},
        [Status.MustShuffle]: {you: "Hra skončila, musíš zamíchat.", other: "Hra skončila, @PLAYERNAME@ musí zamíchat."}
    }),
    [ActionType.DrawTwo]: genPlaySeven("dvě"),
    [ActionType.DrawFour]: genPlaySeven("čtyři"),
    [ActionType.DrawSix]: genPlaySeven("šest"),
    [ActionType.DrawEight]: genPlaySeven("osm"),
    [ActionType.SkipTurn]: new InstructionStrings({
        [Status.Ok]: {you: "Stojíš nebo zahraj eso.", other: "@PLAYERNAME@ hraje."},
        [Status.NotAnAce]: {you: "Tohle tam nemůžeš dát. Buď stojíš, nebo zahraj eso."},
        [Status.PlayerMismatch]: {other: "Teď nehraješ, hraje @PLAYERNAME@."}
    }),
};

export const lastPlayStrings: {[key in keyof typeof LastAction]: YouOther} = {
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

type InstructionOverride = {
    [key in keyof typeof Status]?: {you?: string, other?: string};
}

export const drawButtonString = {
    [ActionType.DrawTwo]: "Líznout 2",
    [ActionType.DrawFour]: "Líznout 4",
    [ActionType.DrawSix]: "Líznout 6",
    [ActionType.DrawEight]: "Líznout 8",
    [ActionType.SkipTurn]: "Stojím",
    [ActionType.Shuffle]: "Zamíchat",
};

export const cardsGenitive: {[key in keyof typeof Color]: {[key2 in keyof typeof Value]: string}} = {
    [Color.Kule]: {
        [Value.Sedmicka]: "kulou sedmu",
        [Value.Osmicka]: "kulovou osmičku",
        [Value.Devitka]: "kulovou devítku",
        [Value.Desitka]: "kulovou desítku",
        [Value.Spodek]: "kulovýho spodka",
        [Value.Svrsek]: "kulovýho svrška",
        [Value.Kral]: "kulovýho krále",
        [Value.Eso]: "kulový eso",
    },
    [Color.Listy]: {
        [Value.Sedmicka]: "listovou sedmu",
        [Value.Osmicka]: "listovou osmičku",
        [Value.Devitka]: "listovou devítku",
        [Value.Desitka]: "listovou desítku",
        [Value.Spodek]: "listovýho spodka",
        [Value.Svrsek]: "listovýho svrška",
        [Value.Kral]: "listovýho krále",
        [Value.Eso]: "listový eso",
    },
    [Color.Zaludy]: {
        [Value.Sedmicka]: "žaludovou sedmu",
        [Value.Osmicka]: "žaludovou osmičku",
        [Value.Devitka]: "žaludovou devítku",
        [Value.Desitka]: "žaludovou desítku",
        [Value.Spodek]: "žaludovýho spodka",
        [Value.Svrsek]: "žaludovýho svrška",
        [Value.Kral]: "žaludovýho krále",
        [Value.Eso]: "žaludový eso",
    },
    [Color.Srdce]: {
        [Value.Sedmicka]: "srdcovou sedmu",
        [Value.Osmicka]: "srdcovou osmičku",
        [Value.Devitka]: "srdcovou devítku",
        [Value.Desitka]: "srdcovou desítku",
        [Value.Spodek]: "srdcovýho spodka",
        [Value.Svrsek]: "srdcovýho svrška",
        [Value.Kral]: "srdcovýho krále",
        [Value.Eso]: "srdcový eso",
    }
}

export enum CardTooltip {
    NoSkip = "(nestojíš)",
    NoDraw = "(nelížeš)"
}
