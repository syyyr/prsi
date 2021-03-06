export enum Color {
    Zaludy = "Zaludy",
    Srdce = "Srdce",
    Listy = "Listy",
    Kule = "Kule"
}

export enum Value {
    Sedmicka = "Sedmicka",
    Osmicka = "Osmicka",
    Devitka = "Devitka",
    Desitka = "Desitka",
    Spodek = "Spodek",
    Svrsek = "Svrsek",
    Kral = "Kral",
    Eso = "Eso"
}

export class Card {
    public color: Color;
    public value: Value;
    constructor(color: Color, value: Value) {
        this.color = color;
        this.value = value;
    }

    public toString(): string {
        return `${this.value}${this.color}`;
    }
}

export class Transformation {
    rotation: number;
    translateX: number;
    translateY: number;
    constructor(rotation: number, translateX: number, translateY: number) {
        this.rotation = rotation;
        this.translateX = translateX;
        this.translateY = translateY;
    }
}

export const sameCards = (a: Card, b: Card) => a.color === b.color && a.value === b.value;

export enum Status {
    Ok = "Ok",
    ActionMismatch = "ActionMismatch",
    CardMismatch = "CardMismatch",
    PlayerMismatch = "PlayerMismatch",
    DontHaveCard = "DontHaveCard",
    MustShuffle = "MustShuffle",
    NotASeven = "NotASeven",
    NotAnAce = "NotAnAce",
}

export enum PlayType {
    Draw = "Draw",
    Play = "Play",
}

export enum ActionType {
    Shuffle = "Shuffle",
    Play = "Play",
    DrawTwo = "DrawTwo",
    DrawFour = "DrawFour",
    DrawSix = "DrawSix",
    DrawEight = "DrawEight",
    SkipTurn = "SkipTurn",
    PlaySrdce = "PlaySrdce",
    PlayKule = "PlayKule",
    PlayZaludy = "PlayZaludy",
    PlayListy = "PlayListy",
}

export class PlayDetails {
    card: Card;
    colorChange?: Color;
    returned?: string;
    constructor(card: Card, changeTo?: Color, returned?: string) {
        this.card = card;
        this.colorChange = changeTo;
        this.returned = returned;
    }
}

export enum LastAction {
    Play = "Play",
    SkipTurn = "SkipTurn",
    Draw = "Draw",
    DrawTwo = "DrawTwo",
    DrawFour = "DrawFour",
    DrawSix = "DrawSix",
    DrawEight = "DrawEight",
    Change = "Change",
    Disconnect = "Disconnect",
    Return = "Return",
}

export class LastPlay {
    playerAction: LastAction;
    who: string;
    didWin: boolean;
    playDetails?: PlayDetails;
    constructor(playerAction: LastAction, who: string, didWin: boolean, playDetails?: PlayDetails) {
        this.playerAction = playerAction;
        this.who = who;
        this.didWin = didWin;
        this.playDetails = playDetails;
    }
}

export class PlayerAction {
    action: PlayType;
    who: string;
    playDetails?: PlayDetails;
    constructor(action: PlayType, who: string, playDetails?: PlayDetails) {
        this.action = action;
        this.who = who;
        this.playDetails = playDetails;
    }
}

export const changeActionToColor = (action: ActionType): Color | undefined => {
    switch (action) {
    case ActionType.PlaySrdce: return Color.Srdce;
    case ActionType.PlayListy: return Color.Listy;
    case ActionType.PlayKule: return Color.Kule;
    case ActionType.PlayZaludy: return Color.Zaludy;
    }
};
