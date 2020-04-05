import {ActionType, Color, Card, PlayType, PlayDetails, Status, Value, PlayerAction, LastPlay, LastAction, Place} from "./types"

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

class PlayerState {
    name: string;
    place: null | Place = null;
    canBeReturned: boolean = false;
    constructor(name: string) {
        this.name = name;
    }
}

const sameCards = (a: Card, b: Card) => a.color === b.color && a.value === b.value;

const compatibleCards = (a: Card, b: Card) => a.color === b.color || a.value === b.value;

class State {
    public deck: Deck = new Deck();
    public playedCards: Card[] = [];
    public drawn: number = 0;
    public hands: Map<string, Card[]> = new Map();
    public whoseTurn: string;
    public players: PlayerState[];
    public nextPlace: Place = Place.First;
    public gameState: "active" | "ended" = "active";
    public wantedAction: ActionType = ActionType.Play;
    public status: Status = Status.Ok;
    public lastPlay?: LastPlay;

    constructor(players: string[], whoStarts: string) {
        this.players = players.map((name) => new PlayerState(name));
        this.whoseTurn = whoStarts;
    }

    public printHands(): void {
        this.hands.forEach((cards, player) => {
            console.log(`'${player}' => [${cards.map((card) => card.toString()).join(", ")}]`);
        });
    }
}

export class Prsi {
    private _players: string[] = [];
    private _history: State[] = [];
    private _currentGame?: State;

    public resolveAction(playerAction: PlayerAction): void {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game hasn't started.");
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
                this._currentGame.lastPlay = {
                    who: playerAction.who,
                    playDetails: playerAction.playDetails,
                    playerAction: LastAction.SkipTurn,
                    didWin: false
                }
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

        // After someone skips, the next person will definitely play
        this._currentGame.wantedAction = ActionType.Play;
        this.nextPlayer();
    }

    private nextPlayer(): void {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }

        if (this._currentGame.players.filter((player) => player.place === null).length === 1) {
            this.concludeGame();
            return;
        }

        let curPlayer = this._currentGame.players.findIndex((playerState) => playerState.name === this._currentGame!.whoseTurn);
        do {
            curPlayer++;
            if (curPlayer === this._currentGame.players.length) {
                curPlayer = 0;
            }
        } while (this._currentGame.players[curPlayer].place !== null);

        this._currentGame.whoseTurn = this._currentGame.players[curPlayer].name;

    }

    private drawCard(player: string): void {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }

        if (!this._currentGame.hands.has(player)) {
            throw new Error("User tried to play a card he doesn't have.");
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

        const n = this.drawInfo.get(this._currentGame.wantedAction)!.count;
        Array.from({length: n}).forEach(impl_draw);

        this._currentGame.lastPlay = {
            who: player,
            didWin: false,
            playerAction: (() => {
                switch (n) {
                case 1:
                    return LastAction.Draw;
                case 2:
                    return LastAction.DrawTwo;
                case 4:
                    return LastAction.DrawFour;
                case 6:
                    return LastAction.DrawSix;
                case 8:
                    return LastAction.DrawEight;
                }})()
        };

        // After someone draws, the next person will surely play (but keep color change)
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

    private readonly drawInfo = new Map<ActionType, {next: ActionType, count: 1|2|4|6|8}>([
        [ActionType.PlayZaludy, {next: ActionType.DrawTwo, count: 1}],
        [ActionType.PlayListy, {next: ActionType.DrawTwo, count: 1}],
        [ActionType.PlayKule, {next: ActionType.DrawTwo, count: 1}],
        [ActionType.PlaySrdce, {next: ActionType.DrawTwo, count: 1}],
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
        const loser = this._currentGame.players.findIndex((player) => player.place === null);
        this._currentGame.players[loser].place = this.nextPlace();
        this._currentGame.wantedAction = ActionType.Shuffle;
        this._currentGame.whoseTurn = this._currentGame.players[loser].name;
    }

    private resolveChangeCard(color: Color): boolean {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }
        // try here, because the helper function only works on Play* actions
        try {
            if (color === this.changeActionToColor(this._currentGame.wantedAction)) {
                return true;
            }
        } catch {}
        return false;
    }

    private canBePlayed(card: Card) {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }

        if (card.value === Value.Svrsek) {
            return true;
        }

        switch (this._currentGame.wantedAction) {
        case ActionType.PlayZaludy:
        case ActionType.PlayKule:
        case ActionType.PlayListy:
        case ActionType.PlaySrdce:
            return this.resolveChangeCard(card.color);
        }

        return compatibleCards(card, this._currentGame.playedCards[this._currentGame.playedCards.length - 1]);
    }

    private nextPlace(): Place {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }

        const res = this._currentGame.nextPlace;

        this._currentGame.nextPlace = ((): Place => {
            switch (this._currentGame!.nextPlace) {
                case Place.First:
                    return Place.Second;
                case Place.Second:
                    return Place.Third;
                case Place.Third:
                    return Place.Fourth;
                case Place.Fourth:
                    return Place.Fifth;
                case Place.Fifth:
                    return Place.Sixth;
                default:
                    return Place.Sixth;
            }
        })();

        return res;
    }

    private playCard(who: string, details: PlayDetails) {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }

        if (!this.playerHasCard(who, details.card)) {
            throw new Error("User wanted to play a card he doesn't have.");
        }

        if (!this.canBePlayed(details.card)) {
            this._currentGame.status = Status.CardMismatch;
            return;
        }

        this._currentGame.playedCards.push(details.card);

        const updatedHand = this._currentGame.hands.get(who)!.filter((x) => !sameCards(details.card, x));
        this._currentGame.hands.set(who, updatedHand);

        let lastAction: LastAction;
        if (details.card.value === Value.Sedmicka) {
            this._currentGame.wantedAction = this.drawInfo.get(this._currentGame.wantedAction)!.next;
            lastAction = LastAction.Play;
        } else if (details.card.value === Value.Eso) {
            this._currentGame.wantedAction = ActionType.SkipTurn;
            lastAction = LastAction.Play;
        } else if (details.card.value === Value.Svrsek) {
            if (typeof details.colorChange === "undefined") {
                throw new Error("User didn't specify which color he wants.");
            }
            this._currentGame.wantedAction = this.changeColorToAction(details.colorChange);
            lastAction = LastAction.Change;
        } else {
            this._currentGame.wantedAction = ActionType.Play;
            lastAction = LastAction.Play;
        }

        if (updatedHand.length === 0) {
            this._currentGame.players.find((player) => player.name === who)!.place = this.nextPlace();
        }

        this._currentGame.lastPlay = {
            who: who,
            playerAction: lastAction,
            playDetails: details,
            didWin: updatedHand.length === 0
        }

        this.nextPlayer();
    }

    private playerHasCard(player: string, cardToCheck: Card): boolean {
        if (typeof this._currentGame === "undefined") {
            throw new Error("Game isn't running.");
        }
        if (!this._currentGame.hands.has(player)) {
            throw new Error("playerHasCard: User doesn' exist.");
        }
        return this._currentGame.hands.get(player)!.some(sameCards.bind(null, cardToCheck));
    }

    public newGame(): void {
        if (this._players.length < 2) {
            throw new Error("Tried to start a game with one player.");
        }
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
        switch (this._currentGame.playedCards[0].value) {
        case Value.Eso:
            this._currentGame.wantedAction = ActionType.SkipTurn;
            break;
        case Value.Sedmicka:
            this._currentGame.wantedAction = ActionType.DrawTwo;
            break;
        }
    }

    private getRandomPlayer(): string {
        return this._players[Math.floor(Math.random() *  this._players.length)];
    }

    private newState(shuffler?: string): State {
        if (typeof shuffler === "undefined") {
            return new State([...this._players], this.getRandomPlayer());
        }

        let firstTurnPlayerIndex = this._players.indexOf(shuffler) + 1;
        if (firstTurnPlayerIndex === this._players.length) {
            firstTurnPlayerIndex = 0;
        }

        return new State([...this._players], this._players[firstTurnPlayerIndex]);
    }

    public registerPlayer(name: string): void {
        if (this._players.some((player) => player == name)) {
            throw new Error("Player already exists.");
        }
        this._players.push(name);
    }

    public unregisterPlayer(name: string): void {
        this._players = this._players.filter((player) => player !== name);

        if (typeof this._currentGame === "undefined") {
            return;
        }

        // If a player disconnected during a game
        if (this._currentGame.whoseTurn === name) {
            this._currentGame.lastPlay = {
                didWin: false,
                playerAction: LastAction.Disconnect,
                who: name,
            }
            this.nextPlayer();
        }
        this._currentGame.players = this._currentGame.players.filter((player) => player.name !== name);
        // Just end the game if there is just one player.
        if (this._currentGame.players.length < 2) {
            this._currentGame = undefined;
            return;
        }
        const hand = this._currentGame.hands.get(name);
        hand?.forEach((card) => this._currentGame!.deck.cards.push(card));
        this._currentGame.hands.delete(name);
    }

    public players(): string[] {
        return this._players.slice(0);
    }

    public state(): State | undefined {
        return this._currentGame;
    }
}

export default Prsi;
