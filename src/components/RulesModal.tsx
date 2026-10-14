import React, { useState } from 'react';
import { X, Trophy, ShieldCheck } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'poker' | 'blackjack'>('poker');

  if (!isOpen) return null;

  const pokerRanks = [
    { rank: '1. Royal Flush', desc: 'A, K, Q, J, 10 all of the exact same suit. The unbeatable ultimate hand.', ex: 'A♠ K♠ Q♠ J♠ 10♠' },
    { rank: '2. Straight Flush', desc: 'Five consecutive cards of the same suit.', ex: '9♥ 8♥ 7♥ 6♥ 5♥' },
    { rank: '3. Four of a Kind', desc: 'Four cards of identical numerical rank.', ex: 'K♣ K♦ K♥ K♠ 4♦' },
    { rank: '4. Full House', desc: 'Three of a kind plus a pair.', ex: 'J♠ J♥ J♦ 8♣ 8♥' },
    { rank: '5. Flush', desc: 'Any five cards of the same suit, not in sequence.', ex: 'A♦ 10♦ 7♦ 6♦ 2♦' },
    { rank: '6. Straight', desc: 'Five consecutive ranks of mixed suits. Ace can count high or low (A-2-3-4-5).', ex: '10♠ 9♦ 8♣ 7♥ 6♠' },
    { rank: '7. Three of a Kind', desc: 'Three cards of the same numerical rank.', ex: '7♠ 7♦ 7♥ K♣ 2♦' },
    { rank: '8. Two Pair', desc: 'Two distinct pairs of matching ranks.', ex: 'Q♥ Q♠ 4♣ 4♦ A♠' },
    { rank: '9. One Pair', desc: 'Two cards of identical rank.', ex: '10♣ 10♦ A♠ 8♥ 3♣' },
    { rank: '10. High Card', desc: 'No combination; highest ranked single card determines strength.', ex: 'A♠ K♦ 9♣ 5♥ 2♦' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-serif font-bold text-amber-200">Rules & Game Guide</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-6 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('poker')}
            className={`pb-2.5 px-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'poker'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Texas Hold’em Poker
          </button>
          <button
            onClick={() => setActiveTab('blackjack')}
            className={`pb-2.5 px-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'blackjack'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Blackjack (21)
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-sm text-zinc-300">
          {activeTab === 'poker' ? (
            <div className="space-y-4">
              <div className="bg-felt-darkest/60 border border-felt/40 p-3.5 rounded-xl">
                <h3 className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  How to Play Texas Hold’em
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Each player is dealt 2 private hole cards. Five community cards are revealed face-up in three stages: the Flop (3 cards), the Turn (1 card), and the River (1 card). The goal is to assemble the best 5-card poker hand using any combination of your 2 hole cards and the 5 community cards.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 mb-2 font-mono uppercase tracking-wider text-xs">
                  Official Hand Rankings (Highest to Lowest)
                </h4>
                <div className="space-y-1.5">
                  {pokerRanks.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80"
                    >
                      <div>
                        <div className="font-bold text-amber-200 text-xs">{r.rank}</div>
                        <div className="text-[11px] text-zinc-400">{r.desc}</div>
                      </div>
                      <div className="font-mono font-bold text-xs text-amber-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 whitespace-nowrap">
                        {r.ex}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-felt-darkest/60 border border-felt/40 p-3.5 rounded-xl">
                <h3 className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  How to Play Blackjack
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  The objective is to beat the Dealer’s hand total without exceeding 21. Face cards (J, Q, K) count as 10. Aces count as either 1 or 11. All other numbered cards retain their pip face value.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <div className="font-bold text-amber-300 text-xs mb-1">Natural Blackjack (21)</div>
                  <div className="text-xs text-zinc-400">
                    Achieved with an Ace and a 10-value card on the initial deal. Pays <span className="text-amber-400 font-bold">3 to 2</span>!
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <div className="font-bold text-amber-300 text-xs mb-1">Dealer Rules</div>
                  <div className="text-xs text-zinc-400">
                    Dealer must hit until their total is 17 or higher. Dealer automatically stands on all 17s.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <div className="font-bold text-amber-300 text-xs mb-1">Double Down</div>
                  <div className="text-xs text-zinc-400">
                    Double your original bet, receive exactly one more card, and stand immediately.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <div className="font-bold text-amber-300 text-xs mb-1">Split Pairs</div>
                  <div className="text-xs text-zinc-400">
                    When dealt two matching cards, split them into two independent hands with a matching wager.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
