import React from 'react';
import {
  Trophy,
  Share2,
  Home,
  Wallet,
  Gift,
  MessageSquare,
  Sparkles,
  Gamepad2,
  Dices,
  Flame,
  Zap,
} from 'lucide-react';

interface UwinSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenWallet: () => void;
}

export const UwinSidebar: React.FC<UwinSidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenWallet,
}) => {
  return (
    <aside className="w-56 bg-navy-950 border-r border-navy-800 flex flex-col p-3 space-y-4 shrink-0 hidden md:flex select-none">
      <div className="space-y-2">
        <button
          onClick={onOpenWallet}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 fill-black" />
            <span className="font-serif font-black tracking-wide">ทัวร์นาเมนต์ VIP</span>
          </div>
          <span className="bg-black/20 text-black text-[9px] px-1.5 py-0.5 rounded-full font-mono">
            HOT
          </span>
        </button>

        <button
          onClick={onOpenWallet}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-bold text-xs shadow-md hover:scale-[1.02] active:scale-95 transition-all border border-blue-500/30"
        >
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-cyan-300" />
            <span>แบ่งปัน & รับชิปฟรี</span>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        </button>
      </div>

      <nav className="space-y-1 text-xs">
        <button
          onClick={() => onSelectTab('home')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'home'
              ? 'bg-amber-400 text-zinc-950 shadow-md'
              : 'text-zinc-300 hover:text-white hover:bg-navy-900'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>หน้าหลัก</span>
        </button>

        <button
          onClick={onOpenWallet}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-navy-900 transition-colors"
        >
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>กระเป๋าชิป</span>
        </button>

        <button
          onClick={onOpenWallet}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-navy-900 transition-colors"
        >
          <Gift className="w-4 h-4 text-purple-400" />
          <span>โปรโมชั่น</span>
        </button>

        <button
          onClick={onOpenWallet}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-navy-900 transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>แชทสด</span>
        </button>
      </nav>

      <div className="pt-2 border-t border-navy-800">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-900/60 via-indigo-950 to-navy-900 border border-purple-500/40 text-center space-y-1.5 shadow-inner">
          <div className="font-serif font-black text-amber-300 text-xs flex items-center justify-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-amber-300" />
            <span>EMHAM888 SPIN</span>
          </div>
          <p className="text-[10px] text-zinc-300">หมุนวงล้อลุ้นรับโชคใหญ่!</p>
          <button
            onClick={onOpenWallet}
            className="w-full py-1 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-[10px] rounded-lg shadow"
          >
            หมุนเลย!
          </button>
        </div>
      </div>

      <div className="space-y-1 text-xs pt-1">
        <div className="px-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          หมวดหมู่เกม
        </div>

        <button
          onClick={() => onSelectTab('casino')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
            activeTab === 'casino'
              ? 'text-amber-300 font-bold bg-navy-850 border border-amber-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-navy-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-red-500" />
          <span>คาสิโนสด / ไพ่</span>
        </button>

        <button
          onClick={() => onSelectTab('poker')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-navy-900 transition-colors"
        >
          <span className="text-emerald-400 font-mono text-xs">♠</span>
          <span>Texas Hold’em</span>
        </button>

        <button
          onClick={() => onSelectTab('blackjack')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-navy-900 transition-colors"
        >
          <span className="text-amber-400 font-mono text-xs">21</span>
          <span>Blackjack</span>
        </button>

        <button
          onClick={() => onSelectTab('slots')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-navy-900 transition-colors"
        >
          <Dices className="w-3.5 h-3.5 text-yellow-400" />
          <span>สล็อตยอดนิยม</span>
        </button>

        <button
          onClick={() => onSelectTab('arcade')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-navy-900 transition-colors"
        >
          <Gamepad2 className="w-3.5 h-3.5 text-blue-400" />
          <span>อาร์เคด / มินิเกม</span>
        </button>
      </div>
    </aside>
  );
};
