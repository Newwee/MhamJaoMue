import { BasePlayer, Card } from './common';

export type PokerPhase =
  | 'waiting'
  | 'preflop'
  | 'flop'
  | 'turn'
  | 'river'
  | 'showdown'
  | 'ended';

export type PokerActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';

export interface PokerPlayer extends BasePlayer {
  pocketCards: Card[];
  bet: number;
  totalBetInHand: number;
  folded: boolean;
  isAllIn: boolean;
  seatIndex: number;
  hasActed: boolean;
  handRankDescription?: string;
  wonAmount?: number;
}

export interface Pot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface PokerWinner {
  playerId: string;
  name: string;
  amount: number;
  potIndex: number;
  handDescription: string;
  winningCards?: Card[];
}

export interface PokerGameState {
  phase: PokerPhase;
  communityCards: Card[];
  pots: Pot[];
  currentBet: number;
  minRaise: number;
  turnPlayerId: string | null;
  turnDeadline: number | null;
  dealerIndex: number;
  smallBlind: number;
  bigBlind: number;
  players: PokerPlayer[];
  actionLog: string[];
  winners: PokerWinner[];
  handNumber: number;
}
