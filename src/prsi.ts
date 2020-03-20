enum Color {
    Zaludy,
    Srdce,
    Listy,
    Kule
}

enum Value {
    Sedmicka,
    Osmicka,
    Devitka,
    Desitka,
    Spodek,
    Svrsek,
    Kral,
    Eso

}

class Card {
    public color: Color;
    public value: Value;
    constructor(color: Color, value: Value) {
        this.color = color;
        this.value = value;
    }
}

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
    private cards: Card[] = sortedDeck.slice(0);

    public shuffle(): void {
        let unshuffledLen = this.cards.length;
        while (unshuffledLen !== 0) {
            const randomCard = Math.floor(Math.random() * unshuffledLen);
            [this.cards[randomCard], this.cards[unshuffledLen - 1]] = [this.cards[unshuffledLen - 1], this.cards[randomCard]];
            --unshuffledLen;
        }
    }

    public printDeck(): void {
        console.log(this.cards);
    }
}

class Player {
    public name: string;
    constructor(name: string) {
        this.name = name;
    }
}

enum ActionType {
    Shuffle,
    Play
}

class WantedAction {
    actionType: ActionType;
    who?: string;
    constructor(action: ActionType, who?: string) {
        this.actionType = action;
        this.who = who;
    }
}

class State {
    deck: Deck = new Deck();
    playedCards: Card[] = [];
    drawn: number = 0;
    hands: Map<Player, Card[]> = new Map();
    whoseTurn: Player;
    gameState: "active" | "ended" = "active";

    constructor(whoStarts: Player) {
        this.whoseTurn = whoStarts;
    }

    public winner(): string {
        if (this.gameState !== "ended") {
            throw new Error("No winner yet.");
        }

        for (const [player, cards] of this.hands) {
            if (cards.length === 0) {
                return player.name;
            }
        }
        throw new Error("Internal error.");
    }

    public loser(): string {
        if (this.gameState !== "ended") {
            throw new Error("No loser yet.");
        }

        let mostCards: number = 0;
        for (const [, cards] of this.hands) {
            if (cards.length > mostCards) {
                mostCards = cards.length;
            }
        }

        let losers = [];

        for (const [player, cards] of this.hands) {
            if (cards.length === mostCards) {
                losers.push(player);
            }
        }

        return losers[Math.floor(Math.random() * losers.length)].name;
    }
}

class GameResolution {
    winner: string;
    loser: string;
    constructor(winner: string, loser: string) {
        this.winner = winner;
        this.loser = loser;
    }
}

class PrsiInstruction {
    wantedAction: WantedAction;
    gameResolution?: GameResolution;
    constructor(wantedAction: WantedAction, gameResolution?: GameResolution) {
        this.wantedAction = wantedAction;
        this.gameResolution = gameResolution;
    }
}

class Prsi {
    private _players: Player[] = [];
    private _history: State[] = [];
    private _currentGame?: State;

    public newGame(): void {
        this._currentGame = this.newState();
    }

    private newState(shuffler?: string): State {
        if (typeof shuffler === "undefined") {
            return new State(this.getRandomPlayer());
        }

        let firstTurnPlayerIndex = this._players.indexOf(new Player(shuffler)) + 1;
        if (firstTurnPlayerIndex === this._players.length) {
            firstTurnPlayerIndex = 0;
        }

        return new State(this._players[firstTurnPlayerIndex]);
    }

    public printDeck(): void {
        if (typeof this._currentGame === "undefined") {
            console.log("Game is not running");
            return;
        }
        this._currentGame.deck.printDeck();
    }

    public registerPlayer(name: string): void {
        if (this._players.some((player) => player.name == name)) {
            throw new Error("Player already exists.");
        }
        this._players.push(new Player(name));
    }

    public unregisterPlayer(name: string): void {
        this._players = this._players.filter((player) => player.name !== name);
    }

    public players(): Player[] {
        return this._players.slice(0);
    }

    private getRandomPlayer(): Player {
        return this._players[Math.floor(Math.random() *  this._players.length)];
    }

    instruction(): PrsiInstruction {
        if (typeof this._currentGame === "undefined") {
            return new PrsiInstruction(
                new WantedAction(ActionType.Shuffle));
        }

        if (this._currentGame.gameState !== "active") {
            const loser = this._history[this._history.length - 1].loser();
            const winner = this._history[this._history.length - 1].winner();
            return new PrsiInstruction(
                new WantedAction(ActionType.Shuffle, loser),
                new GameResolution(winner, loser));
        }

        return new PrsiInstruction(
            new WantedAction(ActionType.Play, this._currentGame.whoseTurn.name));

    }
}

export default Prsi;
