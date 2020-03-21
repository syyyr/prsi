export enum Color {
    Zaludy = "♦",
    Srdce = "♥",
    Listy = "♠",
    Kule = "♣"
}

export enum Value {
    Sedmicka = "7",
    Osmicka = "8",
    Devitka = "9",
    Desitka = "10",
    Spodek = "J",
    Svrsek = "Q",
    Kral = "K",
    Eso = "A"
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

export enum Status {
    Ok = "Ok",
    ActionMismatch = "ActionMismatch",
    CardMismatch = "CardMismatch",
    PlayerMismatch = "PlayerMismatch",
    DontHaveCard = "DontHaveCard",
    MustShuffle = "MustShuffle",
    NotASeven = "NotASeven",
    NotAnAce = "NotAnAce",
    WrongColor = "WrongColor"
}

export enum PlayType {
    Draw = "Draw",
    Play = "Play",
}

export class PlayDetails {
    card: Card;
    colorChange?: Color;
    constructor(card: Card, changeTo?: Color) {
        this.card = card;
        this.colorChange = changeTo;
    }
}
