import { test } from 'node:test';
import assert from 'node:assert';
import {
  calculateHandValue,
  isNaturalBlackjack,
  canSplitHand,
  canDoubleHand,
  shouldDealerHit,
  calculatePayout
} from '../server/blackjack/blackjackLogic';
import { Card } from '../src/types/common';
import { BlackjackHand } from '../src/types/blackjack';

test('Blackjack - Hand Value with Aces and Soft Hand', () => {
  const cards: Card[] = [
    { suit: 'hearts', rank: 'A' },
    { suit: 'spades', rank: '6' }
  ];
  const value = calculateHandValue(cards);
  assert.strictEqual(value.total, 17);
  assert.strictEqual(value.isSoft, true);
  assert.strictEqual(value.isBusted, false);
});

test('Blackjack - Ace Reduction on Bust', () => {
  const cards: Card[] = [
    { suit: 'hearts', rank: 'A' },
    { suit: 'spades', rank: '8' },
    { suit: 'diamonds', rank: '5' }
  ];
  const value = calculateHandValue(cards);
  assert.strictEqual(value.total, 14);
  assert.strictEqual(value.isBusted, false);
});

test('Blackjack - Multiple Aces', () => {
  const cards: Card[] = [
    { suit: 'hearts', rank: 'A' },
    { suit: 'diamonds', rank: 'A' },
    { suit: 'clubs', rank: '9' }
  ];
  const value = calculateHandValue(cards);
  assert.strictEqual(value.total, 21);
});

test('Blackjack - Bust Detection', () => {
  const cards: Card[] = [
    { suit: 'hearts', rank: '10' },
    { suit: 'diamonds', rank: '8' },
    { suit: 'clubs', rank: '5' }
  ];
  const value = calculateHandValue(cards);
  assert.strictEqual(value.total, 23);
  assert.strictEqual(value.isBusted, true);
});

test('Blackjack - Natural Blackjack', () => {
  const bj: Card[] = [
    { suit: 'spades', rank: 'A' },
    { suit: 'hearts', rank: 'K' }
  ];
  assert.strictEqual(isNaturalBlackjack(bj), true);

  const notBj: Card[] = [
    { suit: 'spades', rank: '7' },
    { suit: 'hearts', rank: '7' },
    { suit: 'diamonds', rank: '7' }
  ];
  assert.strictEqual(isNaturalBlackjack(notBj), false);
});

test('Blackjack - Split and Double Down eligibility', () => {
  const handSplit: BlackjackHand = {
    cards: [
      { suit: 'hearts', rank: '8' },
      { suit: 'spades', rank: '8' }
    ],
    bet: 100,
    isStand: false,
    isBusted: false,
    isBlackjack: false,
    isDoubled: false
  };
  assert.strictEqual(canSplitHand(handSplit), true);
  assert.strictEqual(canDoubleHand(handSplit), true);

  const handFaceSplit: BlackjackHand = {
    cards: [
      { suit: 'hearts', rank: '10' },
      { suit: 'spades', rank: 'K' }
    ],
    bet: 100,
    isStand: false,
    isBusted: false,
    isBlackjack: false,
    isDoubled: false
  };
  assert.strictEqual(canSplitHand(handFaceSplit), true);
});

test('Blackjack - Dealer Hit Rules', () => {
  assert.strictEqual(
    shouldDealerHit([
      { suit: 'hearts', rank: '10' },
      { suit: 'spades', rank: '6' }
    ]),
    true
  );
  assert.strictEqual(
    shouldDealerHit([
      { suit: 'hearts', rank: '10' },
      { suit: 'spades', rank: '7' }
    ]),
    false
  );
});

test('Blackjack - Payouts: Natural, Win, Push, Dealer Bust', () => {
  const naturalHand: BlackjackHand = {
    cards: [
      { suit: 'hearts', rank: 'A' },
      { suit: 'spades', rank: 'K' }
    ],
    bet: 100,
    isStand: true,
    isBusted: false,
    isBlackjack: true,
    isDoubled: false
  };
  const dealer20: Card[] = [
    { suit: 'diamonds', rank: '10' },
    { suit: 'clubs', rank: 'K' }
  ];
  const naturalResult = calculatePayout(naturalHand, dealer20);
  assert.strictEqual(naturalResult.result, 'blackjack');
  assert.strictEqual(naturalResult.payoutAmount, 250);

  const player20: BlackjackHand = {
    cards: [
      { suit: 'hearts', rank: '10' },
      { suit: 'spades', rank: '10' }
    ],
    bet: 100,
    isStand: true,
    isBusted: false,
    isBlackjack: false,
    isDoubled: false
  };
  const dealer18: Card[] = [
    { suit: 'diamonds', rank: '10' },
    { suit: 'clubs', rank: '8' }
  ];
  const winResult = calculatePayout(player20, dealer18);
  assert.strictEqual(winResult.result, 'win');
  assert.strictEqual(winResult.payoutAmount, 200);

  const pushResult = calculatePayout(player20, dealer20);
  assert.strictEqual(pushResult.result, 'push');
  assert.strictEqual(pushResult.payoutAmount, 100);
});
