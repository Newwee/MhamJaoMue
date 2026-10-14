import { Card, Rank, Suit } from '../../src/types/common';
import { BlackjackHand } from '../../src/types/blackjack';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createDeck(deckCount = 6): Card[] {
  const deck: Card[] = [];
  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank });
      }
    }
  }
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function calculateHandValue(cards: Card[]): { total: number; isSoft: boolean; isBusted: boolean } {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.hidden) continue;
    if (card.rank === 'A') {
      aces += 1;
      total += 11;
    } else if (['K', 'Q', 'J', '10'].includes(card.rank)) {
      total += 10;
    } else {
      total += parseInt(card.rank, 10);
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return {
    total,
    isSoft: aces > 0,
    isBusted: total > 21,
  };
}

export function isNaturalBlackjack(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  const val = calculateHandValue(cards);
  return val.total === 21;
}

export function canSplitHand(hand: BlackjackHand): boolean {
  if (hand.cards.length !== 2) return false;
  const rank1 = hand.cards[0].rank;
  const rank2 = hand.cards[1].rank;
  if (rank1 === rank2) return true;
  const tens = ['10', 'J', 'Q', 'K'];
  return tens.includes(rank1) && tens.includes(rank2);
}

export function canDoubleHand(hand: BlackjackHand): boolean {
  return hand.cards.length === 2 && !hand.isDoubled && !hand.isStand && !hand.isBusted;
}

export function shouldDealerHit(dealerCards: Card[]): boolean {
  const val = calculateHandValue(dealerCards);
  return val.total < 17;
}

export function calculatePayout(
  playerHand: BlackjackHand,
  dealerCards: Card[]
): { result: 'win' | 'lose' | 'push' | 'blackjack'; payoutAmount: number } {
  const playerVal = calculateHandValue(playerHand.cards);
  const dealerVal = calculateHandValue(dealerCards);
  const bet = playerHand.bet;

  if (playerVal.isBusted) {
    return { result: 'lose', payoutAmount: 0 };
  }

  const playerBJ = isNaturalBlackjack(playerHand.cards) && !playerHand.isDoubled;
  const dealerBJ = isNaturalBlackjack(dealerCards);

  if (playerBJ && dealerBJ) {
    return { result: 'push', payoutAmount: bet };
  }

  if (playerBJ) {
    const winAmount = Math.floor(bet * 2.5);
    return { result: 'blackjack', payoutAmount: winAmount };
  }

  if (dealerBJ) {
    return { result: 'lose', payoutAmount: 0 };
  }

  if (dealerVal.isBusted) {
    return { result: 'win', payoutAmount: bet * 2 };
  }

  if (playerVal.total > dealerVal.total) {
    return { result: 'win', payoutAmount: bet * 2 };
  }

  if (playerVal.total === dealerVal.total) {
    return { result: 'push', payoutAmount: bet };
  }

  return { result: 'lose', payoutAmount: 0 };
}
