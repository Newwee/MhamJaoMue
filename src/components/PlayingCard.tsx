import React from 'react';
import { Card, Suit } from '../types/common';

interface PlayingCardProps {
  card: Card;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
  isPeeling?: boolean;
  animateDeal?: boolean;
}

const SUIT_SYMBOLS: Record<Suit, { icon: string; color: string; isRed: boolean }> = {
  hearts: { icon: '♥', color: 'text-red-600', isRed: true },
  diamonds: { icon: '♦', color: 'text-red-500', isRed: true },
  clubs: { icon: '♣', color: 'text-zinc-900', isRed: false },
  spades: { icon: '♠', color: 'text-zinc-900', isRed: false },
};

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  className = '',
  size = 'md',
  highlight = false,
  isPeeling = false,
  animateDeal = false,
}) => {
  const sizeClasses = {
    sm: 'w-10 h-14 text-xs rounded',
    md: 'w-14 h-20 sm:w-16 sm:h-24 text-sm sm:text-base rounded-md',
    lg: 'w-20 h-28 sm:w-24 sm:h-36 text-lg rounded-lg',
  }[size];

  const animClass = isPeeling
    ? 'animate-suspense-peel shadow-[0_0_20px_rgba(234,179,8,0.8)]'
    : animateDeal
    ? 'animate-deal-card'
    : '';

  if (card.hidden) {
    return (
      <div
        className={`relative select-none flex items-center justify-center border-2 border-amber-600/50 shadow-card bg-gradient-to-br from-red-950 via-red-900 to-zinc-950 overflow-hidden transform transition-all duration-300 hover:-translate-y-1 ${sizeClasses} ${animClass} ${className}`}
      >
        <div className="absolute inset-1 border border-amber-500/40 rounded flex items-center justify-center bg-[radial-gradient(#eab308_1.5px,transparent_1.5px)] [background-size:6px_6px]">
          <div className="w-6 h-6 rounded-full border-2 border-amber-400/60 flex items-center justify-center bg-red-950/90 shadow-md">
            <span className="text-[11px] font-serif font-black text-amber-400 drop-shadow">R</span>
          </div>
        </div>
      </div>
    );
  }

  const suitData = SUIT_SYMBOLS[card.suit] || SUIT_SYMBOLS.spades;

  return (
    <div
      className={`relative select-none flex flex-col justify-between p-1 sm:p-1.5 bg-white border shadow-card transform transition-all duration-300 hover:-translate-y-1.5 animate-flip-card ${
        highlight
          ? 'border-amber-400 ring-2 ring-amber-400 shadow-[0_0_15px_rgba(234,179,8,0.7)] -translate-y-2'
          : 'border-slate-300 hover:border-slate-400'
      } ${sizeClasses} ${animClass} ${className}`}
    >
      <div className="flex flex-col items-center leading-none">
        <span className={`font-bold font-mono tracking-tighter ${suitData.color}`}>
          {card.rank}
        </span>
        <span className={`text-[10px] sm:text-xs leading-none ${suitData.color}`}>
          {suitData.icon}
        </span>
      </div>

      <div className="flex items-center justify-center my-auto">
        <span className={`text-lg sm:text-3xl leading-none ${suitData.color} drop-shadow-sm`}>
          {suitData.icon}
        </span>
      </div>

      <div className="flex flex-col items-center leading-none rotate-180">
        <span className={`font-bold font-mono tracking-tighter ${suitData.color}`}>
          {card.rank}
        </span>
        <span className={`text-[10px] sm:text-xs leading-none ${suitData.color}`}>
          {suitData.icon}
        </span>
      </div>
    </div>
  );
};
