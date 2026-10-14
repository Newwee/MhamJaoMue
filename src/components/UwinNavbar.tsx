import React, { useState } from 'react';
import { Volume2, VolumeX, BookOpen, BarChart2, Coins, Crown, Wifi, WifiOff, X } from 'lucide-react';
import { sounds } from '../audio/soundEffects';
import { claimFaucetChips } from '../utils/playerStorage';

interface UwinNavbarProps {
  chips: number;
  onChipsChange: (newChips: number) => void;
  onOpenRules: () => void;
  onOpenStats: () => void;
  onReturnHome: () => void;
  isConnected: boolean;
  playerName: string;
}

export const UwinNavbar: React.FC<UwinNavbarProps> = ({
  chips,
  onChipsChange,
  onOpenRules,
  onOpenStats,
  onReturnHome,
  isConnected,
  playerName,
}) => {
  const [soundOn, setSoundOn] = useState(sounds.isEnabled());
  const [showNotice, setShowNotice] = useState(true);

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
    <div className="w-full flex flex-col z-50 select-none">
      {showNotice && (
        <div className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 font-sans text-xs font-bold py-1.5 px-4 flex items-center justify-between shadow-sm">
          <div className="flex-1 flex items-center justify-center gap-2">
            <span>🎁 รับเครดิตฟรี $10,000 ชิป! สนุกกับ Texas Hold’em และ Blackjack ได้ทันที</span>
            <button
              onClick={handleClaimFaucet}
              className="underline hover:text-red-700 transition-colors"
            >
              รับสิทธิ์เลย! &gt;
            </button>
          </div>
          <button
            onClick={() => setShowNotice(false)}
            className="text-zinc-900 hover:text-black p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="w-full bg-navy-900 border-b border-navy-700/80 shadow-xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onReturnHome}
            className="flex items-center gap-2 focus:outline-none group"
          >
            <div className="flex items-center tracking-tighter">
              <span className="font-serif font-black text-2xl sm:text-3xl text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">
                UWIN
              </span>
              <span className="font-serif font-black text-2xl sm:text-3xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight ml-0.5">
                33
              </span>
            </div>
            <div className="hidden lg:flex flex-col ml-1 text-left leading-none">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                ROYAL CASINO
              </span>
              <span className="text-[9px] text-zinc-400 tracking-wider">
                POKER & BLACKJACK
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-navy-950 border border-navy-700 rounded-full px-3 py-1.5 shadow-inner">
            <Coins className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="font-mono font-bold text-xs sm:text-sm text-amber-300">
              ${chips.toLocaleString()}
            </span>
            <button
              onClick={handleClaimFaucet}
              title="Claim +$5,000 Free Chips"
              className="ml-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 transition-all shadow active:scale-95"
            >
              + ชิปฟรี
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-850 border border-navy-700 text-xs font-mono text-zinc-300">
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400">P2P Ready</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 bg-navy-850 p-1 rounded-xl border border-navy-700">
            <button
              onClick={handleToggleSound}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-amber-400 transition-colors"
              title={soundOn ? 'Mute' : 'Unmute'}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            </button>

            <button
              onClick={onOpenRules}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-amber-400 transition-colors"
              title="Rules"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenStats}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-amber-400 transition-colors"
              title="Statistics"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-navy-700">
            <div className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-3 py-1.5 rounded-full text-xs shadow-md cursor-pointer transition-transform active:scale-95">
              <Crown className="w-3.5 h-3.5 fill-black" />
              <span className="truncate max-w-[90px]">{playerName}</span>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-navy-850 border border-navy-700 text-xs">
              <span className="text-sm">🇹🇭</span>
              <span className="text-[10px] font-mono text-zinc-400 font-bold">TH</span>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
