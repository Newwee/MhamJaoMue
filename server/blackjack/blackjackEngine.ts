import { Card } from '../../src/types/common';
import {
  BlackjackGameState,
  BlackjackPlayer,
  BlackjackActionType,
  BlackjackHand,
} from '../../src/types/blackjack';
import {
  createDeck,
  calculateHandValue,
  isNaturalBlackjack,
  canSplitHand,
  canDoubleHand,
  shouldDealerHit,
  calculatePayout,
} from './blackjackLogic';

export class BlackjackEngine {
  public state: BlackjackGameState;
  private shoe: Card[] = [];
  private dealerHoleCard: Card | null = null;
  private onStateChange?: (state: BlackjackGameState) => void;
  private turnTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  public readonly turnDurationMs: number = 20000;

  constructor(
    players: BlackjackPlayer[],
    minBet = 25,
    maxBet = 1000,
    onStateChange?: (state: BlackjackGameState) => void
  ) {
    this.onStateChange = onStateChange;
    this.shoe = createDeck(6);
    this.state = {
      phase: 'betting',
      dealerCards: [],
      dealerScore: 0,
      players: players.map((p, idx) => ({
        ...p,
        seatIndex: idx,
        hands: [],
        currentHandIndex: 0,
        currentBet: minBet,
        hasPlacedBet: false,
      })),
      currentTurnPlayerId: null,
      currentTurnHandIndex: 0,
      turnDeadline: null,
      actionLog: ['Place your bets to start the round.'],
      minBet,
      maxBet,
      handNumber: 0,
    };
  }

  public setPlayers(players: BlackjackPlayer[]): void {
    const existingMap = new Map(this.state.players.map((p) => [p.id, p]));
    this.state.players = players.map((p, idx) => {
      const existing = existingMap.get(p.id);
      return {
        ...p,
        seatIndex: idx,
        hands: existing?.hands || [],
        currentHandIndex: existing?.currentHandIndex || 0,
        currentBet: existing?.currentBet || this.state.minBet,
        hasPlacedBet: existing?.hasPlacedBet || false,
      };
    });
  }

  private emitState(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  public getState(): BlackjackGameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  private drawCard(): Card {
    if (this.shoe.length < 20) {
      this.shoe = createDeck(6);
      this.state.actionLog.push('Shoe shuffled.');
    }
    return this.shoe.pop()!;
  }

  public placeBet(playerId: string, amount: number): boolean {
    if (this.state.phase !== 'betting') return false;
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;
    if (amount < this.state.minBet || amount > this.state.maxBet) return false;
    if (amount > player.chips) return false;

    player.currentBet = amount;
    player.hasPlacedBet = true;
    this.state.actionLog.push(`${player.name} bet $${amount}`);
    this.emitState();

    const allPlaced = this.state.players.every((p) => p.hasPlacedBet || p.chips < this.state.minBet);
    if (allPlaced && this.state.players.some((p) => p.hasPlacedBet)) {
      this.dealRound();
    }
    return true;
  }

  public dealRound(): boolean {
    if (this.state.phase !== 'betting') return false;
    const activePlayers = this.state.players.filter((p) => p.hasPlacedBet && p.currentBet <= p.chips);
    if (activePlayers.length === 0) return false;

    this.clearTurnTimeout();
    this.state.handNumber += 1;
    this.state.phase = 'dealing';
    this.state.dealerCards = [];
    this.dealerHoleCard = null;
    this.state.actionLog = [`--- Blackjack Hand #${this.state.handNumber} ---`];

    for (const p of this.state.players) {
      if (p.hasPlacedBet && p.currentBet <= p.chips) {
        p.chips -= p.currentBet;
        p.hands = [
          {
            cards: [],
            bet: p.currentBet,
            isStand: false,
            isBusted: false,
            isBlackjack: false,
            isDoubled: false,
          },
        ];
        p.currentHandIndex = 0;
      } else {
        p.hands = [];
      }
    }

    for (const p of activePlayers) {
      p.hands[0].cards.push(this.drawCard());
    }

    this.state.dealerCards.push(this.drawCard());

    for (const p of activePlayers) {
      p.hands[0].cards.push(this.drawCard());
    }

    this.dealerHoleCard = this.drawCard();
    this.state.dealerCards.push({
      ...this.dealerHoleCard,
      hidden: true,
    });

    this.state.dealerScore = calculateHandValue([this.state.dealerCards[0]]).total;

    for (const p of activePlayers) {
      const hand = p.hands[0];
      if (isNaturalBlackjack(hand.cards)) {
        hand.isBlackjack = true;
        hand.isStand = true;
        this.state.actionLog.push(`${p.name} has Blackjack!`);
      }
    }

    this.state.phase = 'player_turns';
    this.findNextTurn(0, 0);
    return true;
  }

  private findNextTurn(startPlayerIdx: number, startHandIdx: number): void {
    this.clearTurnTimeout();
    const activePlayers = this.state.players.filter((p) => p.hands.length > 0);

    for (let pIdx = startPlayerIdx; pIdx < activePlayers.length; pIdx++) {
      const p = activePlayers[pIdx];
      const initialHandIdx = pIdx === startPlayerIdx ? startHandIdx : 0;

      for (let hIdx = initialHandIdx; hIdx < p.hands.length; hIdx++) {
        const hand = p.hands[hIdx];
        if (!hand.isStand && !hand.isBusted && !hand.isBlackjack) {
          p.currentHandIndex = hIdx;
          this.state.currentTurnPlayerId = p.id;
          this.state.currentTurnHandIndex = hIdx;
          this.state.turnDeadline = Date.now() + this.turnDurationMs;
          this.turnTimeoutTimer = setTimeout(() => {
            this.handleAction(p.id, 'stand');
          }, this.turnDurationMs);
          if (typeof (this.turnTimeoutTimer as any)?.unref === 'function') {
            (this.turnTimeoutTimer as any).unref();
          }
          this.emitState();
          return;
        }
      }
    }

    this.startDealerTurn();
  }

  private clearTurnTimeout(): void {
    if (this.turnTimeoutTimer) {
      clearTimeout(this.turnTimeoutTimer);
      this.turnTimeoutTimer = null;
    }
  }

  public handleAction(playerId: string, action: BlackjackActionType): boolean {
    if (this.state.phase !== 'player_turns') return false;
    if (this.state.currentTurnPlayerId !== playerId) return false;

    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;

    const hand = player.hands[this.state.currentTurnHandIndex];
    if (!hand || hand.isStand || hand.isBusted) return false;

    switch (action) {
      case 'hit': {
        const newCard = this.drawCard();
        hand.cards.push(newCard);
        const score = calculateHandValue(hand.cards);
        this.state.actionLog.push(`${player.name} hits: ${newCard.rank}${newCard.suit}`);

        if (score.isBusted) {
          hand.isBusted = true;
          hand.isStand = true;
          this.state.actionLog.push(`${player.name} busts with ${score.total}!`);
          this.advanceToNextHand();
        } else if (score.total === 21) {
          hand.isStand = true;
          this.advanceToNextHand();
        } else {
          this.emitState();
        }
        break;
      }

      case 'stand': {
        hand.isStand = true;
        this.state.actionLog.push(`${player.name} stands on ${calculateHandValue(hand.cards).total}`);
        this.advanceToNextHand();
        break;
      }

      case 'double': {
        if (!canDoubleHand(hand) || player.chips < hand.bet) {
          return false;
        }
        player.chips -= hand.bet;
        hand.bet *= 2;
        hand.isDoubled = true;
        const card = this.drawCard();
        hand.cards.push(card);
        const score = calculateHandValue(hand.cards);
        hand.isStand = true;
        if (score.isBusted) {
          hand.isBusted = true;
          this.state.actionLog.push(`${player.name} doubles down and busts with ${score.total}!`);
        } else {
          this.state.actionLog.push(`${player.name} doubles down: ${score.total}`);
        }
        this.advanceToNextHand();
        break;
      }

      case 'split': {
        if (!canSplitHand(hand) || player.chips < hand.bet) {
          return false;
        }
        player.chips -= hand.bet;
        const card1 = hand.cards[0];
        const card2 = hand.cards[1];

        const hand1: BlackjackHand = {
          cards: [card1, this.drawCard()],
          bet: hand.bet,
          isStand: false,
          isBusted: false,
          isBlackjack: false,
          isDoubled: false,
        };

        const hand2: BlackjackHand = {
          cards: [card2, this.drawCard()],
          bet: hand.bet,
          isStand: false,
          isBusted: false,
          isBlackjack: false,
          isDoubled: false,
        };

        player.hands.splice(this.state.currentTurnHandIndex, 1, hand1, hand2);
        this.state.actionLog.push(`${player.name} splits cards`);
        this.emitState();
        break;
      }

      default:
        return false;
    }

    return true;
  }

  private advanceToNextHand(): void {
    const activePlayers = this.state.players.filter((p) => p.hands.length > 0);
    const pIdx = activePlayers.findIndex((p) => p.id === this.state.currentTurnPlayerId);
    if (pIdx === -1) {
      this.startDealerTurn();
      return;
    }
    this.findNextTurn(pIdx, this.state.currentTurnHandIndex + 1);
  }

  private startDealerTurn(): void {
    this.clearTurnTimeout();
    this.state.phase = 'dealer_turn';
    this.state.currentTurnPlayerId = null;
    this.state.turnDeadline = null;

    if (this.dealerHoleCard) {
      this.state.dealerCards = [this.state.dealerCards[0], this.dealerHoleCard];
    }
    this.state.dealerScore = calculateHandValue(this.state.dealerCards).total;

    const allPlayersBusted = this.state.players
      .filter((p) => p.hands.length > 0)
      .every((p) => p.hands.every((h) => h.isBusted));

    if (!allPlayersBusted) {
      while (shouldDealerHit(this.state.dealerCards)) {
        const nextCard = this.drawCard();
        this.state.dealerCards.push(nextCard);
        this.state.dealerScore = calculateHandValue(this.state.dealerCards).total;
      }
    }

    this.finishRound();
  }

  private finishRound(): void {
    this.state.phase = 'payout';
    const dealerCards = this.state.dealerCards;
    const dealerVal = calculateHandValue(dealerCards);
    this.state.dealerScore = dealerVal.total;

    if (dealerVal.isBusted) {
      this.state.actionLog.push(`Dealer busts with ${dealerVal.total}!`);
    } else {
      this.state.actionLog.push(`Dealer finishes with ${dealerVal.total}`);
    }

    for (const player of this.state.players) {
      for (const hand of player.hands) {
        const payout = calculatePayout(hand, dealerCards);
        hand.payoutResult = payout.result;
        hand.payoutAmount = payout.payoutAmount;

        if (payout.payoutAmount > 0) {
          player.chips += payout.payoutAmount;
        }

        if (payout.result === 'blackjack') {
          this.state.actionLog.push(`${player.name} wins Blackjack: +$${payout.payoutAmount}`);
        } else if (payout.result === 'win') {
          this.state.actionLog.push(`${player.name} wins: +$${payout.payoutAmount}`);
        } else if (payout.result === 'push') {
          this.state.actionLog.push(`${player.name} pushes (bet returned)`);
        } else {
          this.state.actionLog.push(`${player.name} loses hand`);
        }
      }
      player.hasPlacedBet = false;
    }

    this.state.phase = 'ended';
    this.emitState();
  }
}
