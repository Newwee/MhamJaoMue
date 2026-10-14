import { test } from 'node:test';
import assert from 'node:assert';
import { evaluate5Cards, evaluate7Cards, compareHands } from '../server/poker/handEvaluator';
import { Card } from '../src/types/common';

test('Poker Evaluator - Royal Flush', () => {
  const cards: Card[] = [
    { suit: 'hearts', rank: 'A' },
    { suit: 'hearts', rank: 'K' },
    { suit: 'hearts', rank: 'Q' },
    { suit: 'hearts', rank: 'J' },
    { suit: 'hearts', rank: '10' }
  ];
  const hand = evaluate5Cards(cards);
  assert.strictEqual(hand.category, 9);
  assert.strictEqual(hand.name, 'Royal Flush');
});

test('Poker Evaluator - Straight Flush Wheel (A-2-3-4-5)', () => {
  const cards: Card[] = [
    { suit: 'spades', rank: 'A' },
    { suit: 'spades', rank: '5' },
    { suit: 'spades', rank: '4' },
    { suit: 'spades', rank: '3' },
    { suit: 'spades', rank: '2' }
  ];
  const hand = evaluate5Cards(cards);
  assert.strictEqual(hand.category, 9);
  assert.strictEqual(hand.score[1], 5);
});

test('Poker Evaluator - Four of a Kind', () => {
  const cards: Card[] = [
    { suit: 'hearts', rank: '8' },
    { suit: 'diamonds', rank: '8' },
    { suit: 'clubs', rank: '8' },
    { suit: 'spades', rank: '8' },
    { suit: 'hearts', rank: 'K' }
  ];
  const hand = evaluate5Cards(cards);
  assert.strictEqual(hand.category, 8);
  assert.strictEqual(hand.score[1], 8);
  assert.strictEqual(hand.score[2], 13);
});

test('Poker Evaluator - Full House', () => {
  const cards: Card[] = [
    { suit: 'hearts', rank: 'J' },
    { suit: 'diamonds', rank: 'J' },
    { suit: 'clubs', rank: 'J' },
    { suit: 'spades', rank: '4' },
    { suit: 'hearts', rank: '4' }
  ];
  const hand = evaluate5Cards(cards);
  assert.strictEqual(hand.category, 7);
});

test('Poker Evaluator - Regular Straight and Wheel Straight', () => {
  const highStraight: Card[] = [
    { suit: 'hearts', rank: 'A' },
    { suit: 'diamonds', rank: 'K' },
    { suit: 'clubs', rank: 'Q' },
    { suit: 'spades', rank: 'J' },
    { suit: 'hearts', rank: '10' }
  ];
  const handHigh = evaluate5Cards(highStraight);
  assert.strictEqual(handHigh.category, 5);
  assert.strictEqual(handHigh.score[1], 14);

  const wheelStraight: Card[] = [
    { suit: 'hearts', rank: 'A' },
    { suit: 'diamonds', rank: '2' },
    { suit: 'clubs', rank: '3' },
    { suit: 'spades', rank: '4' },
    { suit: 'hearts', rank: '5' }
  ];
  const handWheel = evaluate5Cards(wheelStraight);
  assert.strictEqual(handWheel.category, 5);
  assert.strictEqual(handWheel.score[1], 5);

  assert.strictEqual(compareHands(handHigh, handWheel), 1);
});

test('Poker Evaluator - 7 Cards Best Hand Selection', () => {
  const cards: Card[] = [
    { suit: 'hearts', rank: 'A' },
    { suit: 'diamonds', rank: 'A' },
    { suit: 'clubs', rank: 'A' },
    { suit: 'spades', rank: 'K' },
    { suit: 'hearts', rank: 'K' },
    { suit: 'diamonds', rank: '2' },
    { suit: 'clubs', rank: '3' }
  ];
  const hand = evaluate7Cards(cards);
  assert.strictEqual(hand.category, 7);
  assert.strictEqual(hand.score[1], 14);
  assert.strictEqual(hand.score[2], 13);
});

test('Poker Evaluator - Kicker Comparison with One Pair', () => {
  const playerA: Card[] = [
    { suit: 'hearts', rank: '10' },
    { suit: 'diamonds', rank: '10' },
    { suit: 'clubs', rank: 'A' },
    { suit: 'spades', rank: '7' },
    { suit: 'hearts', rank: '4' }
  ];
  const playerB: Card[] = [
    { suit: 'clubs', rank: '10' },
    { suit: 'spades', rank: '10' },
    { suit: 'diamonds', rank: 'K' },
    { suit: 'hearts', rank: '7' },
    { suit: 'diamonds', rank: '4' }
  ];
  const handA = evaluate5Cards(playerA);
  const handB = evaluate5Cards(playerB);
  assert.strictEqual(compareHands(handA, handB), 1);
});
