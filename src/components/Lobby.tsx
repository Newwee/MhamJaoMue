import React, { useState } from 'react';
import { GameType, RoomSummary } from '../types/common';
import {
  Users,
  Bot,
  Plus,
  Play,
  Sparkles,
  RefreshCw,
  Flame,
  ChevronRight,
  ChevronLeft,
  Crown,
  Zap,
  Gift,
} from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface LobbyProps {
  onStartSinglePlayer: (gameType: GameType) => void;
  onCreateRoom: (gameType: GameType, name?: string, maxPlayers?: number) => void;
  onJoinRoom: (roomId: string) => void;
  rooms: RoomSummary[];
  onRefreshRooms: () => void;
  onClaimChips: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onStartSinglePlayer,
  onCreateRoom,
  onJoinRoom,
  rooms,
  onRefreshRooms,
  onClaimChips,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalGameType, setModalGameType] = useState<GameType>('poker');
  const [modalRoomName, setModalRoomName] = useState('');
  const [modalMaxPlayers, setModalMaxPlayers] = useState(6);
  const [activeCategory, setActiveCategory] = useState<'casino' | 'slots' | 'sports' | 'arcade'>('casino');
  const [showAssistant, setShowAssistant] = useState(true);

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
    <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6 animate-in fade-in select-none">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-950 via-navy-850 to-indigo-950 border border-blue-500/30 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-zinc-950 text-xs font-serif font-black tracking-wider uppercase shadow-md">
              <Crown className="w-3.5 h-3.5 fill-black" />
              <span>EMHAM888KING SUPREME ARENA</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-white leading-tight">
              เปิดตัวแล้ว <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">EMHAM888 Coins & Cards</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl font-sans leading-relaxed">
              ทำให้ทุกการเล่นมีความหมายด้วย Texas Hold’em และ Blackjack ออนไลน์ เล่นคนเดียวกับ AI หรือสร้างห้องเล่นกับเพื่อนผ่านอินเทอร์เน็ตได้ทันที!
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
              <span className="px-3 py-1 rounded-lg bg-navy-900 border border-navy-700 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow">
                <span>🎮 เล่น</span>
                <span>➔</span>
                <span>💰 รับชิป</span>
                <span>➔</span>
                <span>👑 คว้าแชมป์</span>
              </span>
            </div>
          </div>

          <div className="bg-navy-950/80 backdrop-blur-md border border-navy-700 p-4 rounded-2xl shadow-xl flex flex-col items-center space-y-3 min-w-[280px]">
            <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              เข้าร่วมโต๊ะด่วนด้วยรหัส
            </span>
            <form onSubmit={handleJoinByCode} className="w-full flex gap-2">
              <input
                type="text"
                placeholder="กรอกรหัสห้อง 6 หลัก"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="flex-1 bg-navy-900 border border-navy-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono tracking-widest text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-zinc-950 font-black text-xs rounded-xl uppercase tracking-wider shadow hover:scale-105 active:scale-95 transition-all"
              >
                เข้าเล่น
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveCategory('casino')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap shadow-sm ${
            activeCategory === 'casino'
              ? 'bg-amber-400 text-zinc-950 border-amber-300 font-black'
              : 'bg-navy-900 border-navy-700 text-zinc-300 hover:text-white hover:bg-navy-850'
          }`}
        >
          <span>🃏</span>
          <span>คาสิโนสด & ไพ่</span>
        </button>

        <button
          onClick={() => setActiveCategory('slots')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap ${
            activeCategory === 'slots'
              ? 'bg-amber-400 text-zinc-950 border-amber-300 font-black'
              : 'bg-navy-900 border-navy-700 text-zinc-300 hover:text-white hover:bg-navy-850'
          }`}
        >
          <span>🎰</span>
          <span>สล็อต</span>
        </button>

        <button
          onClick={() => setActiveCategory('sports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap ${
            activeCategory === 'sports'
              ? 'bg-amber-400 text-zinc-950 border-amber-300 font-black'
              : 'bg-navy-900 border-navy-700 text-zinc-300 hover:text-white hover:bg-navy-850'
          }`}
        >
          <span>⚽</span>
          <span>กีฬา / อีสปอร์ต</span>
        </button>

        <button
          onClick={() => setActiveCategory('arcade')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap ${
            activeCategory === 'arcade'
              ? 'bg-amber-400 text-zinc-950 border-amber-300 font-black'
              : 'bg-navy-900 border-navy-700 text-zinc-300 hover:text-white hover:bg-navy-850'
          }`}
        >
          <span>🎮</span>
          <span>อาร์เคด / มินิเกม</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-red-600 text-white font-mono font-bold text-[10px] uppercase">
              ยอดนิยม
            </span>
            <h3 className="text-base sm:text-lg font-serif font-black text-white">
              เกมคาสิโนและโต๊ะไพ่ยอดนิยม
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded bg-navy-900 border border-navy-700 text-zinc-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 rounded bg-navy-900 border border-navy-700 text-zinc-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-navy-850 to-navy-950 border border-navy-700 hover:border-amber-400/80 transition-all shadow-xl flex flex-col justify-between">
            <div className="relative h-44 bg-gradient-to-b from-felt-dark to-felt-darkest flex items-center justify-center p-4 overflow-hidden">
              <div className="absolute top-2 right-2 bg-red-600 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-full shadow">
                ฮิต
              </div>
              <div className="w-28 h-20 rounded-[50px] border-2 border-gold/60 bg-felt/40 shadow-inner flex flex-col items-center justify-center group-hover:scale-105 transition-transform">
                <span className="font-serif font-black text-amber-300 text-sm drop-shadow">POKER</span>
                <span className="font-mono text-[9px] text-zinc-300">HOLD’EM</span>
              </div>
              <div className="absolute bottom-2 left-2 text-[10px] font-mono text-zinc-400 bg-black/60 px-2 py-0.5 rounded">
                2 - 8 ที่นั่ง
              </div>
            </div>

            <div className="p-4 flex flex-col justify-between flex-1">
              <div>
                <div className="text-[10px] font-mono text-amber-400 font-bold mb-1">
                  ROYAL x HOLD’EM
                </div>
                <h4 className="font-bold text-sm text-white mb-1">Texas Hold’em Poker</h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mb-4 leading-snug">
                  โต๊ะวงรีสักหลาดเขียวตาม Ref1 พร้อม Side Pots, All-in และบอทฉลาด
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-navy-800">
                <button
                  onClick={() => onStartSinglePlayer('poker')}
                  className="py-2 px-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors border border-navy-700"
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  <span>เล่นกับ AI</span>
                </button>
                <button
                  onClick={() => handleOpenCreate('poker')}
                  className="py-2 px-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 font-black text-[11px] flex items-center justify-center gap-1 transition-all shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>สร้างห้อง</span>
                </button>
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-navy-850 to-navy-950 border border-navy-700 hover:border-amber-400/80 transition-all shadow-xl flex flex-col justify-between">
            <div className="relative h-44 bg-gradient-to-b from-felt-dark to-felt-darkest flex items-center justify-center p-4 overflow-hidden">
              <div className="absolute top-2 right-2 bg-red-600 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-full shadow">
                ฮิต
              </div>
              <div className="w-28 h-20 rounded-b-[50px] border-2 border-gold/70 bg-felt/40 shadow-inner flex flex-col items-center justify-center group-hover:scale-105 transition-transform">
                <span className="font-serif font-black text-amber-300 text-sm drop-shadow">BLACKJACK</span>
                <span className="font-mono text-[9px] text-zinc-300">PAYS 3:2</span>
              </div>
              <div className="absolute bottom-2 left-2 text-[10px] font-mono text-zinc-400 bg-black/60 px-2 py-0.5 rounded">
                1 - 5 ที่นั่ง
              </div>
            </div>

            <div className="p-4 flex flex-col justify-between flex-1">
              <div>
                <div className="text-[10px] font-mono text-amber-400 font-bold mb-1">
                  ROYAL x 21
                </div>
                <h4 className="font-bold text-sm text-white mb-1">Classic Blackjack 21</h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mb-4 leading-snug">
                  โต๊ะครึ่งวงกลมตาม Ref2 ลุ้นเปิดไพ่ Dealer พร้อม Hit, Stand, Double, Split
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-navy-800">
                <button
                  onClick={() => onStartSinglePlayer('blackjack')}
                  className="py-2 px-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors border border-navy-700"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span>เดี่ยว Dealer</span>
                </button>
                <button
                  onClick={() => handleOpenCreate('blackjack')}
                  className="py-2 px-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 font-black text-[11px] flex items-center justify-center gap-1 transition-all shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>สร้างโต๊ะ</span>
                </button>
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-navy-850 to-navy-950 border border-navy-700 hover:border-amber-400/80 transition-all shadow-xl flex flex-col justify-between">
            <div className="relative h-44 bg-gradient-to-b from-indigo-950 to-purple-950 flex items-center justify-center p-4 overflow-hidden">
              <div className="absolute top-2 right-2 bg-emerald-600 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-full shadow">
                ทดลองใช้ฟรี
              </div>
              <div className="text-center space-y-1 group-hover:scale-105 transition-transform">
                <Flame className="w-10 h-10 text-orange-400 mx-auto animate-pulse" />
                <span className="font-serif font-black text-amber-300 text-sm block">SPEED POKER</span>
                <span className="font-mono text-[9px] text-zinc-400">FAST ACTION</span>
              </div>
            </div>

            <div className="p-4 flex flex-col justify-between flex-1">
              <div>
                <div className="text-[10px] font-mono text-amber-400 font-bold mb-1">
                  VIP POKER
                </div>
                <h4 className="font-bold text-sm text-white mb-1">Speed Hold’em VIP</h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mb-4 leading-snug">
                  โหมดโป๊กเกอร์ความเร็วสูง ลุ้นไพ่จบไวใน 10 วินาที พร้อมเพิ่มบอทได้ไม่จำกัด
                </p>
              </div>

              <div className="pt-2 border-t border-navy-800">
                <button
                  onClick={() => onStartSinglePlayer('poker')}
                  className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-all shadow"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>เข้าเล่นโต๊ะ VIP</span>
                </button>
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-navy-850 to-navy-950 border border-navy-700 hover:border-amber-400/80 transition-all shadow-xl flex flex-col justify-between">
            <div className="relative h-44 bg-gradient-to-b from-amber-950/60 to-navy-950 flex items-center justify-center p-4 overflow-hidden">
              <div className="absolute top-2 right-2 bg-red-600 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-full shadow">
                ฮิต
              </div>
              <div className="text-center space-y-1 group-hover:scale-105 transition-transform">
                <Crown className="w-10 h-10 text-amber-400 mx-auto fill-amber-400/40" />
                <span className="font-serif font-black text-amber-300 text-sm block">HIGH ROLLER</span>
                <span className="font-mono text-[9px] text-zinc-400">DOUBLE BETS</span>
              </div>
            </div>

            <div className="p-4 flex flex-col justify-between flex-1">
              <div>
                <div className="text-[10px] font-mono text-amber-400 font-bold mb-1">
                  VIP BLACKJACK
                </div>
                <h4 className="font-bold text-sm text-white mb-1">High Roller 21 VIP</h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mb-4 leading-snug">
                  เดิมพันสูงสุดถึง $10,000 ต่อมือ พร้อมระบบ Split และ Double Down เต็มรูปแบบ
                </p>
              </div>

              <div className="pt-2 border-t border-navy-800">
                <button
                  onClick={() => onStartSinglePlayer('blackjack')}
                  className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-[11px] flex items-center justify-center gap-1 transition-all shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>เข้าสู่ห้องเดิมพันสูง</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-navy-950/90 border border-navy-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-navy-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-serif font-bold text-white">
              โต๊ะมัลติเพลเยอร์ที่เปิดอยู่ (Active Online Tables)
            </h3>
          </div>
          <button
            onClick={onRefreshRooms}
            className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl bg-navy-850 border border-navy-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>รีเฟรชรายชื่อ</span>
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-navy-800 rounded-xl text-zinc-400 text-xs font-sans">
            ยังไม่มีห้องออนไลน์เปิดอยู่ ณ ขณะนี้ — กดปุ่ม &quot;สร้างห้อง&quot; ด้านบนเพื่อเปิดโต๊ะเล่นกับเพื่อนได้ทันที!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-3.5 rounded-xl bg-navy-900 border border-navy-700 hover:border-amber-400/60 transition-all flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30 uppercase font-bold">
                      {room.gameType === 'poker' ? 'Texas Hold’em' : 'Blackjack'}
                    </span>
                    <span className="text-xs font-mono text-zinc-300">
                      {room.playerCount} / {room.maxPlayers} คน
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white truncate mb-0.5">{room.name}</h4>
                  <div className="text-xs text-zinc-400">Host: {room.hostName}</div>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-navy-800">
                  <span className="text-xs font-mono font-bold text-amber-300 tracking-wider">
                    CODE: {room.id}
                  </span>
                  <button
                    onClick={() => {
                      sounds.playChipSound();
                      onJoinRoom(room.id);
                    }}
                    disabled={room.playerCount >= room.maxPlayers}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 text-zinc-950 font-black font-mono text-xs shadow hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
                  >
                    {room.playerCount >= room.maxPlayers ? 'ห้องเต็ม' : 'เข้าเล่น'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAssistant && (
        <div className="fixed bottom-4 right-4 z-40 flex items-end gap-2 animate-in slide-in-from-bottom-3">
          <div className="bg-navy-900 border border-navy-700 p-3 rounded-2xl shadow-2xl max-w-xs text-xs text-zinc-200 relative">
            <button
              onClick={() => setShowAssistant(false)}
              className="absolute top-1.5 right-1.5 text-zinc-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
            <div className="font-bold text-amber-400 flex items-center gap-1 mb-1">
              <span>👑 ผู้ช่วยส่วนตัว EMHAM888</span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-300">
              กดปุ่ม <span className="text-amber-300 font-bold">+ ชิปฟรี</span> ด้านบนเพื่อรับ $5,000 เติมได้ตลอดเวลา!
            </p>
          </div>
          <div
            onClick={onClaimChips}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 p-0.5 shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            title="กดรับชิปฟรี"
          >
            <div className="w-full h-full rounded-full bg-navy-950 flex items-center justify-center font-bold text-amber-300 text-[10px] tracking-tighter">
              KING
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-serif font-black text-white mb-4">
              สร้างโต๊ะ {modalGameType === 'poker' ? 'Texas Hold’em' : 'Blackjack'}
            </h3>

            <form onSubmit={handleConfirmCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">
                  ชื่อโต๊ะ (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  placeholder="เช่น Vegas High Roller Room"
                  value={modalRoomName}
                  onChange={(e) => setModalRoomName(e.target.value)}
                  maxLength={24}
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">
                  จำนวนผู้เล่นสูงสุด ({modalMaxPlayers} คน)
                </label>
                <input
                  type="range"
                  min={modalGameType === 'poker' ? 2 : 1}
                  max={modalGameType === 'poker' ? 8 : 5}
                  value={modalMaxPlayers}
                  onChange={(e) => setModalMaxPlayers(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-zinc-300 font-bold text-xs uppercase"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-zinc-950 font-black font-mono text-xs uppercase shadow-md"
                >
                  สร้างโต๊ะทันที
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
