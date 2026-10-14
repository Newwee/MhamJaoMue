import React, { useState } from 'react';
import { X, BarChart2, User, Coins, Check } from 'lucide-react';
import { getOrCreateProfile, saveProfile, StoredProfile } from '../utils/playerStorage';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: (updated: StoredProfile) => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdate,
}) => {
  const [profile, setLocalProfile] = useState<StoredProfile>(getOrCreateProfile());
  const [editName, setEditName] = useState(profile.name);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    const updated = { ...profile, name: editName.trim() };
    saveProfile(updated);
    setLocalProfile(updated);
    onProfileUpdate(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const pokerWinRate =
    profile.stats.pokerHands > 0
      ? ((profile.stats.pokerWins / profile.stats.pokerHands) * 100).toFixed(1)
      : '0.0';

  const bjWinRate =
    profile.stats.bjHands > 0
      ? ((profile.stats.bjWins / profile.stats.bjHands) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-serif font-bold text-amber-200">Player Profile & Statistics</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5">
                <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center font-black font-mono text-amber-300">
                  {profile.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <form onSubmit={handleSaveName} className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={16}
                  className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-3">
                Texas Hold’em Poker
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="text-xs text-zinc-400">Hands</div>
                  <div className="text-base font-mono font-bold text-white">
                    {profile.stats.pokerHands}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="text-xs text-zinc-400">Wins</div>
                  <div className="text-base font-mono font-bold text-emerald-400">
                    {profile.stats.pokerWins}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="text-xs text-zinc-400">Win Rate</div>
                  <div className="text-base font-mono font-bold text-amber-400">
                    {pokerWinRate}%
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-3">
                Blackjack
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="text-xs text-zinc-400">Hands</div>
                  <div className="text-base font-mono font-bold text-white">
                    {profile.stats.bjHands}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="text-xs text-zinc-400">Wins</div>
                  <div className="text-base font-mono font-bold text-emerald-400">
                    {profile.stats.bjWins}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="text-xs text-zinc-400">Blackjacks</div>
                  <div className="text-base font-mono font-bold text-amber-400">
                    {profile.stats.bjBlackjacks}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
