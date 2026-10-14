export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  hidden?: boolean;
}

export type GameType = 'poker' | 'blackjack';

export type GameMode = 'single' | 'multi';

export interface BasePlayer {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  isHost: boolean;
  isReady: boolean;
  isBot: boolean;
  isConnected: boolean;
}

export interface RoomSummary {
  id: string;
  name: string;
  gameType: GameType;
  playerCount: number;
  maxPlayers: number;
  inGame: boolean;
  hasPassword?: boolean;
  hostName: string;
}
