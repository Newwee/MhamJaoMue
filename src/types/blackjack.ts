import { BasePlayer, Card } from './common';

export type BlackjackPhase =
  | 'betting'
  | 'dealing'
  | 'player_turns'
  | 'dealer_turn'
  | 'payout'
  | 'ended';

export type BlackjackActionType = 'hit' | 'stand' | 'double' | 'split';

export interface BlackjackHand {
  cards: Card[];
  bet: number;
  isStand: boolean;
  isBusted: boolean;
  isBlackjack: boolean;
  isDoubled: boolean;
  payoutResult?: 'win' | 'lose' | 'push' | 'blackjack';
  payoutAmount?: number;
}

export interface BlackjackPlayer extends BasePlayer {
  hands: BlackjackHand[];
  currentHandIndex: number;
  currentBet: number;
  hasPlacedBet: boolean;
  seatIndex: number;
}

export interface BlackjackGameState {
  phase: BlackjackPhase;
  dealerCards: Card[];
  dealerScore: number;
  players: BlackjackPlayer[];
  currentTurnPlayerId: string | null;
  currentTurnHandIndex: number;
  turnDeadline: number | null;
  actionLog: string[];
  minBet: number;
  maxBet: number;
  handNumber: number;
}
