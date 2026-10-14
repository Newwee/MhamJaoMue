import React, { useState } from 'react';
import { Volume2, VolumeX, BookOpen, BarChart2, Coins, Crown, Wifi, WifiOff } from 'lucide-react';
import { sounds } from '../audio/soundEffects';
import { claimFaucetChips } from '../utils/playerStorage';

interface NavbarProps {
  chips: number;
  onChipsChange: (newChips: number) => void;
  onOpenRules: () => void;
  onOpenStats: () => void;
  onReturnHome: () => void;
  isConnected: boolean;
  playerName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  chips,
  onChipsChange,
  onOpenRules,
  onOpenStats,
  onReturnHome,
  isConnected,
  playerName,
}) => {
  const [soundOn, setSoundOn] = useState(sounds.isEnabled());

  const handleToggleSound = () => {
    const next = sounds.toggleSound();
    setSoundOn(next);
  };

  const handleClaimFaucet = () => {
    const updated = claimFaucetChips();
    sounds.playChipSound();
    onChipsChange(updated);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={onReturnHome}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 p-0.5 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-zinc-950 rounded-[7px] flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="font-serif font-black tracking-wider text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 uppercase">
              Royal Club
            </h1>
            <p className="text-[10px] text-zinc-400 tracking-widest font-mono uppercase">
              Poker & Blackjack
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900 border border-zinc-800/80 rounded-full px-2.5 sm:px-3.5 py-1.5 shadow-inner">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="font-mono font-bold text-xs sm:text-sm text-amber-300">
              ${chips.toLocaleString()}
            </span>
            <button
              onClick={handleClaimFaucet}
              title="Claim +$5,000 Free Chips"
              className="ml-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black transition-all shadow-sm active:scale-95"
            >
              + Free Chips
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 font-mono">
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400">Offline</span>
              </>
            )}
          </div>

          <button
            onClick={handleToggleSound}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-zinc-700 transition-colors"
            title={soundOn ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          <button
            onClick={onOpenRules}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-zinc-700 transition-colors"
            title="Rules & Hand Rankings"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenStats}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-zinc-700 transition-colors"
            title="Player Stats"
          >
            <BarChart2 className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-zinc-800 border border-amber-500/40 flex items-center justify-center font-bold font-mono text-xs text-amber-300">
              {playerName.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs font-mono text-zinc-300 max-w-[100px] truncate">
              {playerName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
