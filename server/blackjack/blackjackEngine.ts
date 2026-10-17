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
  isPairHand,
} from './blackjackLogic';

export class BlackjackEngine {
  public state: BlackjackGameState;
  private shoe: Card[] = [];
  private dealerHoleCard: Card | null = null;
  private onStateChange?: (state: BlackjackGameState) => void;
  private turnTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private dealerTurnTimer: ReturnType<typeof setTimeout> | null = null;
  private botActionTimer: ReturnType<typeof setTimeout> | null = null;
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
        pairBet: existing?.pairBet || 0,
        pairWon: existing?.pairWon,
        pairPayout: existing?.pairPayout,
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

  public clearTimers(): void {
    if (this.turnTimeoutTimer) {
      clearTimeout(this.turnTimeoutTimer);
      this.turnTimeoutTimer = null;
    }
    if (this.dealerTurnTimer) {
      clearTimeout(this.dealerTurnTimer);
      this.dealerTurnTimer = null;
    }
    if (this.botActionTimer) {
      clearTimeout(this.botActionTimer);
      this.botActionTimer = null;
    }
  }

  public autoBetBots(): void {
    if (this.state.phase !== 'betting') return;
    let anyBotBet = false;
    for (const p of this.state.players) {
      if (p.isBot && !p.hasPlacedBet && p.chips >= this.state.minBet) {
        p.currentBet = Math.min(100, p.chips);
        p.hasPlacedBet = true;
        this.state.actionLog.push(`${p.name} places bet $${p.currentBet}`);
        anyBotBet = true;
      }
    }
    if (anyBotBet) {
      this.emitState();
    }
    const allPlaced = this.state.players.every((p) => p.hasPlacedBet || p.chips < this.state.minBet);
    if (allPlaced && this.state.players.some((p) => p.hasPlacedBet)) {
      if (this.dealerTurnTimer) clearTimeout(this.dealerTurnTimer);
      this.dealerTurnTimer = setTimeout(() => {
        if (this.state.phase === 'betting') {
          this.dealRound();
        }
      }, 600);
      if (typeof (this.dealerTurnTimer as any)?.unref === 'function') {
        (this.dealerTurnTimer as any).unref();
      }
    }
  }

  public placeBet(playerId: string, amount: number, pairBet = 0): boolean {
    if (this.state.phase !== 'betting') return false;
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;
    if (amount < this.state.minBet || amount > this.state.maxBet) return false;
    const validPair = Math.max(0, pairBet);
    if (amount + validPair > player.chips) return false;

    player.currentBet = amount;
    player.pairBet = validPair;
    player.pairWon = undefined;
    player.pairPayout = undefined;
    player.hasPlacedBet = true;
    this.state.actionLog.push(`${player.name} bet $${amount}${validPair > 0 ? ` + PAIR $${validPair}` : ''}`);
    this.emitState();

    this.autoBetBots();

    const allPlaced = this.state.players.every((p) => p.hasPlacedBet || p.chips < this.state.minBet);
    if (allPlaced && this.state.players.some((p) => p.hasPlacedBet)) {
      if (this.dealerTurnTimer) clearTimeout(this.dealerTurnTimer);
      this.dealerTurnTimer = setTimeout(() => {
        if (this.state.phase === 'betting') {
          this.dealRound();
        }
      }, 500);
      if (typeof (this.dealerTurnTimer as any)?.unref === 'function') {
        (this.dealerTurnTimer as any).unref();
      }
    }
    return true;
  }

  public dealRound(): boolean {
    if (this.state.phase !== 'betting') return false;
    const activePlayers = this.state.players.filter((p) => {
      const totalReq = p.currentBet + (p.pairBet || 0);
      return p.hasPlacedBet && totalReq <= p.chips;
    });
    if (activePlayers.length === 0) return false;

    this.clearTimers();
    this.state.handNumber += 1;
    this.state.phase = 'dealing';
    this.state.dealerCards = [];
    this.dealerHoleCard = null;
    this.state.actionLog = [`--- Blackjack Hand #${this.state.handNumber} ---`];

    for (const p of this.state.players) {
      const totalReq = p.currentBet + (p.pairBet || 0);
      if (p.hasPlacedBet && totalReq <= p.chips) {
        p.chips -= totalReq;
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
      if (p.pairBet && p.pairBet > 0) {
        if (isPairHand(hand.cards)) {
          const profit = p.pairBet * 11;
          const payout = p.pairBet + profit;
          p.chips += payout;
          p.pairWon = true;
          p.pairPayout = payout;
          this.state.actionLog.push(`${p.name} hits PAIR side bet with ${hand.cards[0].rank}-${hand.cards[1].rank}! +$${profit} (11:1)`);
        } else {
          p.pairWon = false;
          p.pairPayout = 0;
        }
      }

      if (isNaturalBlackjack(hand.cards)) {
        hand.isBlackjack = true;
        hand.isStand = true;
        this.state.actionLog.push(`${p.name} has Blackjack!`);
      }
    }

    const upcard = this.state.dealerCards[0];
    const canHaveBJ = upcard.rank === 'A' || ['10', 'J', 'Q', 'K'].includes(upcard.rank);
    const dealerBJ = this.dealerHoleCard && isNaturalBlackjack([upcard, this.dealerHoleCard]);

    if (canHaveBJ) {
      this.state.dealerPeeking = true;
      this.emitState();
      if (this.dealerTurnTimer) clearTimeout(this.dealerTurnTimer);
      this.dealerTurnTimer = setTimeout(() => {
        this.state.dealerPeeking = false;
        if (dealerBJ) {
          this.startDealerTurn();
        } else {
          this.state.phase = 'player_turns';
          this.findNextTurn(0, 0);
        }
      }, 800);
      if (typeof (this.dealerTurnTimer as any)?.unref === 'function') {
        (this.dealerTurnTimer as any).unref();
      }
      return true;
    }

    this.state.phase = 'player_turns';
    this.findNextTurn(0, 0);
    return true;
  }

  private findNextTurn(startPlayerIdx: number, startHandIdx: number): void {
    this.clearTimers();
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

          if (p.isBot) {
            this.scheduleBotTurn(p.id);
          }
          return;
        }
      }
    }

    this.startDealerTurn();
  }

  private scheduleBotTurn(botId: string): void {
    if (this.botActionTimer) clearTimeout(this.botActionTimer);
    this.botActionTimer = setTimeout(() => {
      if (this.state.phase !== 'player_turns' || this.state.currentTurnPlayerId !== botId) {
        return;
      }
      const bot = this.state.players.find((p) => p.id === botId);
      if (!bot) return;
      const hand = bot.hands[this.state.currentTurnHandIndex];
      if (!hand || hand.isStand || hand.isBusted) return;

      const val = calculateHandValue(hand.cards);
      if (val.total <= 16 || (val.total === 17 && val.isSoft)) {
        this.handleAction(botId, 'hit');
      } else {
        this.handleAction(botId, 'stand');
      }
    }, 900);
    if (typeof (this.botActionTimer as any)?.unref === 'function') {
      (this.botActionTimer as any).unref();
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
    this.clearTimers();
    this.state.phase = 'dealer_turn';
    this.state.currentTurnPlayerId = null;
    this.state.turnDeadline = null;
    this.state.actionLog.push('Dealer is revealing hole card...');
    this.emitState();

    this.dealerTurnTimer = setTimeout(() => {
      if (this.dealerHoleCard) {
        this.state.dealerCards = [this.state.dealerCards[0], this.dealerHoleCard];
      }
      this.state.dealerScore = calculateHandValue(this.state.dealerCards).total;
      this.state.actionLog.push(`Dealer reveals ${this.state.dealerCards[1]?.rank}${this.state.dealerCards[1]?.suit} (Total: ${this.state.dealerScore})`);
      this.emitState();

      const allPlayersBusted = this.state.players
        .filter((p) => p.hands.length > 0)
        .every((p) => p.hands.every((h) => h.isBusted));

      if (allPlayersBusted) {
        this.dealerTurnTimer = setTimeout(() => {
          this.finishRound();
        }, 1000);
        if (typeof (this.dealerTurnTimer as any)?.unref === 'function') {
          (this.dealerTurnTimer as any).unref();
        }
      } else {
        this.stepDealerHit();
      }
    }, 1300);

    if (typeof (this.dealerTurnTimer as any)?.unref === 'function') {
      (this.dealerTurnTimer as any).unref();
    }
  }

  private stepDealerHit(): void {
    if (shouldDealerHit(this.state.dealerCards)) {
      this.dealerTurnTimer = setTimeout(() => {
        const nextCard = this.drawCard();
        this.state.dealerCards.push(nextCard);
        this.state.dealerScore = calculateHandValue(this.state.dealerCards).total;
        this.state.actionLog.push(`Dealer draws ${nextCard.rank}${nextCard.suit} (Total: ${this.state.dealerScore})`);
        this.emitState();
        this.stepDealerHit();
      }, 1100);
      if (typeof (this.dealerTurnTimer as any)?.unref === 'function') {
        (this.dealerTurnTimer as any).unref();
      }
    } else {
      this.dealerTurnTimer = setTimeout(() => {
        this.finishRound();
      }, 1000);
      if (typeof (this.dealerTurnTimer as any)?.unref === 'function') {
        (this.dealerTurnTimer as any).unref();
      }
    }
  }

  private finishRound(): void {
    this.clearTimers();
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

  public resetForNextHand(): void {
    this.clearTimers();
    this.state.phase = 'betting';
    this.state.dealerCards = [];
    this.dealerHoleCard = null;
    this.state.dealerScore = 0;
    this.state.currentTurnPlayerId = null;
    this.state.turnDeadline = null;
    for (const p of this.state.players) {
      p.hands = [];
      p.hasPlacedBet = false;
      p.pairWon = undefined;
      p.pairPayout = undefined;
    }
    this.state.actionLog.push('New round - choose your wager!');
    this.autoBetBots();
  }
}
