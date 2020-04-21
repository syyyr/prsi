import {ActionType, Color, Card, PlayType, PlayDetails, Status, Value, PlayerAction, LastPlay, LastAction, Place, changeActionToColor, sameCards} from "../common/types";

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

const compatibleCards = (a: Card, b: Card) => a.color === b.color || a.value === b.value;

class State {
    public deck: Deck = new Deck();
    public playedCards: Card[] = [];
    public drawn: number = 0;
    public hands: Map<string, Card[]> = new Map();
    public whoseTurn: string;
    public players: PlayerState[];
    public nextPlace: Place = Place.First;
    public wantedAction: ActionType = ActionType.Play;
    public lastAction: ActionType = ActionType.Play;
    public lastPlay?: LastPlay;
    public loser?: string;

    constructor(players: PlayerState[], whoStarts: string) {
        this.players = players;
        this.whoseTurn = whoStarts;
    }

    public printHands(): void {
        this.hands.forEach((cards, player) => {
            console.log(`'${player}' => [${cards.map((card) => card.toString()).join(", ")}]`);
        });
    }
}

export default class Prsi {
    private players: string[] = [];
    private currentGame?: State;

    public resolveAction(playerAction: PlayerAction): Status {
        if (typeof this.currentGame === "undefined") {
            throw new Error("resolveAction: Game hasn't started.");
        }

        if (playerAction.who !== this.currentGame.whoseTurn) {
            return Status.PlayerMismatch;
        }

        switch (this.currentGame.wantedAction) {
        case ActionType.Play:
            switch (playerAction.action) {
            case PlayType.Play:
                if (typeof playerAction.playDetails === "undefined") {
                    throw new Error("resolveAction: User wanted to play, but didn't specify what.");
                }
                if (this.playCard(playerAction.who, playerAction.playDetails)) {
                    return Status.Ok;
                } else {
                    return Status.CardMismatch;
                }
            case PlayType.Draw:
                this.drawCard(playerAction.who);
                return Status.Ok;
            }

        case ActionType.Shuffle:
            switch (playerAction.action) {
            case PlayType.Play:
                if (playerAction.playDetails?.card.value === Value.Sedmicka && playerAction.playDetails.card.color === Color.Srdce) {
                    if (this.currentGame.lastAction !== ActionType.SkipTurn && this.canBePlayed(playerAction.playDetails.card)) {
                        this.currentGame.wantedAction = this.drawInfo.get(this.currentGame.lastAction)!.next;
                        if (this.playCard(playerAction.who, playerAction.playDetails)) {
                            return Status.Ok;
                        } else {
                            return Status.CardMismatch;
                        }
                    }
                }
                return Status.MustShuffle;
            case PlayType.Draw:
                this.newGame(playerAction.who);
                return Status.Ok;
            }

        case ActionType.DrawTwo:
        case ActionType.DrawFour:
        case ActionType.DrawSix:
        case ActionType.DrawEight:
            switch (playerAction.action) {
            case PlayType.Play:
                if (typeof playerAction.playDetails === "undefined") {
                    throw new Error("resolveAction: User wanted to play, but didn't specify what.");
                }
                if (playerAction.playDetails.card.value !== Value.Sedmicka) {
                    return Status.NotASeven;
                }
                if (this.playCard(playerAction.who, playerAction.playDetails)) {
                    return Status.Ok;
                } else {
                    return Status.CardMismatch;
                }
            case PlayType.Draw:
                this.drawCard(playerAction.who);
                return Status.Ok;
            }

        case ActionType.SkipTurn:
            switch (playerAction.action) {
            case PlayType.Play:
                if (typeof playerAction.playDetails === "undefined") {
                    throw new Error("resolveAction: User wanted to play, but didn't specify what.");
                }
                if (playerAction.playDetails.card.value !== Value.Eso) {
                    return Status.NotAnAce;
                }
                if (this.playCard(playerAction.who, playerAction.playDetails)) {
                    return Status.Ok;
                } else {
                    Status.CardMismatch;
                }
            case PlayType.Draw:
                this.skipTurn();
                this.currentGame.lastPlay = {
                    who: playerAction.who,
                    playDetails: playerAction.playDetails,
                    playerAction: LastAction.SkipTurn,
                    didWin: false
                };
                return Status.Ok;
            }

        case ActionType.PlayZaludy:
        case ActionType.PlayKule:
        case ActionType.PlayListy:
        case ActionType.PlaySrdce:
            switch (playerAction.action) {
            case PlayType.Play:
                if (typeof playerAction.playDetails === "undefined") {
                    throw new Error("resolveAction: User wanted to play, but didn't specify what.");
                }

                if (this.playCard(playerAction.who, playerAction.playDetails)) {
                    return Status.Ok;
                } else {
                    return Status.CardMismatch;
                }
            case PlayType.Draw:
                this.drawCard(playerAction.who);
                return Status.Ok;
            }
        }
    }

    private skipTurn(): void {
        if (typeof this.currentGame === "undefined") {
            throw new Error("skipTurn: Game isn't running.");
        }

        // After someone skips, the next person will definitely play
        this.currentGame.wantedAction = ActionType.Play;
        this.nextPlayer();
    }

    private nextPlayer(): void {
        if (typeof this.currentGame === "undefined") {
            throw new Error("nextPlayer: Game isn't running.");
        }

        if (this.currentGame.players.filter((player) => player.place === null).length === 1) {
            this.concludeGame();
            return;
        }

        let curPlayer = this.currentGame.players.findIndex((playerState) => playerState.name === this.currentGame!.whoseTurn);
        do {
            curPlayer++;
            if (curPlayer === this.currentGame.players.length) {
                curPlayer = 0;
            }
            this.currentGame.players[curPlayer].canBeReturned = false;
        } while (this.currentGame.players[curPlayer].place !== null);

        this.currentGame.whoseTurn = this.currentGame.players[curPlayer].name;

    }

    private drawCard(player: string): void {
        if (typeof this.currentGame === "undefined") {
            throw new Error("drawCard: Game isn't running.");
        }

        const impl_draw = () => {
            if (this.currentGame!.drawn === this.currentGame!.deck.cards.length) {
                this.currentGame!.deck.cards = this.currentGame!.playedCards;
                this.currentGame!.drawn = 0;
                this.currentGame!.playedCards = [];
                this.currentGame!.playedCards.push(this.currentGame!.deck.cards[this.currentGame!.drawn++]);
            }

            this.currentGame!.hands.get(player)!.push(this.currentGame!.deck.cards[this.currentGame!.drawn++]);
        };

        const n = this.drawInfo.get(this.currentGame.wantedAction)!.count;
        Array.from({length: n}).forEach(impl_draw);

        this.currentGame.lastPlay = {
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
            this.currentGame.wantedAction !== ActionType.PlaySrdce &&
            this.currentGame.wantedAction !== ActionType.PlayKule &&
            this.currentGame.wantedAction !== ActionType.PlayListy &&
            this.currentGame.wantedAction !== ActionType.PlayZaludy
        ) {
            this.currentGame.wantedAction = ActionType.Play;
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

    private changeColorToAction(color: Color): ActionType {
        switch (color) {
            case Color.Srdce: return ActionType.PlaySrdce;
            case Color.Listy: return ActionType.PlayListy;
            case Color.Kule: return ActionType.PlayKule;
            case Color.Zaludy: return ActionType.PlayZaludy;
        }
    }

    private concludeGame() {
        if (typeof this.currentGame === "undefined") {
            throw new Error("concludeGame: Game isn't running.");
        }

        const loser = this.currentGame.players.findIndex((player) => player.place === null);
        this.currentGame.loser = this.currentGame.players[loser].name;
        this.currentGame.players[loser].place = this.nextPlace();
        this.currentGame.lastAction = this.currentGame.wantedAction ;
        this.currentGame.wantedAction = ActionType.Shuffle;
        this.currentGame.whoseTurn = this.currentGame.players[loser].name;
    }

    private resolveChangeCard(color: Color): boolean {
        if (typeof this.currentGame === "undefined") {
            throw new Error("resolveChangeCard: Game isn't running.");
        }
        // try here, because the helper function only works on Play* actions
        try {
            if (color === changeActionToColor(this.currentGame.wantedAction)) {
                return true;
            }
        } catch {
            return false;
        }
        return false;
    }

    private canBePlayed(card: Card) {
        if (typeof this.currentGame === "undefined") {
            throw new Error("canBePlayed: Game isn't running.");
        }

        if (card.value === Value.Svrsek) {
            return true;
        }

        switch (this.currentGame.wantedAction) {
        case ActionType.PlayZaludy:
        case ActionType.PlayKule:
        case ActionType.PlayListy:
        case ActionType.PlaySrdce:
            return this.resolveChangeCard(card.color);
        }

        return compatibleCards(card, this.currentGame.playedCards[this.currentGame.playedCards.length - 1]);
    }

    private rollbackPlace() {
        if (typeof this.currentGame === "undefined") {
            throw new Error("rollbackPlace: Game isn't running.");
        }

        switch (this.currentGame.nextPlace) {
        case Place.Second:
            this.currentGame.nextPlace = Place.First;
        case Place.Third:
            this.currentGame.nextPlace = Place.Second;
        case Place.Fourth:
            this.currentGame.nextPlace = Place.Third;
        case Place.Fifth:
            this.currentGame.nextPlace = Place.Fourth;
        case Place.Sixth:
            this.currentGame.nextPlace = Place.Fifth;
        default:
            this.currentGame.nextPlace = Place.First;
        }
    }

    private nextPlace(): Place {
        if (typeof this.currentGame === "undefined") {
            throw new Error("nextPlacer: Game isn't running.");
        }

        const res = this.currentGame.nextPlace;
        this.currentGame.nextPlace++;

        return res;
    }

    private checkReturnToGame() {
        if (typeof this.currentGame === "undefined") {
            throw new Error("checkReturnTo: Game isn't running.");
        }

        const curPlayer = this.currentGame.players.findIndex((playerState) => playerState.name === this.currentGame!.whoseTurn);
        let i = curPlayer;
        do {
            i++;
            if (i === this.currentGame.players.length) {
                i = 0;
            }

            if (this.currentGame.players[i].canBeReturned) {
                return this.currentGame.players[i].name;
            }
        } while (i !== curPlayer);
    }

    private resolveReturnToGame(who: string) {
        if (typeof this.currentGame === "undefined") {
            throw new Error("resolveReturnTo: Game isn't running.");
        }
        this.currentGame.players.find((player) => player.name === this.currentGame?.whoseTurn)!.place = null;
        this.rollbackPlace();
        this.currentGame.players.find((player) => player.name === who)!.place = null;
        this.drawCard(who);
        this.currentGame.whoseTurn = who;
        this.currentGame.wantedAction = ActionType.Play;
    }

    private playCard(who: string, details: PlayDetails): boolean {
        if (typeof this.currentGame === "undefined") {
            throw new Error("playCard: Game isn't running.");
        }

        if (!this.playerHasCard(who, details.card)) {
            throw new Error("playCard: User wanted to play a card he doesn't have.");
        }

        if (!this.canBePlayed(details.card)) {
            return false;
        }

        this.currentGame.playedCards.push(details.card);

        const updatedHand = this.currentGame.hands.get(who)!.filter((x) => !sameCards(details.card, x));
        this.currentGame.hands.set(who, updatedHand);

        let lastAction: LastAction;
        const returned = this.checkReturnToGame();
        if (details.card.value === Value.Sedmicka && details.card.color === Color.Srdce && typeof returned !== "undefined") {
            this.resolveReturnToGame(returned);
            details.returned = returned;
            lastAction = LastAction.Return;
            this.currentGame.wantedAction = ActionType.Play;
        } else if (details.card.value === Value.Sedmicka) {
            this.currentGame.wantedAction = this.drawInfo.get(this.currentGame.wantedAction)!.next;
            lastAction = LastAction.Play;
        } else if (details.card.value === Value.Eso) {
            this.currentGame.wantedAction = ActionType.SkipTurn;
            lastAction = LastAction.Play;
        } else if (details.card.value === Value.Svrsek) {
            if (typeof details.colorChange === "undefined") {
                throw new Error("playCard: User didn't specify which color he wants.");
            }
            this.currentGame.wantedAction = this.changeColorToAction(details.colorChange);
            lastAction = LastAction.Change;
        } else {
            this.currentGame.wantedAction = ActionType.Play;
            lastAction = LastAction.Play;
        }

        if (updatedHand.length === 0) {
            this.currentGame.players.find((player) => player.name === who)!.place = this.nextPlace();
            this.currentGame.players.find((player) => player.name === who)!.canBeReturned = true;
        }

        this.currentGame.lastPlay = {
            who: who,
            playerAction: lastAction,
            playDetails: details,
            didWin: updatedHand.length === 0
        };

        this.nextPlayer();
        return true;
    }

    private playerHasCard(player: string, cardToCheck: Card): boolean {
        if (typeof this.currentGame === "undefined") {
            throw new Error("playerHasCard: Game isn't running.");
        }
        if (!this.currentGame.hands.has(player)) {
            throw new Error("playerHasCard: User doesn't exist.");
        }
        return this.currentGame.hands.get(player)!.some(sameCards.bind(null, cardToCheck));
    }

    public newGame(shuffler?: string): void {
        if (this.players.length < 2) {
            throw new Error("newGame: Tried to start a game with one player.");
        }

        this.currentGame = this.newState(shuffler);
        this.dealCards();
    }

    private dealCards(): void {
        if (typeof this.currentGame === "undefined") {
            throw new Error("dealCards: Game isn't running.");
        }

        this.players.forEach((player) => {
            this.currentGame!.hands.set(player, this.currentGame!.deck.cards.slice(this.currentGame!.drawn, this.currentGame!.drawn + 4));
            this.currentGame!.drawn += 4;
        });

        this.currentGame.playedCards.push(this.currentGame.deck.cards[this.currentGame.drawn++]);
        switch (this.currentGame.playedCards[0].value) {
        case Value.Eso:
            this.currentGame.wantedAction = ActionType.SkipTurn;
            break;
        case Value.Sedmicka:
            this.currentGame.wantedAction = ActionType.DrawTwo;
            break;
        case Value.Svrsek:
            this.currentGame.wantedAction = this.changeColorToAction(this.currentGame.playedCards[0].color);
            break;
        }
    }

    private getRandomPlayer(): string {
        return this.players[Math.floor(Math.random() *  this.players.length)];
    }

    private newPlayerStates(): PlayerState[] {
        return this.players.map((name) => new PlayerState(name));
    }

    private newState(shuffler?: string): State {
        if (typeof shuffler === "undefined") {
            return new State(this.newPlayerStates(), this.getRandomPlayer());
        }

        let firstTurnPlayerIndex = this.players.indexOf(shuffler) + 1;
        if (firstTurnPlayerIndex === this.players.length) {
            firstTurnPlayerIndex = 0;
        }

        return new State(this.newPlayerStates(), this.players[firstTurnPlayerIndex]);
    }

    public registerPlayer(name: string): void {
        if (this.players.some((player) => player == name)) {
            throw new Error("registerPlayer: Player already exists.");
        }
        this.players.push(name);
    }

    public unregisterPlayer(name: string): void {
        if (!this.players.some((player) => player == name)) {
            throw new Error("unregisterPlayer: Player doesn't exist.");
        }

        this.players = this.players.filter((player) => player !== name);

        if (typeof this.currentGame === "undefined") {
            return;
        }

        // If a player disconnected during a game
        if (this.currentGame.whoseTurn === name) {
            this.currentGame.lastPlay = {
                didWin: false,
                playerAction: LastAction.Disconnect,
                who: name,
            };
            this.nextPlayer();
        }
        this.currentGame.players = this.currentGame.players.filter((player) => player.name !== name);
        // Just end the game if there is just one player.
        if (this.currentGame.players.filter((player) => player.place === null).length < 2) {
            this.currentGame = undefined;
            return;
        }
        const hand = this.currentGame.hands.get(name);
        hand?.forEach((card) => this.currentGame!.deck.cards.push(card));
        this.currentGame.hands.delete(name);
    }

    public getPlayers(): string[] {
        return this.players.slice(0);
    }

    public state(): State | undefined {
        return this.currentGame;
    }
}
