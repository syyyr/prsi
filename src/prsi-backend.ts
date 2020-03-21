import {Color, Card, Status, Value} from "./prsi-types"

const sortedDeck = [
    new Card(Color.Zaludy, Value.Sedmicka),
    new Card(Color.Zaludy, Value.Osmicka),
    new Card(Color.Zaludy, Value.Devitka),
    new Card(Color.Zaludy, Value.Desitka),
    new Card(Color.Zaludy, Value.Spodek),
    new Card(Color.Zaludy, Value.Svrsek),
    new Card(Color.Zaludy, Value.Kral),
    new Card(Color.Zaludy, Value.Eso),
    new Card(Color.Kule, Value.Sedmicka),
    new Card(Color.Kule, Value.Osmicka),
    new Card(Color.Kule, Value.Devitka),
    new Card(Color.Kule, Value.Desitka),
    new Card(Color.Kule, Value.Spodek),
    new Card(Color.Kule, Value.Svrsek),
    new Card(Color.Kule, Value.Kral),
    new Card(Color.Kule, Value.Eso),
    new Card(Color.Srdce, Value.Sedmicka),
    new Card(Color.Srdce, Value.Osmicka),
    new Card(Color.Srdce, Value.Devitka),
    new Card(Color.Srdce, Value.Desitka),
    new Card(Color.Srdce, Value.Spodek),
    new Card(Color.Srdce, Value.Svrsek),
    new Card(Color.Srdce, Value.Kral),
    new Card(Color.Srdce, Value.Eso),
    new Card(Color.Listy, Value.Sedmicka),
    new Card(Color.Listy, Value.Osmicka),
    new Card(Color.Listy, Value.Devitka),
    new Card(Color.Listy, Value.Desitka),
    new Card(Color.Listy, Value.Spodek),
    new Card(Color.Listy, Value.Svrsek),
    new Card(Color.Listy, Value.Kral),
    new Card(Color.Listy, Value.Eso),
];

class Deck {
    public cards: Card[];

    constructor() {
        this.cards = sortedDeck.slice(0);
        let unshuffledLen = this.cards.length;
        while (unshuffledLen !== 0) {
            const randomCard = Math.floor(Math.random() * unshuffledLen);
            [this.cards[randomCard], this.cards[unshuffledLen - 1]] = [this.cards[unshuffledLen - 1], this.cards[randomCard]];
            --unshuffledLen;
        }
    }
}

enum ActionType {
    Shuffle = "Shuffle",
    Play = "Play",
    DrawTwo = "DrawTwo",
    DrawFour = "DrawFour",
    DrawSix = "DrawSix",
    DrawEight = "DrawEight",
    SkipTurn = "Ace",
    PlaySrdce = "PlaySrdce",
    PlayKule = "PlayKul",
    PlayZaludy = "PlayZaludy",
    PlayListy = "PlayListy",
}

const sameCards = (a: Card, b: Card) => a.color === b.color && a.value === b.value;

const compatibleCards = (a: Card, b: Card) => a.color === b.color || a.value === b.value;

export enum PlayType {
    Draw = "Draw",
    Play = "Play",
}

class GameResolution {
    winner: string;
    loser: string;
    constructor(winner: string, loser: string) {
        this.winner = winner;
        this.loser = loser;
    }
}

class State {
    public deck: Deck = new Deck();
    public playedCards: Card[] = [];
    public drawn: number = 0;
    public hands: Map<string, Card[]> = new Map();
    public whoseTurn: string;
    public gameState: "active" | "ended" = "active";
    public wantedAction: ActionType;
    public status: Status = Status.Ok;
    public gameResolution?: GameResolution;

    constructor(whoStarts: string) {
        this.whoseTurn = whoStarts;
        this.wantedAction = ActionType.Play;
    }

    public printHands(): void {
        this.hands.forEach((cards, player) => {
            console.log(`'${player}' => [${cards.map((card) => card.toString()).join(", ")}]`);
        });
    }
}

export class PlayDetails {
    card: Card;
    colorChange?: Color;
    constructor(card: Card, changeTo?: Color) {
        this.card = card;
        this.colorChange = changeTo;
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

export class Prsi {
    private _players: string[] = [];
    private _history: State[] = [];
    private _currentGame?: State;

    public resolveAction(playerAction: PlayerAction): void {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Internal error.");
        }
        this._currentGame.status = Status.Ok;

        if (playerAction.who !== this._currentGame.whoseTurn) {
            this._currentGame.status = Status.PlayerMismatch;
            return;
        }

        switch (this._currentGame.wantedAction) {
        case ActionType.Play:
            switch (playerAction.action) {
            case PlayType.Play:
                if (typeof playerAction.playDetails === "undefined") {
                    throw new Error("User wanted to play, but didn't specify what.");
                }
                this.playCard(playerAction.who, playerAction.playDetails);
                return;
            case PlayType.Draw:
                this.drawCard(playerAction.who);
                return;
            }

        case ActionType.Shuffle:
            switch (playerAction.action) {
            case PlayType.Play:
                this._currentGame.status = Status.MustShuffle;
                return;
            case PlayType.Draw:
                this.newGame();
                return;
            }

        case ActionType.DrawTwo:
        case ActionType.DrawFour:
        case ActionType.DrawSix:
        case ActionType.DrawEight:
            switch (playerAction.action) {
            case PlayType.Play:
                if (typeof playerAction.playDetails === "undefined") {
                    throw new Error("User wanted to play, but didn't specify what.");
                }
                if (playerAction.playDetails.card.value !== Value.Sedmicka) {
                    this._currentGame.status = Status.NotASeven;
                    return;
                }
                this.playCard(playerAction.who, playerAction.playDetails);
                return;
            case PlayType.Draw:
                this.drawCard(playerAction.who);
                return;
            }
        case ActionType.SkipTurn:
            switch (playerAction.action) {
            case PlayType.Play:
                if (typeof playerAction.playDetails === "undefined") {
                    throw new Error("User wanted to play, but didn't specify what.");
                }
                if (playerAction.playDetails.card.value !== Value.Eso) {
                    this._currentGame.status = Status.NotAnAce;
                    return;
                }
                this.playCard(playerAction.who, playerAction.playDetails);
                return;
            case PlayType.Draw:
                this.skipTurn();
                return;
            }

        case ActionType.PlayZaludy:
        case ActionType.PlayKule:
        case ActionType.PlayListy:
        case ActionType.PlaySrdce:
            switch (playerAction.action) {
            case PlayType.Play:
                if (typeof playerAction.playDetails === "undefined") {
                    throw new Error("User wanted to play, but didn't specify what.");
                }
                if (playerAction.playDetails.card.color !== this.changeActionToColor(this._currentGame.wantedAction)) {
                    this._currentGame.status = Status.WrongColor;
                    return;
                }
                this._currentGame.wantedAction = ActionType.Play;
                this.playCard(playerAction.who, playerAction.playDetails);
                return;
            case PlayType.Draw:
                this.drawCard(playerAction.who);
                return;
            }
        }
    }

    private skipTurn(): void {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }

        console.log(this._currentGame.whoseTurn, "skips");
        // After someone skips, the next person will definitely play
        this._currentGame.wantedAction = ActionType.Play;
        this.nextPlayer();
    }

    private nextPlayer(): void {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }

        let firstTurnPlayerIndex = this._players.indexOf(this._currentGame.whoseTurn) + 1;
        if (firstTurnPlayerIndex === this._players.length) {
            firstTurnPlayerIndex = 0;
        }

        this._currentGame.whoseTurn = this._players[firstTurnPlayerIndex];
    }

    private drawCard(player: string): void {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }

        if (!this._currentGame.hands.has(player)) {
            throw new Error("Internal error.");
        }


        const impl_draw = () => {
            if (this._currentGame!.drawn === this._currentGame!.deck.cards.length) {
                this._currentGame!.deck.cards = this._currentGame!.playedCards;
                this._currentGame!.drawn = 0;
                this._currentGame!.playedCards = [];
                this._currentGame!.playedCards.push(this._currentGame!.deck.cards[this._currentGame!.drawn++]);
            }

            this._currentGame!.hands.get(player)!.push(this._currentGame!.deck.cards[this._currentGame!.drawn++]);
        }

        console.log("this._curre", "=", this._currentGame.wantedAction);
        let n = this.drawInfo.get(this._currentGame.wantedAction)!.count;
        console.log(player, "draws", n);
        while (n--) {
            impl_draw();
        }

        // After someone draws, the next person will (but keep color change)
        if (
            this._currentGame.wantedAction !== ActionType.PlaySrdce &&
            this._currentGame.wantedAction !== ActionType.PlayKule &&
            this._currentGame.wantedAction !== ActionType.PlayListy &&
            this._currentGame.wantedAction !== ActionType.PlayZaludy
        ) {
            this._currentGame.wantedAction = ActionType.Play;
        }
        this.nextPlayer();
    }

    private readonly drawInfo = new Map([
        [ActionType.PlayZaludy, {next: ActionType.PlayZaludy, count: 1}],
        [ActionType.PlayListy, {next: ActionType.PlayListy, count: 1}],
        [ActionType.PlayKule, {next: ActionType.PlayKule, count: 1}],
        [ActionType.PlaySrdce, {next: ActionType.PlaySrdce, count: 1}],
        [ActionType.Play, {next: ActionType.DrawTwo, count: 1}],
        [ActionType.DrawTwo, {next: ActionType.DrawFour, count: 2}],
        [ActionType.DrawFour, {next: ActionType.DrawSix, count: 4}],
        [ActionType.DrawSix, {next: ActionType.DrawEight, count: 6}],
        [ActionType.DrawEight, {next: ActionType.DrawEight, count: 8}]
    ]);

    private changeActionToColor(action: ActionType): Color {
        switch (action) {
            case ActionType.PlaySrdce: return Color.Srdce;
            case ActionType.PlayListy: return Color.Listy;
            case ActionType.PlayKule: return Color.Kule;
            case ActionType.PlayZaludy: return Color.Zaludy;
        }

        throw new Error("Internal error.");
    }

    private changeColorToAction(color: Color): ActionType {
        switch (color) {
            case Color.Srdce: return ActionType.PlaySrdce;
            case Color.Listy: return ActionType.PlayListy;
            case Color.Kule: return ActionType.PlayKule;
            case Color.Zaludy: return ActionType.PlayZaludy;
        }
    }

    private concludeGame() {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }

        this._currentGame.gameState = "ended";
        const winner = this._currentGame.whoseTurn;
        const loser = this.loser();
        this._currentGame.gameResolution = new GameResolution(winner, loser);
        this._currentGame.wantedAction = ActionType.Shuffle;
        this._currentGame.whoseTurn = loser;
    }

    private playCard(player: string, details: PlayDetails) {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }

        if (!this.playerHasCard(player, details.card)) {
            throw new Error("User wanted to play a card he doesn't have.");
        }

        if (!compatibleCards(details.card, this._currentGame.playedCards[this._currentGame.playedCards.length - 1])) {
            this._currentGame.status = Status.CardMismatch;
            return;
        }

        this._currentGame.playedCards.push(details.card);

        const updatedHand = this._currentGame.hands.get(player)!.filter((x) => !sameCards(details.card, x));
        this._currentGame.hands.set(player, updatedHand);
        console.log(player, "plays", details.card.toString());

        if (updatedHand.length === 0) {
            this.concludeGame();
            return;
        }

        if (details.card.value === Value.Sedmicka) {
            this._currentGame.wantedAction = this.drawInfo.get(this._currentGame.wantedAction)!.next;
        }

        if (details.card.value === Value.Eso) {
            this._currentGame.wantedAction = ActionType.SkipTurn;
        }

        if (details.card.value === Value.Svrsek) {
            if (typeof details.colorChange === "undefined") {
                throw new Error("Internal error.");
            }
            console.log(player, "changes to", details.colorChange);
            this._currentGame.wantedAction = this.changeColorToAction(details.colorChange);
        }

        this.nextPlayer();
    }

    private playerHasCard(player: string, cardToCheck: Card): boolean {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }
        if (!this._currentGame.hands.has(player)) {
            throw new Error("Internal error.");
        }
        return this._currentGame.hands.get(player)!.some(sameCards.bind(null, cardToCheck));
    }

    private loser(): string {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }

        if (this._currentGame.gameState !== "ended") {
            throw new Error("No loser yet.");
        }

        let mostCards: number = 0;
        for (const [, cards] of this._currentGame.hands) {
            if (cards.length > mostCards) {
                mostCards = cards.length;
            }
        }

        let losers = [];

        for (const [player, cards] of this._currentGame.hands) {
            if (cards.length === mostCards) {
                losers.push(player);
            }
        }

        return losers[Math.floor(Math.random() * losers.length)];
    }

    public newGame(): void {
        if (typeof this._currentGame !== "undefined") {
            this._history.push(this._currentGame);
        }
        this._currentGame = this.newState();
        this.dealCards();
    }

    private dealCards(): void {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }

        this._players.forEach((player) => {
            this._currentGame!.hands.set(player, this._currentGame!.deck.cards.slice(this._currentGame!.drawn, this._currentGame!.drawn + 4));
            this._currentGame!.drawn += 4;
        });

        this._currentGame.playedCards.push(this._currentGame.deck.cards[this._currentGame.drawn++]);
    }

    private getRandomPlayer(): string {
        return this._players[Math.floor(Math.random() *  this._players.length)];
    }

    private newState(shuffler?: string): State {
        if (typeof shuffler === "undefined") {
            return new State(this.getRandomPlayer());
        }

        let firstTurnPlayerIndex = this._players.indexOf(shuffler) + 1;
        if (firstTurnPlayerIndex === this._players.length) {
            firstTurnPlayerIndex = 0;
        }

        return new State(this._players[firstTurnPlayerIndex]);
    }

    public registerPlayer(name: string): void {
        if (this._players.some((player) => player == name)) {
            throw new Error("Player already exists.");
        }
        this._players.push(name);
    }

    public unregisterPlayer(name: string): void {
        this._players = this._players.filter((player) => player !== name);
    }

    public players(): string[] {
        return this._players.slice(0);
    }

    public state(): State | undefined {
        return this._currentGame;
    }
}

export default Prsi;
