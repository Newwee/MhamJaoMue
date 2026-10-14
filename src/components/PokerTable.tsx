import React, { useState, useEffect } from 'react';
import { PokerGameState, PokerPlayer, PokerActionType } from '../types/poker';
import { PlayingCard } from './PlayingCard';
import { ChipStack } from './ChipStack';
import { sounds } from '../audio/soundEffects';
import { ArrowLeft, Clock, History, Trophy, Plus, RefreshCw } from 'lucide-react';

interface PokerTableProps {
  state: PokerGameState;
  localPlayerId: string;
  onAction: (action: PokerActionType, amount?: number) => void;
  onNextHand: () => void;
  onLeave: () => void;
  onAddBot?: () => void;
  isHost: boolean;
}

export const PokerTable: React.FC<PokerTableProps> = ({
  state,
  localPlayerId,
  onAction,
  onNextHand,
  onLeave,
  onAddBot,
  isHost,
}) => {
  const localPlayer = state.players.find((p) => p.id === localPlayerId);
  const isMyTurn = state.turnPlayerId === localPlayerId;
  const toCall = localPlayer ? state.currentBet - localPlayer.bet : 0;
  const minRaiseTarget = state.currentBet + state.minRaise;

  const [raiseAmount, setRaiseAmount] = useState<number>(minRaiseTarget);
  const [showLog, setShowLog] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (minRaiseTarget > raiseAmount && localPlayer) {
      setRaiseAmount(Math.min(localPlayer.chips + localPlayer.bet, minRaiseTarget));
    }
  }, [minRaiseTarget, localPlayer]);

  useEffect(() => {
    if (isMyTurn) {
      sounds.playTurnAlertSound();
    }
  }, [isMyTurn]);

  useEffect(() => {
    if (!state.turnDeadline) {
      setTimeLeft(0);
      return;
    }
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((state.turnDeadline! - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 500);
    return () => clearInterval(interval);
  }, [state.turnDeadline]);

  const handleFold = () => {
    sounds.playFoldSound();
    onAction('fold');
  };

  const handleCheck = () => {
    sounds.playCheckSound();
    onAction('check');
  };

  const handleCall = () => {
    sounds.playChipSound();
    onAction('call');
  };

  const handleBetOrRaise = () => {
    sounds.playChipSound();
    if (state.currentBet === 0) {
      onAction('bet', raiseAmount);
    } else {
      onAction('raise', raiseAmount);
    }
  };

  const handleAllIn = () => {
    sounds.playChipSound();
    onAction('allin');
  };

  const totalPot = state.pots.reduce((sum, p) => sum + p.amount, 0);

  const setRaiseMultiplier = (mult: number) => {
    if (!localPlayer) return;
    const maxAffordable = localPlayer.chips + localPlayer.bet;
    const target = Math.min(maxAffordable, Math.max(minRaiseTarget, state.bigBlind * mult));
    setRaiseAmount(target);
  };

  const setRaiseToPot = () => {
    if (!localPlayer) return;
    const maxAffordable = localPlayer.chips + localPlayer.bet;
    const target = Math.min(maxAffordable, Math.max(minRaiseTarget, totalPot + state.currentBet));
    setRaiseAmount(target);
  };

  const seatedPlayers = [...state.players].sort((a, b) => a.seatIndex - b.seatIndex);
  const myIndex = seatedPlayers.findIndex((p) => p.id === localPlayerId);
  const rotatedPlayers =
    myIndex >= 0
      ? [...seatedPlayers.slice(myIndex), ...seatedPlayers.slice(0, myIndex)]
      : seatedPlayers;

  const getPositionClass = (idx: number, count: number) => {
    if (idx === 0) return 'bottom-4 left-1/2 -translate-x-1/2';
    if (count === 2) return 'top-6 left-1/2 -translate-x-1/2';
    if (count <= 4) {
      if (idx === 1) return 'top-1/2 left-4 -translate-y-1/2';
      if (idx === 2) return 'top-6 left-1/2 -translate-x-1/2';
      return 'top-1/2 right-4 -translate-y-1/2';
    }
    if (count <= 6) {
      if (idx === 1) return 'bottom-16 left-8';
      if (idx === 2) return 'top-16 left-12';
      if (idx === 3) return 'top-6 left-1/2 -translate-x-1/2';
      if (idx === 4) return 'top-16 right-12';
      return 'bottom-16 right-8';
    }
    const angle = (idx / count) * 2 * Math.PI + Math.PI / 2;
    const rx = 42;
    const ry = 36;
    const left = 50 + rx * Math.cos(angle);
    const top = 50 + ry * Math.sin(angle);
    return `left-[${left.toFixed(0)}%] top-[${top.toFixed(0)}%] -translate-x-1/2 -translate-y-1/2`;
  };

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
          {isHost && (
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

      <div className="relative flex-1 w-full max-w-6xl mx-auto flex items-center justify-center my-auto min-h-[460px] sm:min-h-[520px]">
        <div className="relative w-full h-[440px] sm:h-[500px] rounded-[180px] sm:rounded-[240px] bg-gradient-to-b from-rail-light via-rail-dark to-black p-4 sm:p-6 shadow-2xl border-4 border-rail-border flex items-center justify-center">
          <div className="relative w-full h-full rounded-[150px] sm:rounded-[210px] bg-gradient-to-b from-felt-light via-felt to-felt-darkest shadow-table-inner border-2 border-felt-bright/30 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-4 sm:inset-6 rounded-[130px] sm:rounded-[190px] border-2 border-gold/40 pointer-events-none opacity-80"></div>
            <div className="absolute inset-8 sm:inset-10 rounded-[120px] sm:rounded-[175px] border border-gold/20 pointer-events-none"></div>

            <div className="absolute top-1/4 sm:top-1/3 flex flex-col items-center pointer-events-none z-10">
              <div className="text-[10px] sm:text-xs font-serif font-black tracking-widest text-gold/40 uppercase">
                Texas Hold’em
              </div>
              <div className="flex items-center gap-2 mt-1 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-gold/40 shadow-lg">
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Pot</span>
                <span className="font-mono font-black text-sm sm:text-lg text-amber-300">
                  ${totalPot.toLocaleString()}
                </span>
              </div>
              {state.pots.length > 1 && (
                <div className="flex gap-1.5 mt-1">
                  {state.pots.map((pot, pIdx) => (
                    <span
                      key={pIdx}
                      className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-300"
                    >
                      {pIdx === 0 ? 'Main' : `Side ${pIdx}`}: ${pot.amount}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 z-10 mt-6 sm:mt-10">
              {state.communityCards.map((card, idx) => (
                <div key={idx} className="animate-deal-card">
                  <PlayingCard card={card} size="md" />
                </div>
              ))}
              {Array.from({ length: 5 - state.communityCards.length }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="w-14 h-20 sm:w-16 sm:h-24 rounded-md border-2 border-dashed border-gold/20 bg-black/10 flex items-center justify-center"
                >
                  <span className="text-[10px] font-mono text-gold/20">♠</span>
                </div>
              ))}
            </div>

            {state.winners.length > 0 && (
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md py-4 px-6 rounded-2xl border-2 border-amber-400 shadow-2xl animate-in zoom-in-95">
                <Trophy className="w-8 h-8 text-amber-400 animate-bounce mb-1" />
                <h3 className="font-serif font-black text-lg sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200">
                  {state.winners.map((w) => w.name).join(' & ')} Wins!
                </h3>
                <p className="font-mono font-bold text-amber-300 text-sm mt-0.5">
                  +${state.winners.reduce((s, w) => s + w.amount, 0).toLocaleString()} • {state.winners[0]?.handDescription}
                </p>
                <button
                  onClick={onNextHand}
                  className="mt-3 px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black font-mono text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Next Hand</span>
                </button>
              </div>
            )}
          </div>

          {rotatedPlayers.map((player, idx) => {
            const isTurn = state.turnPlayerId === player.id;
            const isLocal = player.id === localPlayerId;
            const isDealer = state.players[state.dealerIndex]?.id === player.id;
            const isSB =
              state.players.length === 2
                ? isDealer
                : state.players[(state.dealerIndex + 1) % state.players.length]?.id === player.id;
            const isBB =
              state.players.length === 2
                ? !isDealer
                : state.players[(state.dealerIndex + 2) % state.players.length]?.id === player.id;

            return (
              <div
                key={player.id}
                className={`absolute ${getPositionClass(idx, rotatedPlayers.length)} z-20 flex flex-col items-center transition-all duration-300`}
              >
                {player.bet > 0 && (
                  <div className="mb-1 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-gold/40 shadow-md">
                    <ChipStack amount={player.bet} size="sm" />
                  </div>
                )}

                <div className="relative flex flex-col items-center">
                  <div
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 transition-all ${
                      isTurn
                        ? 'ring-4 ring-amber-400 shadow-[0_0_20px_rgba(234,179,8,0.8)] scale-105'
                        : 'border-2 border-zinc-700 bg-zinc-900'
                    } ${player.folded ? 'opacity-40 grayscale' : ''}`}
                  >
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-950 flex items-center justify-center font-black font-mono text-amber-300 text-xs sm:text-sm">
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>

                    {isDealer && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-black font-black font-mono text-[10px] flex items-center justify-center border border-white shadow">
                        D
                      </div>
                    )}
                    {isSB && !isDealer && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white font-black font-mono text-[9px] flex items-center justify-center border border-white shadow">
                        SB
                      </div>
                    )}
                    {isBB && (
                      <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-purple-500 text-white font-black font-mono text-[9px] flex items-center justify-center border border-white shadow">
                        BB
                      </div>
                    )}
                  </div>

                  <div className="mt-1 flex flex-col items-center bg-zinc-950/90 backdrop-blur-md border border-zinc-800 px-2.5 py-0.5 rounded-lg shadow-md max-w-[110px] text-center">
                    <span className="text-[11px] font-bold text-white truncate w-full">
                      {player.name} {isLocal && '(You)'}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-400">
                      ${player.chips.toLocaleString()}
                    </span>
                    {player.isAllIn && (
                      <span className="text-[9px] font-mono font-bold text-red-400 uppercase">
                        All-in
                      </span>
                    )}
                    {player.folded && (
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">Folded</span>
                    )}
                  </div>

                  {player.pocketCards.length > 0 && !player.folded && (
                    <div className="flex gap-1 -mt-2 z-10">
                      {player.pocketCards.map((c, cIdx) => (
                        <PlayingCard
                          key={cIdx}
                          card={c}
                          size="sm"
                          highlight={Boolean(player.handRankDescription)}
                        />
                      ))}
                    </div>
                  )}

                  {player.handRankDescription && (
                    <div className="mt-1 bg-amber-500 text-black font-black font-mono text-[9px] px-2 py-0.5 rounded-full shadow-lg">
                      {player.handRankDescription}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto z-30 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 p-3 sm:p-4 rounded-2xl shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isMyTurn && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs animate-pulse">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Your Turn ({timeLeft}s)</span>
              </div>
            )}
            {localPlayer?.handRankDescription && (
              <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl">
                Current Hand: {localPlayer.handRankDescription}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            <button
              onClick={handleFold}
              disabled={!isMyTurn}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-700/60 text-red-200 font-bold font-mono text-xs uppercase transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-md"
            >
              Fold
            </button>

            {toCall === 0 ? (
              <button
                onClick={handleCheck}
                disabled={!isMyTurn}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-600/60 text-blue-200 font-bold font-mono text-xs uppercase transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-md"
              >
                Check
              </button>
            ) : (
              <button
                onClick={handleCall}
                disabled={!isMyTurn}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-600/60 text-blue-200 font-bold font-mono text-xs uppercase transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-md"
              >
                Call ${Math.min(localPlayer?.chips || 0, toCall)}
              </button>
            )}

            <div className="flex items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setRaiseMultiplier(2)}
                  disabled={!isMyTurn}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-300 rounded border border-zinc-700 disabled:opacity-40"
                >
                  2x
                </button>
                <button
                  type="button"
                  onClick={() => setRaiseMultiplier(3)}
                  disabled={!isMyTurn}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-300 rounded border border-zinc-700 disabled:opacity-40"
                >
                  3x
                </button>
                <button
                  type="button"
                  onClick={setRaiseToPot}
                  disabled={!isMyTurn}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-300 rounded border border-zinc-700 disabled:opacity-40"
                >
                  Pot
                </button>
              </div>

              <input
                type="range"
                min={minRaiseTarget}
                max={(localPlayer?.chips || 0) + (localPlayer?.bet || 0)}
                step={state.bigBlind}
                value={raiseAmount}
                onChange={(e) => setRaiseAmount(Number(e.target.value))}
                disabled={!isMyTurn}
                className="w-24 sm:w-32 accent-amber-500 cursor-pointer disabled:opacity-40"
              />

              <button
                onClick={handleBetOrRaise}
                disabled={!isMyTurn || (localPlayer?.chips || 0) <= toCall}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold font-mono text-xs uppercase transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-md"
              >
                {state.currentBet === 0 ? 'Bet' : 'Raise'} ${raiseAmount}
              </button>

              <button
                onClick={handleAllIn}
                disabled={!isMyTurn}
                className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-black font-mono text-xs uppercase transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-md"
              >
                All-in
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLog && (
        <div className="fixed bottom-24 right-4 z-40 w-80 max-h-72 bg-zinc-950/95 border border-zinc-800 rounded-xl p-3 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase">Hand Log</span>
            <button
              onClick={() => setShowLog(false)}
              className="text-zinc-500 hover:text-white text-xs"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 text-[11px] font-mono text-zinc-300">
            {state.actionLog.slice(-20).map((log, idx) => (
              <div key={idx} className="leading-snug">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
