import React, { useState } from 'react';
import { GameType, BasePlayer } from '../types/common';
import { Crown, Copy, Check, Plus, Play, ArrowLeft, Users, Shield } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface RoomLobbyProps {
  roomId: string;
  roomName: string;
  gameType: GameType;
  maxPlayers: number;
  players: BasePlayer[];
  localPlayerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onToggleReady: (ready: boolean) => void;
  onAddBot?: () => void;
  onLeaveRoom: () => void;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  roomId,
  roomName,
  gameType,
  maxPlayers,
  players,
  localPlayerId,
  isHost,
  onStartGame,
  onToggleReady,
  onAddBot,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const localPlayer = players.find((p) => p.id === localPlayerId);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    if (!localPlayer) return;
    sounds.playChipSound();
    onToggleReady(!localPlayer.isReady);
  };

  const canStart =
    isHost &&
    ((gameType === 'poker' && players.length >= 2) || (gameType === 'blackjack' && players.length >= 1));

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Lobby</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400">Invite Code:</span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/40 rounded-lg text-amber-300 font-mono font-bold text-xs hover:bg-amber-500/20 transition-all shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{roomId}</span>
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800/80 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {gameType === 'poker' ? 'Texas Hold’em' : 'Blackjack'}
              </span>
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {players.length} / {maxPlayers} Players
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-white">{roomName}</h2>
          </div>

          <div className="flex items-center gap-2">
            {isHost && gameType === 'poker' && players.length < maxPlayers && (
              <button
                onClick={onAddBot}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add AI Bot</span>
              </button>
            )}

            {!isHost && (
              <button
                onClick={handleToggleReady}
                className={`px-5 py-2 rounded-xl font-bold font-mono text-xs uppercase tracking-wider transition-all shadow-md ${
                  localPlayer?.isReady
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                }`}
              >
                {localPlayer?.isReady ? 'Ready ✓' : 'Click When Ready'}
              </button>
            )}

            {isHost && (
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black font-mono text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Start Game</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-4">
            Seated Players
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between shadow-inner"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-zinc-800 border border-amber-500/40 flex items-center justify-center font-bold font-mono text-xs text-amber-300">
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>
                    {player.isHost && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center shadow">
                        <Crown className="w-2.5 h-2.5 fill-black" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>{player.name}</span>
                      {player.id === localPlayerId && (
                        <span className="text-[10px] text-amber-400 font-mono">(You)</span>
                      )}
                      {player.isBot && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                          BOT
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-amber-400/90">
                      ${player.chips.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  {player.isReady ? (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full">
                      Waiting
                    </span>
                  )}
                </div>
              </div>
            ))}

            {Array.from({ length: Math.max(0, maxPlayers - players.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="p-3.5 rounded-xl border border-dashed border-zinc-800/80 flex items-center justify-center text-zinc-600 text-xs font-mono"
              >
                Open Seat
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
