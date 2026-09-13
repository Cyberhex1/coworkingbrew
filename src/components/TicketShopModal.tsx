import React from 'react';
import { ShopItem } from '../types';
import { ShoppingBag, Sparkles, Check, X, Lock } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';
import confetti from 'canvas-confetti';

interface TicketShopModalProps {
  isOpen: boolean;
  tickets: number;
  shopItems: ShopItem[];
  onBuyItem: (itemId: string) => void;
  onClose: () => void;
}

export const TicketShopModal: React.FC<TicketShopModalProps> = ({
  isOpen,
  tickets,
  shopItems,
  onBuyItem,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePurchase = (item: ShopItem) => {
    if (tickets < item.cost || item.unlocked) return;
    soundEngine.playCoin();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
    onBuyItem(item.id);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="w-full max-w-2xl bg-[#1e1a2f] border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl animate-fade-in text-purple-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-800/40 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              🎟️
            </div>
            <div>
              <h2 className="font-cozy font-bold text-lg text-white">Focus Ticket Shop</h2>
              <p className="text-xs text-purple-300">
                Spend tickets earned purely from deep focus sessions!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 font-cozy font-bold text-sm shadow-inner">
              <span>🎟️</span>
              <span>{tickets} Tickets</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-purple-900/60 text-purple-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Shopkeeper Boba Banner */}
        <div className="bg-purple-950/60 border border-purple-800/40 rounded-2xl p-3 mb-4 flex items-center gap-3">
          <div className="text-3xl animate-bounce">🐼</div>
          <div className="text-xs font-cozy">
            <span className="font-bold text-amber-300">Boba the Shopkeeper:</span>
            <p className="text-purple-200 mt-0.5">
              "Great work staying focused! Every minute you study or work earns tickets to style your avatar and cozy space!"
            </p>
          </div>
        </div>

        {/* Shop Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto flex-1 pr-1">
          {shopItems.map((item) => {
            const canAfford = tickets >= item.cost;
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  item.unlocked
                    ? 'bg-purple-950/30 border-purple-800/20 opacity-80'
                    : canAfford
                    ? 'bg-purple-950/70 border-purple-700/60 hover:border-purple-500'
                    : 'bg-purple-950/40 border-purple-900/40 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-800/40 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-cozy font-bold text-xs text-white">{item.name}</h4>
                    <p className="text-[10px] text-purple-300 font-cozy line-clamp-1">{item.description}</p>
                    <span className="text-[10px] text-amber-300 font-cozy font-semibold flex items-center gap-1 mt-0.5">
                      🎟️ {item.cost} Tickets
                    </span>
                  </div>
                </div>

                <div>
                  {item.unlocked ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-cozy font-semibold">
                      <Check className="w-3 h-3" />
                      <span>Owned</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-xl font-cozy text-xs font-bold transition-all shadow-sm active:scale-95 ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-purple-950 shadow-amber-900/40 cursor-pointer'
                          : 'bg-purple-900/40 text-purple-400/50 cursor-not-allowed border border-purple-800/30'
                      }`}
                    >
                      {canAfford ? 'Unlock' : <Lock className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
