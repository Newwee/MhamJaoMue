import { Card } from '../../src/types/common';
import { PokerActionType, PokerPlayer } from '../../src/types/poker';
import { evaluate7Cards, RANK_VALUES } from './handEvaluator';

export function decideBotAction(
  bot: PokerPlayer,
  currentBet: number,
  minRaise: number,
  communityCards: Card[],
  bigBlind: number
): { action: PokerActionType; amount?: number } {
  const toCall = currentBet - bot.bet;

  if (toCall <= 0) {
    if (communityCards.length === 0) {
      const isStrongPreflop = isStrongPreflopHand(bot.pocketCards);
      if (isStrongPreflop && Math.random() < 0.6) {
        const betAmount = Math.min(bot.chips, bigBlind * 2);
        return { action: 'bet', amount: betAmount };
      }
      return { action: 'check' };
    }

    const currentHand = evaluate7Cards([...bot.pocketCards, ...communityCards]);
    if (currentHand.category >= 3 && Math.random() < 0.7) {
      const betAmount = Math.min(bot.chips, bigBlind * 3);
      return { action: 'bet', amount: betAmount };
    }
    return { action: 'check' };
  }

  if (bot.chips <= toCall) {
    if (communityCards.length === 0) {
      if (isMediumPreflopHand(bot.pocketCards)) {
        return { action: 'allin' };
      }
      return { action: 'fold' };
    }
    const currentHand = evaluate7Cards([...bot.pocketCards, ...communityCards]);
    if (currentHand.category >= 2) {
      return { action: 'allin' };
    }
    return { action: 'fold' };
  }

  if (communityCards.length === 0) {
    const isStrong = isStrongPreflopHand(bot.pocketCards);
    const isMedium = isMediumPreflopHand(bot.pocketCards);

    if (isStrong) {
      if (toCall <= bigBlind * 4 && Math.random() < 0.4) {
        const raiseTarget = Math.min(bot.chips + bot.bet, currentBet + minRaise);
        return { action: 'raise', amount: raiseTarget };
      }
      return { action: 'call' };
    }

    if (isMedium && toCall <= bigBlind * 3) {
      return { action: 'call' };
    }

    if (toCall <= bigBlind) {
      return { action: 'call' };
    }

    return { action: 'fold' };
  }

  const currentHand = evaluate7Cards([...bot.pocketCards, ...communityCards]);

  if (currentHand.category >= 4) {
    if (Math.random() < 0.5 && bot.chips >= toCall + minRaise) {
      const raiseTarget = Math.min(bot.chips + bot.bet, currentBet + minRaise);
      return { action: 'raise', amount: raiseTarget };
    }
    return { action: 'call' };
  }

  if (currentHand.category >= 2) {
    if (toCall <= bigBlind * 4) {
      return { action: 'call' };
    }
    if (toCall <= bot.chips * 0.25) {
      return { action: 'call' };
    }
  }

  if (toCall <= bigBlind) {
    return { action: 'call' };
  }

  return { action: 'fold' };
}

function isStrongPreflopHand(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  const rank1 = RANK_VALUES[cards[0].rank];
  const rank2 = RANK_VALUES[cards[1].rank];
  if (rank1 === rank2 && rank1 >= 9) return true;
  if ((rank1 === 14 && rank2 >= 10) || (rank2 === 14 && rank1 >= 10)) return true;
  if (rank1 >= 12 && rank2 >= 12) return true;
  if (cards[0].suit === cards[1].suit && (rank1 >= 11 || rank2 >= 11)) return true;
  return false;
}

function isMediumPreflopHand(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  const rank1 = RANK_VALUES[cards[0].rank];
  const rank2 = RANK_VALUES[cards[1].rank];
  if (rank1 === rank2) return true;
  if (rank1 >= 10 || rank2 >= 10) return true;
  if (cards[0].suit === cards[1].suit) return true;
  if (Math.abs(rank1 - rank2) <= 2 && Math.max(rank1, rank2) >= 7) return true;
  return false;
}
