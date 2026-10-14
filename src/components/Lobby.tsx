import React, { useState } from 'react';
import { GameType, RoomSummary } from '../types/common';
import { Users, Bot, Plus, ArrowRight, Play, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface LobbyProps {
  onStartSinglePlayer: (gameType: GameType) => void;
  onCreateRoom: (gameType: GameType, name?: string, maxPlayers?: number) => void;
  onJoinRoom: (roomId: string) => void;
  rooms: RoomSummary[];
  onRefreshRooms: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onStartSinglePlayer,
  onCreateRoom,
  onJoinRoom,
  rooms,
  onRefreshRooms,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalGameType, setModalGameType] = useState<GameType>('poker');
  const [modalRoomName, setModalRoomName] = useState('');
  const [modalMaxPlayers, setModalMaxPlayers] = useState(6);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    sounds.playChipSound();
    onJoinRoom(joinCode.trim().toUpperCase());
  };

  const handleOpenCreate = (type: GameType) => {
    setModalGameType(type);
    setModalMaxPlayers(type === 'poker' ? 6 : 5);
    setModalRoomName('');
    setShowCreateModal(true);
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playChipSound();
    onCreateRoom(modalGameType, modalRoomName.trim() || undefined, modalMaxPlayers);
    setShowCreateModal(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in">
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-felt/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Online Card Arena</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-white leading-tight">
            High Stakes Poker & Classic Blackjack
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-sans">
            Play solo against smart game bots or create private tables to invite friends across computers, phones, and tablets over the internet.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="ENTER 6-DIGIT CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="bg-zinc-900/90 border border-zinc-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono tracking-widest text-white placeholder:text-zinc-600 focus:outline-none w-44 sm:w-52"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-bold text-xs uppercase transition-colors"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group relative rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-xl hover:border-felt-bright/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-felt-darkest border border-felt/40 flex items-center justify-center text-felt-bright font-black font-mono text-xl shadow-md">
                ♠♥
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400">
                2 - 8 Players
              </span>
            </div>
            <h3 className="text-2xl font-serif font-black text-white mb-2">Texas Hold’em</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
              Classic Texas Hold’em with deep green oval table, blinds, side pots, all-in showdowns, and authentic hand ranking logic.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800/80">
            <button
              onClick={() => onStartSinglePlayer('poker')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold font-mono text-xs uppercase tracking-wider transition-all"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Vs AI Bots</span>
            </button>
            <button
              onClick={() => handleOpenCreate('poker')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black font-mono text-xs uppercase tracking-wider shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Room</span>
            </button>
          </div>
        </div>

        <div className="group relative rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-xl hover:border-amber-500/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-600/40 flex items-center justify-center text-amber-400 font-black font-mono text-xl shadow-md">
                21
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400">
                1 - 5 Players
              </span>
            </div>
            <h3 className="text-2xl font-serif font-black text-white mb-2">Blackjack</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
              Semicircular green felt with yellow betting boxes. Play against the Dealer with Hit, Stand, Double Down, and Split pairs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800/80">
            <button
              onClick={() => onStartSinglePlayer('blackjack')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold font-mono text-xs uppercase tracking-wider transition-all"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Solo Play</span>
            </button>
            <button
              onClick={() => handleOpenCreate('blackjack')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black font-mono text-xs uppercase tracking-wider shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Table</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-serif font-bold text-white">
              Active Multiplayer Tables
            </h3>
          </div>
          <button
            onClick={onRefreshRooms}
            className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-zinc-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm font-sans">
            No live public rooms at the moment. Create a room above and share your code!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                      {room.gameType}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      {room.playerCount} / {room.maxPlayers}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white truncate mb-1">{room.name}</h4>
                  <div className="text-xs text-zinc-500">Host: {room.hostName}</div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-800/80">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400">
                    CODE: {room.id}
                  </span>
                  <button
                    onClick={() => {
                      sounds.playChipSound();
                      onJoinRoom(room.id);
                    }}
                    disabled={room.playerCount >= room.maxPlayers}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs transition-colors disabled:opacity-40"
                  >
                    {room.playerCount >= room.maxPlayers ? 'Full' : 'Join'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-serif font-bold text-white mb-4">
              Create {modalGameType === 'poker' ? 'Poker' : 'Blackjack'} Room
            </h3>

            <form onSubmit={handleConfirmCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Table Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vegas High Rollers"
                  value={modalRoomName}
                  onChange={(e) => setModalRoomName(e.target.value)}
                  maxLength={24}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Max Players ({modalMaxPlayers})
                </label>
                <input
                  type="range"
                  min={modalGameType === 'poker' ? 2 : 1}
                  max={modalGameType === 'poker' ? 8 : 5}
                  value={modalMaxPlayers}
                  onChange={(e) => setModalMaxPlayers(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black font-mono text-xs uppercase shadow-md"
                >
                  Create & Host
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
