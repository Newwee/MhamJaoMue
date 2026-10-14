import { Card, Suit, Rank } from '../../src/types/common';
import { PokerGameState, PokerPlayer, PokerActionType, PokerWinner } from '../../src/types/poker';
import { calculatePots, distributePots, PlayerPotInfo } from './potCalculator';
import { evaluate7Cards } from './handEvaluator';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export class PokerEngine {
  public state: PokerGameState;
  private deck: Card[] = [];
  private onStateChange?: (state: PokerGameState) => void;
  private turnTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private nextHandTimer: ReturnType<typeof setTimeout> | null = null;
  public readonly turnDurationMs: number = 20000;

  constructor(
    players: PokerPlayer[],
    smallBlind = 20,
    bigBlind = 40,
    onStateChange?: (state: PokerGameState) => void
  ) {
    this.onStateChange = onStateChange;
    this.state = {
      phase: 'waiting',
      communityCards: [],
      pots: [],
      currentBet: 0,
      minRaise: bigBlind,
      turnPlayerId: null,
      turnDeadline: null,
      dealerIndex: 0,
      smallBlind,
      bigBlind,
      players: players.map((p, idx) => ({
        ...p,
        seatIndex: idx,
        pocketCards: [],
        bet: 0,
        totalBetInHand: 0,
        folded: false,
        isAllIn: false,
        hasActed: false,
        wonAmount: 0,
      })),
      actionLog: [],
      winners: [],
      handNumber: 0,
    };
  }

  public setPlayers(players: PokerPlayer[]): void {
    const existingMap = new Map(this.state.players.map((p) => [p.id, p]));
    this.state.players = players.map((p, idx) => {
      const existing = existingMap.get(p.id);
      return {
        ...p,
        seatIndex: idx,
        pocketCards: existing?.pocketCards || [],
        bet: existing?.bet || 0,
        totalBetInHand: existing?.totalBetInHand || 0,
        folded: existing?.folded ?? false,
        isAllIn: existing?.isAllIn ?? false,
        hasActed: existing?.hasActed ?? false,
        wonAmount: existing?.wonAmount || 0,
        handRankDescription: existing?.handRankDescription,
      };
    });
  }

  private emitState(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  public getState(): PokerGameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  private shuffleNewDeck(): void {
    const cards: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ suit, rank });
      }
    }
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    this.deck = cards;
  }

  public startHand(): boolean {
    this.clearTimers();
    const eligiblePlayers = this.state.players.filter((p) => p.chips > 0);
    if (eligiblePlayers.length < 2) {
      this.state.phase = 'waiting';
      this.state.turnPlayerId = null;
      this.state.turnDeadline = null;
      this.emitState();
      return false;
    }

    this.state.handNumber += 1;
    this.shuffleNewDeck();
    this.state.communityCards = [];
    this.state.winners = [];
    this.state.actionLog = [`--- Hand #${this.state.handNumber} Started ---`];

    for (const p of this.state.players) {
      p.pocketCards = [];
      p.bet = 0;
      p.totalBetInHand = 0;
      p.folded = p.chips <= 0;
      p.isAllIn = false;
      p.hasActed = false;
      p.wonAmount = 0;
      delete p.handRankDescription;
    }

    this.state.dealerIndex = this.findNextSeatWithChips(this.state.dealerIndex);

    const activeCount = eligiblePlayers.length;
    let sbIndex: number;
    let bbIndex: number;

    if (activeCount === 2) {
      sbIndex = this.state.dealerIndex;
      bbIndex = this.findNextSeatWithChips(sbIndex);
    } else {
      sbIndex = this.findNextSeatWithChips(this.state.dealerIndex);
      bbIndex = this.findNextSeatWithChips(sbIndex);
    }

    const sbPlayer = this.state.players[sbIndex];
    const sbAmount = Math.min(sbPlayer.chips, this.state.smallBlind);
    sbPlayer.chips -= sbAmount;
    sbPlayer.bet = sbAmount;
    sbPlayer.totalBetInHand = sbAmount;
    if (sbPlayer.chips === 0) sbPlayer.isAllIn = true;
    this.state.actionLog.push(`${sbPlayer.name} posts Small Blind $${sbAmount}`);

    const bbPlayer = this.state.players[bbIndex];
    const bbAmount = Math.min(bbPlayer.chips, this.state.bigBlind);
    bbPlayer.chips -= bbAmount;
    bbPlayer.bet = bbAmount;
    bbPlayer.totalBetInHand = bbAmount;
    if (bbPlayer.chips === 0) bbPlayer.isAllIn = true;
    this.state.actionLog.push(`${bbPlayer.name} posts Big Blind $${bbAmount}`);

    this.state.currentBet = Math.max(sbAmount, bbAmount);
    this.state.minRaise = this.state.bigBlind;

    for (let c = 0; c < 2; c++) {
      for (const p of this.state.players) {
        if (!p.folded) {
          p.pocketCards.push(this.deck.pop()!);
        }
      }
    }

    this.state.phase = 'preflop';
    this.updatePots();

    let firstToActIndex: number;
    if (activeCount === 2) {
      firstToActIndex = sbIndex;
    } else {
      firstToActIndex = this.findNextSeatWithChips(bbIndex);
    }

    this.setTurnPlayer(this.state.players[firstToActIndex].id);
    return true;
  }

  private findNextSeatWithChips(startIndex: number): number {
    const total = this.state.players.length;
    for (let i = 1; i <= total; i++) {
      const idx = (startIndex + i) % total;
      if (this.state.players[idx].chips > 0 && !this.state.players[idx].folded) {
        return idx;
      }
    }
    return startIndex;
  }

  private setTurnPlayer(playerId: string | null): void {
    this.clearTurnTimeout();
    this.state.turnPlayerId = playerId;
    if (playerId) {
      this.state.turnDeadline = Date.now() + this.turnDurationMs;
      this.turnTimeoutTimer = setTimeout(() => {
        this.handleTimeout();
      }, this.turnDurationMs);
    } else {
      this.state.turnDeadline = null;
    }
    this.emitState();
  }

  private clearTurnTimeout(): void {
    if (this.turnTimeoutTimer) {
      clearTimeout(this.turnTimeoutTimer);
      this.turnTimeoutTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearTurnTimeout();
    if (this.nextHandTimer) {
      clearTimeout(this.nextHandTimer);
      this.nextHandTimer = null;
    }
  }

  private handleTimeout(): void {
    if (!this.state.turnPlayerId) return;
    const player = this.state.players.find((p) => p.id === this.state.turnPlayerId);
    if (!player) return;

    if (player.bet === this.state.currentBet) {
      this.handleAction(player.id, 'check');
    } else {
      this.handleAction(player.id, 'fold');
    }
  }

  public handleAction(playerId: string, action: PokerActionType, amount?: number): boolean {
    if (this.state.phase === 'waiting' || this.state.phase === 'ended' || this.state.phase === 'showdown') {
      return false;
    }
    if (this.state.turnPlayerId !== playerId) {
      return false;
    }

    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || player.folded || player.isAllIn) {
      return false;
    }

    const toCall = this.state.currentBet - player.bet;

    switch (action) {
      case 'fold': {
        player.folded = true;
        player.hasActed = true;
        this.state.actionLog.push(`${player.name} folds`);
        break;
      }

      case 'check': {
        if (toCall > 0) return false;
        player.hasActed = true;
        this.state.actionLog.push(`${player.name} checks`);
        break;
      }

      case 'call': {
        if (toCall <= 0) return false;
        const callAmount = Math.min(player.chips, toCall);
        player.chips -= callAmount;
        player.bet += callAmount;
        player.totalBetInHand += callAmount;
        player.hasActed = true;
        if (player.chips === 0) {
          player.isAllIn = true;
          this.state.actionLog.push(`${player.name} calls $${callAmount} (All-in)`);
        } else {
          this.state.actionLog.push(`${player.name} calls $${callAmount}`);
        }
        break;
      }

      case 'bet': {
        if (this.state.currentBet > 0) return false;
        const betAmount = Math.max(this.state.bigBlind, amount || this.state.bigBlind);
        if (betAmount > player.chips) return false;
        player.chips -= betAmount;
        player.bet += betAmount;
        player.totalBetInHand += betAmount;
        player.hasActed = true;
        this.state.currentBet = betAmount;
        this.state.minRaise = betAmount;
        this.resetOtherPlayersActed(player.id);
        if (player.chips === 0) {
          player.isAllIn = true;
          this.state.actionLog.push(`${player.name} bets $${betAmount} (All-in)`);
        } else {
          this.state.actionLog.push(`${player.name} bets $${betAmount}`);
        }
        break;
      }

      case 'raise': {
        const targetBet = amount || this.state.currentBet + this.state.minRaise;
        const addedChips = targetBet - player.bet;
        if (addedChips <= 0 || addedChips > player.chips) return false;
        const raiseDiff = targetBet - this.state.currentBet;
        if (raiseDiff < this.state.minRaise && addedChips < player.chips) {
          return false;
        }
        player.chips -= addedChips;
        player.bet = targetBet;
        player.totalBetInHand += addedChips;
        player.hasActed = true;
        if (raiseDiff >= this.state.minRaise) {
          this.state.minRaise = raiseDiff;
        }
        this.state.currentBet = targetBet;
        this.resetOtherPlayersActed(player.id);
        if (player.chips === 0) {
          player.isAllIn = true;
          this.state.actionLog.push(`${player.name} raises to $${targetBet} (All-in)`);
        } else {
          this.state.actionLog.push(`${player.name} raises to $${targetBet}`);
        }
        break;
      }

      case 'allin': {
        const allInBet = player.bet + player.chips;
        const chipsToBet = player.chips;
        player.chips = 0;
        player.bet = allInBet;
        player.totalBetInHand += chipsToBet;
        player.isAllIn = true;
        player.hasActed = true;
        if (allInBet > this.state.currentBet) {
          const raiseDiff = allInBet - this.state.currentBet;
          if (raiseDiff >= this.state.minRaise) {
            this.state.minRaise = raiseDiff;
          }
          this.state.currentBet = allInBet;
          this.resetOtherPlayersActed(player.id);
        }
        this.state.actionLog.push(`${player.name} goes All-in with $${allInBet}`);
        break;
      }

      default:
        return false;
    }

    this.updatePots();
    this.progressGame();
    return true;
  }

  private resetOtherPlayersActed(excludeId: string): void {
    for (const p of this.state.players) {
      if (p.id !== excludeId && !p.folded && !p.isAllIn) {
        p.hasActed = false;
      }
    }
  }

  private updatePots(): void {
    const potInput: PlayerPotInfo[] = this.state.players.map((p) => ({
      id: p.id,
      name: p.name,
      totalBetInHand: p.totalBetInHand,
      folded: p.folded,
      isAllIn: p.isAllIn,
      pocketCards: p.pocketCards,
      seatIndex: p.seatIndex,
    }));
    const { pots, uncalledRefunds } = calculatePots(potInput);
    this.state.pots = pots;
    for (const [pId, refund] of Object.entries(uncalledRefunds)) {
      const p = this.state.players.find((pl) => pl.id === pId);
      if (p) {
        p.chips += refund;
        p.totalBetInHand -= refund;
        p.bet = Math.max(0, p.bet - refund);
      }
    }
  }

  private progressGame(): void {
    const nonFolded = this.state.players.filter((p) => !p.folded);
    if (nonFolded.length === 1) {
      this.awardLastPlayer(nonFolded[0]);
      return;
    }

    const roundFinished = this.isBettingRoundFinished();
    if (roundFinished) {
      this.advancePhase();
    } else {
      this.advanceTurn();
    }
  }

  private isBettingRoundFinished(): boolean {
    const activeNonAllin = this.state.players.filter((p) => !p.folded && !p.isAllIn);
    if (activeNonAllin.length === 0) {
      return true;
    }
    if (activeNonAllin.length === 1) {
      const single = activeNonAllin[0];
      const isMatched = single.bet === this.state.currentBet && single.hasActed;
      if (isMatched) return true;
    }
    return activeNonAllin.every((p) => p.hasActed && p.bet === this.state.currentBet);
  }

  private advanceTurn(): void {
    const currentIdx = this.state.players.findIndex((p) => p.id === this.state.turnPlayerId);
    const total = this.state.players.length;

    for (let i = 1; i <= total; i++) {
      const nextIdx = (currentIdx + i) % total;
      const candidate = this.state.players[nextIdx];
      if (!candidate.folded && !candidate.isAllIn) {
        this.setTurnPlayer(candidate.id);
        return;
      }
    }

    this.advancePhase();
  }

  private advancePhase(): void {
    this.clearTurnTimeout();
    for (const p of this.state.players) {
      p.bet = 0;
      p.hasActed = false;
    }
    this.state.currentBet = 0;
    this.state.minRaise = this.state.bigBlind;

    const canAnyPlayerAct = this.state.players.filter((p) => !p.folded && !p.isAllIn).length > 1;

    switch (this.state.phase) {
      case 'preflop': {
        this.state.phase = 'flop';
        this.deck.pop();
        this.state.communityCards.push(this.deck.pop()!, this.deck.pop()!, this.deck.pop()!);
        this.state.actionLog.push(`Flop dealt: ${this.cardsToString(this.state.communityCards)}`);
        break;
      }
      case 'flop': {
        this.state.phase = 'turn';
        this.deck.pop();
        this.state.communityCards.push(this.deck.pop()!);
        this.state.actionLog.push(`Turn dealt: ${this.state.communityCards[3].rank}${this.state.communityCards[3].suit}`);
        break;
      }
      case 'turn': {
        this.state.phase = 'river';
        this.deck.pop();
        this.state.communityCards.push(this.deck.pop()!);
        this.state.actionLog.push(`River dealt: ${this.state.communityCards[4].rank}${this.state.communityCards[4].suit}`);
        break;
      }
      case 'river': {
        this.showdown();
        return;
      }
      default:
        return;
    }

    if (!canAnyPlayerAct) {
      this.advancePhase();
      return;
    }

    const firstIndex = this.findNextSeatToAct(this.state.dealerIndex);
    if (firstIndex !== -1) {
      this.setTurnPlayer(this.state.players[firstIndex].id);
    } else {
      this.advancePhase();
    }
  }

  private findNextSeatToAct(startIndex: number): number {
    const total = this.state.players.length;
    for (let i = 1; i <= total; i++) {
      const idx = (startIndex + i) % total;
      const p = this.state.players[idx];
      if (!p.folded && !p.isAllIn) {
        return idx;
      }
    }
    return -1;
  }

  private showdown(): void {
    this.clearTurnTimeout();
    this.state.phase = 'showdown';
    this.updatePots();

    for (const p of this.state.players) {
      if (!p.folded && p.pocketCards.length === 2) {
        const evalHand = evaluate7Cards([...p.pocketCards, ...this.state.communityCards]);
        p.handRankDescription = evalHand.name;
      }
    }

    const potInput: PlayerPotInfo[] = this.state.players.map((p) => ({
      id: p.id,
      name: p.name,
      totalBetInHand: p.totalBetInHand,
      folded: p.folded,
      isAllIn: p.isAllIn,
      pocketCards: p.pocketCards,
      seatIndex: p.seatIndex,
    }));

    const { winners, chipCredits } = distributePots(this.state.pots, potInput, this.state.communityCards);
    this.state.winners = winners;

    for (const [pId, amount] of Object.entries(chipCredits)) {
      const p = this.state.players.find((pl) => pl.id === pId);
      if (p) {
        p.chips += amount;
        p.wonAmount = amount;
      }
    }

    for (const w of winners) {
      this.state.actionLog.push(`${w.name} wins $${w.amount} with ${w.handDescription}`);
    }

    this.finishHand();
  }

  private awardLastPlayer(winner: PokerPlayer): void {
    this.clearTurnTimeout();
    this.state.phase = 'ended';
    this.updatePots();

    let totalPot = 0;
    for (const pot of this.state.pots) {
      totalPot += pot.amount;
    }

    winner.chips += totalPot;
    winner.wonAmount = totalPot;

    this.state.winners = [
      {
        playerId: winner.id,
        name: winner.name,
        amount: totalPot,
        potIndex: 0,
        handDescription: 'All opponents folded',
      },
    ];

    this.state.actionLog.push(`${winner.name} wins $${totalPot} (Everyone folded)`);
    this.finishHand();
  }

  private finishHand(): void {
    this.state.phase = 'ended';
    this.state.turnPlayerId = null;
    this.state.turnDeadline = null;
    this.emitState();
  }

  private cardsToString(cards: Card[]): string {
    return cards.map((c) => `${c.rank}${c.suit}`).join(' ');
  }
}
