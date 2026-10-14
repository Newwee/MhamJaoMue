import { Card, Rank, Suit } from '../../src/types/common';

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
};

export const VALUE_TO_RANK: Record<number, Rank> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

export interface EvaluatedHand {
  category: number;
  score: number[];
  name: string;
  cards: Card[];
}

function getCombinations<T>(array: T[], size: number): T[][] {
  function p(t: T[], i: number) {
    if (t.length === size) {
      result.push(t);
      return;
    }
    if (i + 1 > array.length) {
      return;
    }
    p(t.concat(array[i]), i + 1);
    p(t, i + 1);
  }

  const result: T[][] = [];
  p([], 0);
  return result;
}

export function evaluate5Cards(cards: Card[]): EvaluatedHand {
  const sorted = [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
  const values = sorted.map((c) => RANK_VALUES[c.rank]);
  const suits = sorted.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  let isStraight = false;
  let straightHigh = 0;

  if (
    values[0] - values[1] === 1 &&
    values[1] - values[2] === 1 &&
    values[2] - values[3] === 1 &&
    values[3] - values[4] === 1
  ) {
    isStraight = true;
    straightHigh = values[0];
  } else if (
    values[0] === 14 &&
    values[1] === 5 &&
    values[2] === 4 &&
    values[3] === 3 &&
    values[4] === 2
  ) {
    isStraight = true;
    straightHigh = 5;
  }

  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return {
        category: 9,
        score: [9, 14],
        name: 'Royal Flush',
        cards: sorted,
      };
    }
    return {
      category: 9,
      score: [9, straightHigh],
      name: `Straight Flush (${VALUE_TO_RANK[straightHigh]} High)`,
      cards: sorted,
    };
  }

  const counts: Record<number, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }

  const groupKeys = Object.keys(counts).map(Number);
  groupKeys.sort((a, b) => {
    if (counts[b] !== counts[a]) {
      return counts[b] - counts[a];
    }
    return b - a;
  });

  const primaryCount = counts[groupKeys[0]];
  const secondaryCount = counts[groupKeys[1]] || 0;

  if (primaryCount === 4) {
    const quadVal = groupKeys[0];
    const kicker = groupKeys[1];
    return {
      category: 8,
      score: [8, quadVal, kicker],
      name: `Four of a Kind (${VALUE_TO_RANK[quadVal]}s)`,
      cards: sorted,
    };
  }

  if (primaryCount === 3 && secondaryCount === 2) {
    const tripVal = groupKeys[0];
    const pairVal = groupKeys[1];
    return {
      category: 7,
      score: [7, tripVal, pairVal],
      name: `Full House (${VALUE_TO_RANK[tripVal]}s full of ${VALUE_TO_RANK[pairVal]}s)`,
      cards: sorted,
    };
  }

  if (isFlush) {
    return {
      category: 6,
      score: [6, ...values],
      name: `Flush (${sorted[0].rank} High)`,
      cards: sorted,
    };
  }

  if (isStraight) {
    return {
      category: 5,
      score: [5, straightHigh],
      name: `Straight (${VALUE_TO_RANK[straightHigh]} High)`,
      cards: sorted,
    };
  }

  if (primaryCount === 3) {
    const tripVal = groupKeys[0];
    const kickers = groupKeys.slice(1);
    return {
      category: 4,
      score: [4, tripVal, ...kickers],
      name: `Three of a Kind (${VALUE_TO_RANK[tripVal]}s)`,
      cards: sorted,
    };
  }

  if (primaryCount === 2 && secondaryCount === 2) {
    const highPair = Math.max(groupKeys[0], groupKeys[1]);
    const lowPair = Math.min(groupKeys[0], groupKeys[1]);
    const kicker = groupKeys[2];
    return {
      category: 3,
      score: [3, highPair, lowPair, kicker],
      name: `Two Pair (${VALUE_TO_RANK[highPair]}s and ${VALUE_TO_RANK[lowPair]}s)`,
      cards: sorted,
    };
  }

  if (primaryCount === 2) {
    const pairVal = groupKeys[0];
    const kickers = groupKeys.slice(1);
    return {
      category: 2,
      score: [2, pairVal, ...kickers],
      name: `One Pair (${VALUE_TO_RANK[pairVal]}s)`,
      cards: sorted,
    };
  }

  return {
    category: 1,
    score: [1, ...values],
    name: `High Card (${VALUE_TO_RANK[values[0]]})`,
    cards: sorted,
  };
}

export function compareHands(handA: EvaluatedHand, handB: EvaluatedHand): number {
  for (let i = 0; i < Math.max(handA.score.length, handB.score.length); i++) {
    const valA = handA.score[i] ?? 0;
    const valB = handB.score[i] ?? 0;
    if (valA > valB) return 1;
    if (valA < valB) return -1;
  }
  return 0;
}

export function evaluate7Cards(cards: Card[]): EvaluatedHand {
  if (cards.length < 5) {
    return {
      category: 0,
      score: [0],
      name: 'Incomplete Hand',
      cards,
    };
  }

  if (cards.length === 5) {
    return evaluate5Cards(cards);
  }

  const combinations = getCombinations(cards, 5);
  let bestHand: EvaluatedHand | null = null;

  for (const combo of combinations) {
    const evaluated = evaluate5Cards(combo);
    if (!bestHand || compareHands(evaluated, bestHand) > 0) {
      bestHand = evaluated;
    }
  }

  return bestHand!;
}
