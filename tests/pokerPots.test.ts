import { test } from 'node:test';
import assert from 'node:assert';
import { calculatePots, distributePots, PlayerPotInfo } from '../server/poker/potCalculator';
import { Card } from '../src/types/common';

test('Poker Pots - Single Pot Equal Contributions', () => {
  const players: PlayerPotInfo[] = [
    { id: 'p1', name: 'Alice', totalBetInHand: 100, folded: false, isAllIn: false, pocketCards: [], seatIndex: 0 },
    { id: 'p2', name: 'Bob', totalBetInHand: 100, folded: false, isAllIn: false, pocketCards: [], seatIndex: 1 },
    { id: 'p3', name: 'Charlie', totalBetInHand: 100, folded: false, isAllIn: false, pocketCards: [], seatIndex: 2 }
  ];

  const result = calculatePots(players);
  assert.strictEqual(result.pots.length, 1);
  assert.strictEqual(result.pots[0].amount, 300);
  assert.strictEqual(result.pots[0].eligiblePlayerIds.length, 3);
});

test('Poker Pots - Multi-way Side Pot with Short All-in', () => {
  const players: PlayerPotInfo[] = [
    { id: 'p1', name: 'Alice', totalBetInHand: 50, folded: false, isAllIn: true, pocketCards: [], seatIndex: 0 },
    { id: 'p2', name: 'Bob', totalBetInHand: 150, folded: false, isAllIn: true, pocketCards: [], seatIndex: 1 },
    { id: 'p3', name: 'Charlie', totalBetInHand: 150, folded: false, isAllIn: false, pocketCards: [], seatIndex: 2 }
  ];

  const result = calculatePots(players);
  assert.strictEqual(result.pots.length, 2);
  assert.strictEqual(result.pots[0].amount, 150);
  assert.deepStrictEqual(result.pots[0].eligiblePlayerIds, ['p1', 'p2', 'p3']);
  assert.strictEqual(result.pots[1].amount, 200);
  assert.deepStrictEqual(result.pots[1].eligiblePlayerIds, ['p2', 'p3']);
});

test('Poker Pots - Uncalled Bet Refund', () => {
  const players: PlayerPotInfo[] = [
    { id: 'p1', name: 'Alice', totalBetInHand: 200, folded: false, isAllIn: false, pocketCards: [], seatIndex: 0 },
    { id: 'p2', name: 'Bob', totalBetInHand: 50, folded: false, isAllIn: true, pocketCards: [], seatIndex: 1 }
  ];

  const result = calculatePots(players);
  assert.strictEqual(result.uncalledRefunds['p1'], 150);
  assert.strictEqual(result.pots.length, 1);
  assert.strictEqual(result.pots[0].amount, 100);
});

test('Poker Pots - Split Pot on Tie', () => {
  const community: Card[] = [
    { suit: 'hearts', rank: 'A' },
    { suit: 'diamonds', rank: 'K' },
    { suit: 'clubs', rank: 'Q' },
    { suit: 'spades', rank: 'J' },
    { suit: 'hearts', rank: '10' }
  ];

  const players: PlayerPotInfo[] = [
    {
      id: 'p1',
      name: 'Alice',
      totalBetInHand: 100,
      folded: false,
      isAllIn: false,
      pocketCards: [{ suit: 'clubs', rank: '2' }, { suit: 'spades', rank: '3' }],
      seatIndex: 0
    },
    {
      id: 'p2',
      name: 'Bob',
      totalBetInHand: 100,
      folded: false,
      isAllIn: false,
      pocketCards: [{ suit: 'diamonds', rank: '4' }, { suit: 'hearts', rank: '5' }],
      seatIndex: 1
    }
  ];

  const potResult = calculatePots(players);
  const distribution = distributePots(potResult.pots, players, community);

  assert.strictEqual(distribution.chipCredits['p1'], 100);
  assert.strictEqual(distribution.chipCredits['p2'], 100);
  assert.strictEqual(distribution.winners.length, 2);
});
