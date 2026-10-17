import React, { useState, useEffect, useRef } from 'react';
import {
  BlackjackGameState,
  BlackjackActionType,
} from '../types/blackjack';
import { PlayingCard } from './PlayingCard';
import { ChipStack } from './ChipStack';
import { calculateHandValue, canDoubleHand, canSplitHand } from '../../server/blackjack/blackjackLogic';
import { sounds } from '../audio/soundEffects';
import { ArrowLeft, Play, Plus, RefreshCw, Trophy, History, Palette, Sparkles, RotateCcw } from 'lucide-react';

interface BlackjackTableProps {
  state: BlackjackGameState;
  localPlayerId: string;
  onAction: (action: BlackjackActionType) => void;
  onPlaceBet: (amount: number, pairBet?: number) => void;
  onNextHand: () => void;
  onLeave: () => void;
  onAddBot?: () => void;
  isHost?: boolean;
}

export const BlackjackTable: React.FC<BlackjackTableProps> = ({
  state,
  localPlayerId,
  onAction,
  onPlaceBet,
  onNextHand,
  onLeave,
  onAddBot,
  isHost = false,
}) => {
  const localPlayer = state.players.find((p) => p.id === localPlayerId);
  const isMyTurn = state.currentTurnPlayerId === localPlayerId;
  const currentHand =
    localPlayer && localPlayer.hands.length > state.currentTurnHandIndex
      ? localPlayer.hands[state.currentTurnHandIndex]
      : null;

  const [tableTheme, setTableTheme] = useState<'red' | 'green'>('red');
  const [selectedChipBet, setSelectedChipBet] = useState<number>(100);
  const [mainBet, setMainBet] = useState<number>(localPlayer?.currentBet || 100);
  const [pairBet, setPairBet] = useState<number>(0);
  const [betTarget, setBetTarget] = useState<'main' | 'pair'>('main');
  const [showLog, setShowLog] = useState<boolean>(false);

  const prevPhaseRef = useRef(state.phase);
  useEffect(() => {
    if (state.phase === 'dealer_turn' && prevPhaseRef.current !== 'dealer_turn') {
      sounds.playCardPeelSound();
    }
    if (state.phase === 'betting' && prevPhaseRef.current !== 'betting') {
      setMainBet(localPlayer?.currentBet || 100);
      setPairBet(0);
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase, localPlayer?.currentBet]);

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
    onPlaceBet(mainBet, pairBet);
  };

  const addChipToTarget = (val: number) => {
    sounds.playChipSound();
    const availableChips = localPlayer?.chips || 0;
    if (betTarget === 'main') {
      const nextMain = Math.min(availableChips - pairBet, mainBet + val);
      if (nextMain >= state.minBet && nextMain <= state.maxBet) {
        setMainBet(nextMain);
      }
    } else {
      const nextPair = Math.min(availableChips - mainBet, pairBet + val);
      if (nextPair >= 0 && nextPair <= state.maxBet) {
        setPairBet(nextPair);
      }
    }
  };

  const clearBets = () => {
    setMainBet(state.minBet);
    setPairBet(0);
  };

  const doubleBets = () => {
    sounds.playChipSound();
    const availableChips = localPlayer?.chips || 0;
    const nextMain = Math.min(state.maxBet, mainBet * 2);
    const nextPair = Math.min(state.maxBet, pairBet * 2);
    if (nextMain + nextPair <= availableChips) {
      setMainBet(nextMain);
      setPairBet(nextPair);
    }
  };

  const dealerScore = state.dealerScore;
  const isRed = tableTheme === 'red';

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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTableTheme(isRed ? 'green' : 'red')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
              isRed
                ? 'bg-red-950/80 border-red-700/70 text-red-300 hover:bg-red-900'
                : 'bg-emerald-950/80 border-emerald-700/70 text-emerald-300 hover:bg-emerald-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{isRed ? '🔴 Venetian Red' : '🟢 Classic Green'}</span>
          </button>

          {isHost && onAddBot && (
            <button
              onClick={onAddBot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-xs font-bold text-emerald-300 hover:bg-emerald-900 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bot</span>
            </button>
          )}

          <button
            onClick={() => setShowLog(!showLog)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>Action Log</span>
          </button>
        </div>
      </div>

      <div className="relative flex-1 w-full max-w-5xl mx-auto flex items-center justify-center my-auto min-h-[500px]">
        <div className="relative w-full h-[500px] sm:h-[560px] rounded-b-[240px] sm:rounded-b-[300px] bg-gradient-to-b from-zinc-800 via-zinc-950 to-black p-3 sm:p-5 shadow-2xl border-4 border-yellow-900/40 flex flex-col items-center">
          <div
            className={`relative w-full h-full rounded-b-[210px] sm:rounded-b-[270px] shadow-table-inner border-2 flex flex-col items-center justify-between p-3 sm:p-5 overflow-hidden transition-all duration-700 ${
              isRed
                ? 'bg-gradient-to-b from-felt-red-light via-felt-red to-felt-red-darkest border-red-500/30'
                : 'bg-gradient-to-b from-felt-light via-felt to-felt-darkest border-felt-bright/30'
            }`}
          >
            <div className="absolute top-0 inset-x-0 flex justify-center z-20 pointer-events-none">
              <div className="flex items-center gap-1 px-4 py-1 bg-gradient-to-b from-zinc-700 via-zinc-850 to-zinc-950 border-b-2 border-x-2 border-zinc-700 rounded-b-xl shadow-2xl">
                <div className="flex gap-1.5 px-2 py-0.5 bg-black/60 rounded-md border border-zinc-700/60 shadow-inner">
                  {['#9333ea', '#18181b', '#16a34a', '#ea580c', '#dc2626', '#eab308'].map((color, cIdx) => (
                    <div
                      key={cIdx}
                      className="w-4 sm:w-5 h-6 sm:h-7 rounded-sm border border-white/20 shadow-sm flex flex-col justify-between py-0.5 items-center"
                      style={{ backgroundColor: color }}
                    >
                      <div className="w-2.5 h-0.5 bg-white/40 rounded-full"></div>
                      <div className="w-2.5 h-0.5 bg-white/40 rounded-full"></div>
                      <div className="w-2.5 h-0.5 bg-white/40 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute top-3 right-4 sm:right-10 z-20 flex flex-col items-center pointer-events-none">
              <div className="w-14 sm:w-16 h-20 sm:h-24 bg-gradient-to-br from-zinc-800 via-black to-zinc-900 border-2 border-zinc-700 rounded-lg shadow-2xl flex flex-col items-center justify-between p-1.5 -rotate-12 transform">
                <div className="w-full h-1 bg-amber-400/50 rounded-full"></div>
                <div className="w-10 h-13 bg-red-950 border border-amber-500/60 rounded flex items-center justify-center shadow">
                  <span className="text-[10px] font-mono text-amber-300 font-bold">888</span>
                </div>
                <span className="text-[7px] font-mono text-zinc-400 font-bold tracking-widest uppercase">SHOE</span>
              </div>
            </div>

            <div className="absolute top-16 sm:top-20 text-[9px] sm:text-[11px] font-serif font-black tracking-[0.25em] text-yellow-300/40 uppercase pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              EMHAM888 KING VIP SALON
            </div>

            <div className="absolute top-24 sm:top-28 inset-x-6 sm:inset-x-12 h-44 rounded-full border border-white/20 pointer-events-none flex items-start justify-center pt-2">
              <span className="text-[9px] sm:text-xs font-serif font-black tracking-widest text-white/80 uppercase text-center px-4 drop-shadow">
                INSURANCE • PAYS • 2 • TO • 1
              </span>
            </div>

            <div className="absolute top-34 sm:top-38 text-[8px] sm:text-[10px] font-serif font-bold tracking-wider text-yellow-400/60 uppercase pointer-events-none text-center">
              BLACKJACK PAYS 3 TO 2 • DEALER MUST STAND ON 17 AND MUST DRAW TO 16
            </div>

            <div className="relative z-10 flex flex-col items-center mt-7 sm:mt-8">
              <div className="text-[10px] sm:text-xs font-serif font-bold text-amber-200/90 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span>Dealer Hand</span>
                {state.dealerCards.length > 0 && (
                  <span className="font-mono bg-black/70 px-2 py-0.5 rounded text-amber-400 border border-amber-500/30">
                    {dealerScore}
                  </span>
                )}
                {state.dealerPeeking && (
                  <span className="text-[9px] font-mono text-yellow-300 animate-pulse bg-yellow-950/80 px-2 py-0.5 rounded border border-yellow-500/40">
                    Peeking Hole Card...
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {state.dealerCards.length > 0 ? (
                  state.dealerCards.map((card, idx) => (
                    <div
                      key={idx}
                      className={`${idx === 0 ? 'animate-deal-shoe' : ''} ${
                        card.hidden && state.dealerPeeking ? 'animate-dealer-peek' : ''
                      }`}
                    >
                      <PlayingCard
                        card={card}
                        size="md"
                        isPeeling={Boolean(card.hidden && (state.phase === 'player_turns' || state.phase === 'dealer_turn'))}
                        dealerSqueeze={idx === 1 && !card.hidden && (state.phase === 'dealer_turn' || state.phase === 'payout' || state.phase === 'ended')}
                        animateDeal={idx !== 1}
                      />
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

            <div className="relative z-10 w-full flex justify-around items-end mb-4 sm:mb-6 px-2 sm:px-4">
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
                            className={`flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all ${
                              isCurrentHandTurn
                                ? 'bg-amber-400/10 border border-amber-400 ring-2 ring-amber-400/50'
                                : ''
                            }`}
                          >
                            <div className="relative h-22 sm:h-26 w-28 sm:w-34 mb-1">
                              {hand.cards.map((c, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="absolute top-0 left-0 animate-deal-shoe transition-all duration-300"
                                  style={{
                                    transform: `translateX(${cIdx * 20}px) translateY(${cIdx * 6}px) rotate(${cIdx * 2.5}deg)`,
                                    zIndex: cIdx + 1,
                                  }}
                                >
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
                                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500 text-black shadow flex items-center gap-1">
                                  WIN +${hand.payoutAmount || 0}
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

                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        onClick={() => isLocal && state.phase === 'betting' && setBetTarget('main')}
                        className={`relative w-22 h-15 sm:w-26 sm:h-18 border-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                          isLocal && state.phase === 'betting' && betTarget === 'main'
                            ? 'border-yellow-400 bg-yellow-400/20 ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] cursor-pointer'
                            : 'border-yellow-400/80 bg-black/45'
                        }`}
                      >
                        <span className="text-[8px] font-mono font-bold text-yellow-300 uppercase tracking-wider mb-0.5">
                          WAGER
                        </span>
                        {player.hasPlacedBet ? (
                          <div className="relative">
                            <ChipStack amount={player.currentBet} size="sm" />
                            {state.phase === 'ended' &&
                              player.hands.some(
                                (h) => h.payoutResult === 'win' || h.payoutResult === 'blackjack'
                              ) && (
                                <div className="absolute -top-7 -right-5 animate-chip-payout z-20">
                                  <ChipStack
                                    amount={player.hands.reduce(
                                      (sum, h) => sum + (h.payoutAmount || 0),
                                      0
                                    )}
                                    size="sm"
                                  />
                                </div>
                              )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-yellow-300">
                            {isLocal ? `$${mainBet}` : 'Empty'}
                          </span>
                        )}
                      </div>

                      <div
                        onClick={() => isLocal && state.phase === 'betting' && setBetTarget('pair')}
                        className={`relative w-13 h-13 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center transition-all ${
                          isLocal && state.phase === 'betting' && betTarget === 'pair'
                            ? 'border-yellow-400 bg-yellow-400/20 ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] cursor-pointer'
                            : 'border-yellow-400/80 bg-black/45'
                        }`}
                      >
                        <span className="text-[9px] sm:text-[10px] font-serif font-black text-yellow-300 tracking-wider">
                          PAIR
                        </span>
                        <span className="text-[7px] font-mono text-yellow-400/80 leading-none">
                          11:1
                        </span>

                        {player.hasPlacedBet && (player.pairBet || 0) > 0 ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                            <ChipStack amount={player.pairBet || 0} size="sm" />
                            {player.pairWon && (
                              <div className="absolute -top-6 -right-4 animate-chip-payout z-20">
                                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black font-black font-mono text-[8px] shadow-lg whitespace-nowrap">
                                  +${player.pairPayout}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : isLocal && pairBet > 0 ? (
                          <span className="absolute bottom-1 text-[8px] font-mono font-bold text-amber-300">
                            ${pairBet}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-1.5 flex flex-col items-center">
                      <span className="text-xs font-bold text-white">
                        {player.name} {isLocal && '(You)'}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-amber-400">
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
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
                  Wager:
                </span>
                <div className="flex gap-1 overflow-x-auto py-1">
                  {chipOptions.map((chipVal) => (
                    <button
                      key={chipVal}
                      onClick={() => {
                        setSelectedChipBet(chipVal);
                        addChipToTarget(chipVal);
                      }}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg border font-mono font-bold text-xs transition-all active:scale-95 ${
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

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBetTarget('main')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                    betTarget === 'main'
                      ? 'border-yellow-400 bg-yellow-500 text-black shadow'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-300'
                  }`}
                >
                  Main (${mainBet})
                </button>
                <button
                  type="button"
                  onClick={() => setBetTarget('pair')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                    betTarget === 'pair'
                      ? 'border-yellow-400 bg-yellow-500 text-black shadow'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-300'
                  }`}
                >
                  Pair (${pairBet})
                </button>
                <button
                  type="button"
                  onClick={doubleBets}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-bold text-zinc-300"
                >
                  2x
                </button>
                <button
                  type="button"
                  onClick={clearBets}
                  className="px-2.5 py-1.5 rounded-lg border border-red-800/60 bg-red-950/60 hover:bg-red-900 text-xs font-mono font-bold text-red-300"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2">
              <div className="text-xs font-mono text-zinc-400">
                Total Bet: <span className="font-bold text-amber-300">${mainBet + pairBet}</span>
              </div>
              <button
                onClick={handlePlaceBet}
                disabled={localPlayer ? localPlayer.chips < mainBet + pairBet : false}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black font-mono text-sm uppercase tracking-wider transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Deal Hand (${mainBet + pairBet})</span>
              </button>
            </div>
          </div>
        ) : state.phase === 'ended' || state.phase === 'payout' ? (
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-amber-300 font-bold">
              Round completed. Check winnings above!
            </div>
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

      {showLog && (
        <div className="fixed inset-y-0 right-0 w-80 bg-zinc-950/95 border-l border-zinc-800 p-4 z-50 flex flex-col shadow-2xl backdrop-blur-md animate-in slide-in-from-right">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="font-serif font-bold text-amber-400 text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Dealer & Action Log</span>
            </h3>
            <button
              onClick={() => setShowLog(false)}
              className="text-zinc-400 hover:text-white text-xs px-2 py-1"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-3 space-y-1.5 font-mono text-[11px] text-zinc-300">
            {state.actionLog.map((log, idx) => (
              <div key={idx} className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800/60">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
