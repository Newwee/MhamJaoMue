import { Card } from '../../src/types/common';
import { Pot, PokerWinner } from '../../src/types/poker';
import { evaluate7Cards, compareHands, EvaluatedHand } from './handEvaluator';

export interface PlayerPotInfo {
  id: string;
  name: string;
  totalBetInHand: number;
  folded: boolean;
  isAllIn: boolean;
  pocketCards: Card[];
  seatIndex: number;
}

export interface CalculatedPotsResult {
  pots: Pot[];
  uncalledRefunds: Record<string, number>;
}

export function calculatePots(players: PlayerPotInfo[]): CalculatedPotsResult {
  const contributions = players.map((p) => ({
    id: p.id,
    folded: p.folded,
    amount: p.totalBetInHand,
  }));

  const activePlayers = players.filter((p) => !p.folded && p.totalBetInHand > 0);
  const uncalledRefunds: Record<string, number> = {};

  if (activePlayers.length === 1 && players.every((p) => p.id === activePlayers[0].id || p.folded)) {
    const active = activePlayers[0];
    const maxFoldedBet = Math.max(0, ...players.filter((p) => p.folded).map((p) => p.totalBetInHand));
    if (active.totalBetInHand > maxFoldedBet) {
      const refund = active.totalBetInHand - maxFoldedBet;
      uncalledRefunds[active.id] = refund;
      const playerIdx = contributions.findIndex((c) => c.id === active.id);
      if (playerIdx >= 0) {
        contributions[playerIdx].amount -= refund;
      }
    }
  } else if (activePlayers.length > 1) {
    const sortedActiveBets = [...activePlayers].map((p) => p.totalBetInHand).sort((a, b) => b - a);
    if (sortedActiveBets[0] > sortedActiveBets[1]) {
      const highestPlayer = activePlayers.find((p) => p.totalBetInHand === sortedActiveBets[0])!;
      const refund = sortedActiveBets[0] - sortedActiveBets[1];
      uncalledRefunds[highestPlayer.id] = refund;
      const playerIdx = contributions.findIndex((c) => c.id === highestPlayer.id);
      if (playerIdx >= 0) {
        contributions[playerIdx].amount -= refund;
      }
    }
  }

  const levels = Array.from(
    new Set(
      players
        .filter((p) => !p.folded && p.totalBetInHand > 0)
        .map((p) => contributions.find((c) => c.id === p.id)?.amount || 0)
    )
  )
    .filter((lvl) => lvl > 0)
    .sort((a, b) => a - b);

  const pots: Pot[] = [];
  let previousLevel = 0;

  for (const level of levels) {
    const tierDiff = level - previousLevel;
    if (tierDiff <= 0) continue;

    let potAmount = 0;
    const eligiblePlayerIds: string[] = [];

    for (const player of players) {
      const playerContrib = contributions.find((c) => c.id === player.id)?.amount || 0;
      if (playerContrib > previousLevel) {
        const contributedAtThisTier = Math.min(tierDiff, playerContrib - previousLevel);
        potAmount += contributedAtThisTier;
      }
      if (!player.folded && playerContrib >= level) {
        eligiblePlayerIds.push(player.id);
      }
    }

    if (potAmount > 0 && eligiblePlayerIds.length > 0) {
      if (
        pots.length > 0 &&
        pots[pots.length - 1].eligiblePlayerIds.length === eligiblePlayerIds.length &&
        pots[pots.length - 1].eligiblePlayerIds.every((id, idx) => id === eligiblePlayerIds[idx])
      ) {
        pots[pots.length - 1].amount += potAmount;
      } else {
        pots.push({
          amount: potAmount,
          eligiblePlayerIds,
        });
      }
    }

    previousLevel = level;
  }

  let remainingExcess = 0;
  for (const player of players) {
    const playerContrib = contributions.find((c) => c.id === player.id)?.amount || 0;
    if (playerContrib > previousLevel) {
      remainingExcess += playerContrib - previousLevel;
    }
  }
  if (remainingExcess > 0 && pots.length > 0) {
    pots[pots.length - 1].amount += remainingExcess;
  }

  return {
    pots,
    uncalledRefunds,
  };
}

export function distributePots(
  pots: Pot[],
  players: PlayerPotInfo[],
  communityCards: Card[]
): { winners: PokerWinner[]; chipCredits: Record<string, number> } {
  const winners: PokerWinner[] = [];
  const chipCredits: Record<string, number> = {};

  const evaluatedHands: Record<string, EvaluatedHand> = {};
  for (const player of players) {
    if (!player.folded && player.pocketCards.length === 2) {
      evaluatedHands[player.id] = evaluate7Cards([...player.pocketCards, ...communityCards]);
    }
  }

  pots.forEach((pot, potIndex) => {
    if (pot.amount <= 0) return;

    const activeEligible = pot.eligiblePlayerIds
      .map((id) => players.find((p) => p.id === id))
      .filter((p): p is PlayerPotInfo => Boolean(p && !p.folded));

    if (activeEligible.length === 0) return;

    if (activeEligible.length === 1) {
      const winner = activeEligible[0];
      chipCredits[winner.id] = (chipCredits[winner.id] || 0) + pot.amount;
      winners.push({
        playerId: winner.id,
        name: winner.name,
        amount: pot.amount,
        potIndex,
        handDescription: evaluatedHands[winner.id]?.name || 'Last Player Standing',
        winningCards: evaluatedHands[winner.id]?.cards,
      });
      return;
    }

    let bestHand: EvaluatedHand | null = null;
    let potWinners: PlayerPotInfo[] = [];

    for (const player of activeEligible) {
      const hand = evaluatedHands[player.id];
      if (!hand) continue;

      if (!bestHand) {
        bestHand = hand;
        potWinners = [player];
      } else {
        const cmp = compareHands(hand, bestHand);
        if (cmp > 0) {
          bestHand = hand;
          potWinners = [player];
        } else if (cmp === 0) {
          potWinners.push(player);
        }
      }
    }

    if (potWinners.length === 0) return;

    const baseShare = Math.floor(pot.amount / potWinners.length);
    let remainder = pot.amount % potWinners.length;

    potWinners.sort((a, b) => a.seatIndex - b.seatIndex);

    for (const winner of potWinners) {
      let winShare = baseShare;
      if (remainder > 0) {
        winShare += 1;
        remainder--;
      }
      chipCredits[winner.id] = (chipCredits[winner.id] || 0) + winShare;
      winners.push({
        playerId: winner.id,
        name: winner.name,
        amount: winShare,
        potIndex,
        handDescription: bestHand!.name,
        winningCards: bestHand!.cards,
      });
    }
  });

  return { winners, chipCredits };
}
