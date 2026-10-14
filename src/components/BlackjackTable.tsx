import React, { useState } from 'react';
import {
  BlackjackGameState,
  BlackjackActionType,
} from '../types/blackjack';
import { PlayingCard } from './PlayingCard';
import { ChipStack } from './ChipStack';
import { calculateHandValue, canDoubleHand, canSplitHand } from '../../server/blackjack/blackjackLogic';
import { sounds } from '../audio/soundEffects';
import { ArrowLeft, Play, Plus, RefreshCw, Trophy } from 'lucide-react';

interface BlackjackTableProps {
  state: BlackjackGameState;
  localPlayerId: string;
  onAction: (action: BlackjackActionType) => void;
  onPlaceBet: (amount: number) => void;
  onNextHand: () => void;
  onLeave: () => void;
}

export const BlackjackTable: React.FC<BlackjackTableProps> = ({
  state,
  localPlayerId,
  onAction,
  onPlaceBet,
  onNextHand,
  onLeave,
}) => {
  const localPlayer = state.players.find((p) => p.id === localPlayerId);
  const isMyTurn = state.currentTurnPlayerId === localPlayerId;
  const currentHand =
    localPlayer && localPlayer.hands.length > state.currentTurnHandIndex
      ? localPlayer.hands[state.currentTurnHandIndex]
      : null;

  const [selectedChipBet, setSelectedChipBet] = useState<number>(100);

  const chipOptions = [25, 50, 100, 250, 500, 1000];

  const handleHit = () => {
    sounds.playCardDealSound();
    onAction('hit');
  };

  const handleStand = () => {
    sounds.playCheckSound();
    onAction('stand');
  };

  const handleDouble = () => {
    sounds.playChipSound();
    onAction('double');
  };

  const handleSplit = () => {
    sounds.playChipSound();
    onAction('split');
  };

  const handlePlaceBet = () => {
    sounds.playChipSound();
    onPlaceBet(selectedChipBet);
  };

  const dealerScore = state.dealerScore;

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-zinc-950 p-2 sm:p-4 select-none overflow-hidden">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto mb-2 z-20">
        <button
          onClick={onLeave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Lobby</span>
        </button>

        <div className="text-xs font-mono text-zinc-400">
          Min Bet: ${state.minBet} • Max Bet: ${state.maxBet}
        </div>
      </div>

      <div className="relative flex-1 w-full max-w-5xl mx-auto flex items-center justify-center my-auto min-h-[500px]">
        <div className="relative w-full h-[480px] sm:h-[540px] rounded-b-[240px] sm:rounded-b-[300px] bg-gradient-to-b from-rail-light via-rail-dark to-black p-4 sm:p-6 shadow-2xl border-4 border-rail-border flex flex-col items-center">
          <div className="relative w-full h-full rounded-b-[210px] sm:rounded-b-[270px] bg-gradient-to-b from-felt-light via-felt to-felt-darkest shadow-table-inner border-2 border-felt-bright/30 flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden">
            <div className="absolute top-28 sm:top-36 inset-x-8 h-44 rounded-full border border-red-500/30 pointer-events-none flex items-start justify-center pt-2">
              <span className="text-[10px] sm:text-xs font-serif font-black tracking-widest text-red-500/70 uppercase text-center px-4">
                BLACKJACK PAYS 3 TO 2 • DEALER MUST STAND ON 17 AND MUST DRAW TO 16
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center mt-2">
              <div className="text-[10px] sm:text-xs font-serif font-bold text-amber-200/80 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span>Dealer Hand</span>
                {state.dealerCards.length > 0 && (
                  <span className="font-mono bg-black/60 px-2 py-0.5 rounded text-amber-400 border border-amber-500/30">
                    {dealerScore}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {state.dealerCards.length > 0 ? (
                  state.dealerCards.map((card, idx) => (
                    <div key={idx} className="animate-deal-card">
                      <PlayingCard card={card} size="md" />
                    </div>
                  ))
                ) : (
                  <div className="flex gap-2">
                    <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-md border-2 border-dashed border-gold/20 bg-black/10 flex items-center justify-center">
                      <span className="text-gold/20 text-xs">♠</span>
                    </div>
                    <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-md border-2 border-dashed border-gold/20 bg-black/10 flex items-center justify-center">
                      <span className="text-gold/20 text-xs">♠</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative z-10 w-full flex justify-around items-end mb-6 sm:mb-8 px-4">
              {state.players.map((player) => {
                const isLocal = player.id === localPlayerId;
                const isPlayerTurn = state.currentTurnPlayerId === player.id;

                return (
                  <div key={player.id} className="flex flex-col items-center">
                    <div className="flex gap-4 mb-2">
                      {player.hands.map((hand, hIdx) => {
                        const handScore = calculateHandValue(hand.cards);
                        const isCurrentHandTurn = isPlayerTurn && state.currentTurnHandIndex === hIdx;

                        return (
                          <div
                            key={hIdx}
                            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                              isCurrentHandTurn
                                ? 'bg-amber-400/10 border border-amber-400 ring-2 ring-amber-400/50'
                                : ''
                            }`}
                          >
                            <div className="flex -space-x-8 sm:-space-x-10 mb-1">
                              {hand.cards.map((c, cIdx) => (
                                <div key={cIdx} className="animate-deal-card">
                                  <PlayingCard card={c} size="md" />
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-1 mt-1">
                              <span className="font-mono font-bold text-xs bg-black/70 px-2 py-0.5 rounded text-white border border-zinc-700">
                                {handScore.total}
                              </span>
                              {hand.isBlackjack && (
                                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500 text-black shadow">
                                  BJ!
                                </span>
                              )}
                              {hand.isBusted && (
                                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-red-600 text-white shadow">
                                  BUST
                                </span>
                              )}
                              {hand.payoutResult === 'win' && (
                                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500 text-black shadow">
                                  WIN
                                </span>
                              )}
                              {hand.payoutResult === 'push' && (
                                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500 text-white shadow">
                                  PUSH
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="relative w-24 h-16 sm:w-28 sm:h-20 border-2 border-gold/70 rounded-lg bg-black/25 flex flex-col items-center justify-center shadow-inner">
                      <span className="text-[9px] font-mono font-bold text-gold/60 uppercase mb-0.5">
                        Bet Box
                      </span>
                      {player.hasPlacedBet ? (
                        <ChipStack amount={player.currentBet} size="sm" />
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-500">Empty</span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-col items-center">
                      <span className="text-xs font-bold text-white">
                        {player.name} {isLocal && '(You)'}
                      </span>
                      <span className="text-[11px] font-mono text-amber-400">
                        ${player.chips.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto z-30 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 p-3 sm:p-4 rounded-2xl shadow-2xl">
        {state.phase === 'betting' ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
                Choose Wager:
              </span>
              <div className="flex gap-1.5 overflow-x-auto py-1">
                {chipOptions.map((chipVal) => (
                  <button
                    key={chipVal}
                    onClick={() => setSelectedChipBet(chipVal)}
                    className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs transition-all ${
                      selectedChipBet === chipVal
                        ? 'border-amber-400 bg-amber-500 text-black shadow-lg scale-105'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                    }`}
                  >
                    ${chipVal}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePlaceBet}
              disabled={localPlayer ? localPlayer.chips < selectedChipBet : false}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black font-mono text-sm uppercase tracking-wider transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shadow-lg flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Deal Hand (${selectedChipBet})</span>
            </button>
          </div>
        ) : state.phase === 'ended' || state.phase === 'payout' ? (
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-amber-300">Round completed.</div>
            <button
              onClick={onNextHand}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black font-mono text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Play Next Round</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-mono font-bold text-amber-400">
              {isMyTurn ? 'Your Turn to Action' : 'Waiting for other players / Dealer...'}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleHit}
                disabled={!isMyTurn}
                className="px-5 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-200 font-bold font-mono text-xs uppercase transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-md"
              >
                Hit
              </button>

              <button
                onClick={handleStand}
                disabled={!isMyTurn}
                className="px-5 py-2.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-600/60 text-red-200 font-bold font-mono text-xs uppercase transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-md"
              >
                Stand
              </button>

              <button
                onClick={handleDouble}
                disabled={
                  !isMyTurn ||
                  !currentHand ||
                  !canDoubleHand(currentHand) ||
                  (localPlayer?.chips || 0) < currentHand.bet
                }
                className="px-4 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-600/60 text-blue-200 font-bold font-mono text-xs uppercase transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-md"
              >
                Double
              </button>

              <button
                onClick={handleSplit}
                disabled={
                  !isMyTurn ||
                  !currentHand ||
                  !canSplitHand(currentHand) ||
                  (localPlayer?.chips || 0) < currentHand.bet
                }
                className="px-4 py-2.5 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-600/60 text-amber-200 font-bold font-mono text-xs uppercase transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-md"
              >
                Split
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
