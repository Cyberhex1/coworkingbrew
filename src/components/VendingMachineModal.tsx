import React, { useState } from 'react';
import { soundEngine } from '../utils/audioSynth';
import { Sparkles, Zap, Check, Flame, Award, Heart, ShoppingBag, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VendingMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: number;
  onVendItem?: (itemName: string, focusBonus: number, cost: number) => void;
}

interface VendingItem {
  slot: string;
  id: string;
  name: string;
  category: 'drink' | 'snack' | 'sweet';
  icon: string;
  cost: number;
  focusBonus: number;
  description: string;
  badge: string;
}

const VENDING_ITEMS: VendingItem[] = [
  {
    slot: 'A1',
    id: 'pixel-cola',
    name: 'Pixel Berry Cola',
    category: 'drink',
    icon: '🥤',
    cost: 5,
    focusBonus: 15,
    description: 'Chilled fizzy soda with nostalgic berry bubbles & brisk caffeine kick.',
    badge: 'Best Seller',
  },
  {
    slot: 'A2',
    id: 'matcha-can',
    name: 'Uji Matcha Can',
    category: 'drink',
    icon: '🍵',
    cost: 6,
    focusBonus: 20,
    description: 'Silky ceremonial green tea latte in an aluminum pull-tab chilled can.',
    badge: 'Calm Focus',
  },
  {
    slot: 'A3',
    id: 'neon-energy',
    name: 'Neon Citrus Spark',
    category: 'drink',
    icon: '⚡',
    cost: 8,
    focusBonus: 25,
    description: 'Electrolyte sparkling water with natural guarana & citrus zest.',
    badge: 'High Energy',
  },
  {
    slot: 'B1',
    id: 'dark-choco',
    name: 'Voxel Dark Choco Bar',
    category: 'sweet',
    icon: '🍫',
    cost: 5,
    focusBonus: 15,
    description: '72% cocoa crisp wafer bar crafted in geometric voxel squares.',
    badge: 'Brain Fuel',
  },
  {
    slot: 'B2',
    id: 'boba-cookies',
    name: 'Brown Sugar Boba Cookies',
    category: 'sweet',
    icon: '🍪',
    cost: 6,
    focusBonus: 18,
    description: 'Soft-baked cookies stuffed with chewy brown sugar tapioca pearls.',
    badge: 'Cozy Snack',
  },
  {
    slot: 'B3',
    id: 'pretzel-knots',
    name: 'Sea Salt Pretzel Knots',
    category: 'snack',
    icon: '🥨',
    cost: 4,
    focusBonus: 12,
    description: 'Golden oven-baked sourdough pretzel twists with flaky sea salt crystals.',
    badge: 'Crunchy',
  },
  {
    slot: 'C1',
    id: 'strawberry-gummies',
    name: 'Energy Berry Chews',
    category: 'sweet',
    icon: '🍓',
    cost: 5,
    focusBonus: 15,
    description: 'Vitamin-infused strawberry & acai fruit gummies for mid-day focus.',
    badge: 'Vitamin C',
  },
  {
    slot: 'C2',
    id: 'taro-can',
    name: 'Taro Coconut Boba Drink',
    category: 'drink',
    icon: '🧋',
    cost: 7,
    focusBonus: 22,
    description: 'Sweet purple taro milk tea with bouncy tender coconut jelly bits.',
    badge: 'Creamy',
  },
  {
    slot: 'C3',
    id: 'wasabi-peas',
    name: 'Zesty Wasabi Crunch Peas',
    category: 'snack',
    icon: '🟢',
    cost: 4,
    focusBonus: 14,
    description: 'Spicy roasted green peas that instantly wake up your senses.',
    badge: 'Wake Up!',
  },
];

export const VendingMachineModal: React.FC<VendingMachineModalProps> = ({
  isOpen,
  onClose,
  tickets,
  onVendItem,
}) => {
  const [selectedItem, setSelectedItem] = useState<VendingItem>(VENDING_ITEMS[0]);
  const [keypadInput, setKeypadInput] = useState<string>('A1');
  const [isDispensing, setIsDispensing] = useState<boolean>(false);
  const [dispensedItem, setDispensedItem] = useState<VendingItem | null>(null);

  if (!isOpen) return null;

  const handleKeypadPress = (char: string) => {
    soundEngine.playChime('digital');
    let next = keypadInput + char;
    if (next.length > 2) {
      next = char;
    }
    setKeypadInput(next);

    const match = VENDING_ITEMS.find((it) => it.slot.toLowerCase() === next.toLowerCase());
    if (match) {
      setSelectedItem(match);
    }
  };

  const handleClearKeypad = () => {
    soundEngine.playChime('bell');
    setKeypadInput('');
  };

  const handleSelectDirect = (item: VendingItem) => {
    soundEngine.playChime('digital');
    setSelectedItem(item);
    setKeypadInput(item.slot);
  };

  const handleVend = () => {
    if (isDispensing) return;
    setIsDispensing(true);
    soundEngine.playCoin();

    setTimeout(() => {
      soundEngine.playChime('chime');
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      setDispensedItem(selectedItem);
      setIsDispensing(false);

      if (onVendItem) {
        onVendItem(selectedItem.name, selectedItem.focusBonus, selectedItem.cost);
      }
    }, 700);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 select-none animate-fade-in">
      <div className="w-full max-w-3xl bg-[#130f24] border-2 border-pink-500/40 rounded-3xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-pink-100 flex flex-col max-h-[92vh] overflow-hidden relative">
        {/* Glow Accents */}
        <div className="absolute -top-10 left-1/3 w-64 h-32 bg-pink-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -top-10 right-1/4 w-48 h-24 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* 1. Header */}
        <div className="flex items-center justify-between border-b border-pink-500/30 pb-3 mb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-600/30 to-purple-800/30 border border-pink-500/50 flex items-center justify-center text-2xl shadow-inner text-pink-300">
              🍫
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cozy font-bold text-lg sm:text-xl text-white tracking-wide">
                  Office Vending Machine
                </h2>
                <span className="text-[11px] bg-pink-500/20 text-pink-300 border border-pink-500/40 px-2 py-0.5 rounded-full font-mono">
                  Room Fixture
                </span>
              </div>
              <p className="text-xs text-pink-200/80 font-cozy">
                Grab an iced beverage or energy snack to refresh during Pomodoro focus blocks!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
              <span>🎟️</span>
              <span>{tickets} Tickets</span>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-pink-950/60 hover:bg-pink-900/60 border border-pink-700/50 flex items-center justify-center text-pink-300 hover:text-white transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Main Content: Glass Shelf Display on Left, Keypad & Vend on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 overflow-y-auto flex-1 pr-1 pb-1">
          {/* Glass Shelves (8 cols on md) */}
          <div className="md:col-span-8 bg-[#18122d] border-2 border-purple-800/60 rounded-2xl p-3 flex flex-col justify-between shadow-inner">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-800/40 text-[11px] font-mono text-purple-300/80">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>CHILLED VENDING DISPLAY</span>
              </span>
              <span>CLICK ITEM OR USE KEYPAD</span>
            </div>

            {/* 3x3 Snack Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {VENDING_ITEMS.map((item) => {
                const isSelected = selectedItem.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectDirect(item)}
                    className={`relative p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-28 group ${
                      isSelected
                        ? 'bg-gradient-to-b from-pink-500/25 to-purple-900/40 border-pink-400 shadow-md ring-1 ring-pink-400/50'
                        : 'bg-[#120e24] border-purple-800/40 hover:border-pink-500/50 hover:bg-[#1a1435]'
                    }`}
                  >
                    {/* Slot badge */}
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-purple-950/90 text-pink-300 border border-purple-700/50">
                        {item.slot}
                      </span>
                      <span className="text-[9px] text-amber-300 font-mono font-bold flex items-center gap-0.5">
                        🎟️ {item.cost}
                      </span>
                    </div>

                    {/* Snack Icon & Name */}
                    <div className="text-center my-auto">
                      <div className="text-2xl group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <div className="text-[11px] font-cozy font-bold text-white leading-tight truncate mt-1">
                        {item.name}
                      </div>
                    </div>

                    {/* Focus boost badge */}
                    <div className="text-[9px] text-emerald-300 font-mono flex items-center justify-center gap-1 bg-emerald-950/40 py-0.5 rounded-md border border-emerald-800/30">
                      <Zap className="w-2.5 h-2.5 text-emerald-400" />
                      <span>+{item.focusBonus}m Focus</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Glass Chute / Delivery Slot */}
            <div className="mt-3 p-2 bg-[#0d091a] border border-purple-800/40 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-purple-400 text-[11px]">DELIVERY CHUTE ⬇️</span>
              {dispensedItem ? (
                <div className="flex items-center gap-1.5 text-emerald-300 animate-bounce">
                  <span>{dispensedItem.icon}</span>
                  <span className="font-bold">{dispensedItem.name} Dispensed!</span>
                </div>
              ) : (
                <span className="text-purple-500/60 text-[10px]">[ READY TO DISPENSE ]</span>
              )}
            </div>
          </div>

          {/* Keypad & Selected Item Details (4 cols on md) */}
          <div className="md:col-span-4 flex flex-col justify-between space-y-3">
            {/* Selected item card */}
            <div className="bg-[#18122d] border border-pink-500/30 rounded-2xl p-3 text-xs font-cozy space-y-2 shadow-md">
              <div className="flex items-center justify-between border-b border-purple-800/40 pb-2">
                <span className="text-pink-300 font-mono font-bold">SLOT [{selectedItem.slot}]</span>
                <span className="text-[10px] bg-pink-900/60 text-pink-200 px-2 py-0.5 rounded-full border border-pink-700/50">
                  {selectedItem.badge}
                </span>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <span className="text-3xl">{selectedItem.icon}</span>
                <div>
                  <div className="font-bold text-sm text-white">{selectedItem.name}</div>
                  <div className="text-[11px] text-purple-300/80 line-clamp-2">
                    {selectedItem.description}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-purple-900/40 flex items-center justify-between font-mono text-[11px]">
                <span className="text-purple-300">Cost:</span>
                <span className="text-amber-300 font-bold">🎟️ {selectedItem.cost} Tickets</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-purple-300">Benefit:</span>
                <span className="text-emerald-400 font-bold">⚡ +{selectedItem.focusBonus} Focus Mins</span>
              </div>
            </div>

            {/* LED Keypad Terminal */}
            <div className="bg-[#100b1e] border-2 border-purple-700/50 rounded-2xl p-3 shadow-inner space-y-2">
              <div className="bg-[#080512] border border-cyan-500/40 rounded-xl px-3 py-1.5 flex items-center justify-between font-mono text-xs text-cyan-300">
                <span className="text-[10px] text-cyan-500/80">SELECTION:</span>
                <span className="font-bold text-sm tracking-widest">{keypadInput || '--'}</span>
              </div>

              {/* Keypad buttons */}
              <div className="grid grid-cols-3 gap-1.5 font-mono font-bold text-xs">
                {['A', 'B', 'C', '1', '2', '3'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleKeypadPress(btn)}
                    className="py-2 rounded-lg bg-purple-900/50 hover:bg-pink-600 border border-purple-600/40 text-white transition-all active:scale-95 text-center shadow-sm"
                  >
                    {btn}
                  </button>
                ))}
              </div>

              <button
                onClick={handleClearKeypad}
                className="w-full py-1 text-[10px] font-mono text-purple-400 hover:text-white transition-colors text-center"
              >
                Clear Keypad [CLR]
              </button>
            </div>

            {/* Vend Button */}
            <button
              onClick={handleVend}
              disabled={isDispensing}
              className={`w-full py-2.5 rounded-xl font-cozy font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border ${
                isDispensing
                  ? 'bg-purple-800/40 border-purple-700 text-purple-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border-pink-400/50 shadow-pink-900/30'
              }`}
            >
              {isDispensing ? (
                <>
                  <span className="animate-spin text-sm">⚙️</span>
                  <span>Dispensing Snack...</span>
                </>
              ) : (
                <>
                  <span>Vend {selectedItem.name}</span>
                  <span className="text-amber-300 font-mono">🎟️ {selectedItem.cost}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2.5 mt-2 border-t border-purple-900/40 flex items-center justify-between text-[11px] text-purple-400/80 font-cozy">
          <span>Available in every room alongside the coffee bar, library, whiteboard, copier & water cooler.</span>
          <button
            onClick={onClose}
            className="text-pink-300 hover:text-white font-semibold underline underline-offset-2"
          >
            Back to Room ↩
          </button>
        </div>
      </div>
    </div>
  );
};
