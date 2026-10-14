import React from 'react';

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ChipStack: React.FC<ChipStackProps> = ({
  amount,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const getChipColor = (val: number) => {
    if (val >= 5000) return 'from-amber-400 to-amber-600 border-amber-300 text-zinc-950';
    if (val >= 1000) return 'from-orange-500 to-orange-700 border-orange-300 text-white';
    if (val >= 500) return 'from-purple-600 to-purple-800 border-purple-300 text-white';
    if (val >= 100) return 'from-zinc-800 to-zinc-950 border-zinc-400 text-white';
    if (val >= 25) return 'from-emerald-500 to-emerald-700 border-emerald-300 text-white';
    return 'from-red-500 to-red-700 border-red-300 text-white';
  };

  const sizeClasses = {
    sm: 'w-5 h-5 text-[9px]',
    md: 'w-7 h-7 text-[10px]',
    lg: 'w-9 h-9 text-xs',
  }[size];

  const formatAmount = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}k`;
    return `$${num}`;
  };

  if (amount <= 0) return null;

  const chipColor = getChipColor(amount);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="relative flex items-center justify-center">
        <div
          className={`relative rounded-full border-2 border-dashed flex items-center justify-center font-bold font-mono shadow-chip bg-gradient-to-br ${chipColor} ${sizeClasses}`}
        >
          <div className="w-[70%] h-[70%] rounded-full border border-white/30 flex items-center justify-center bg-black/10"></div>
        </div>
      </div>
      {showLabel && (
        <span className="font-mono font-bold text-xs sm:text-sm text-amber-300 drop-shadow">
          {formatAmount(amount)}
        </span>
      )}
    </div>
  );
};
