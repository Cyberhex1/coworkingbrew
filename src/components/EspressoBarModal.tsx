import React, { useState } from 'react';
import { soundEngine } from '../utils/audioSynth';
import { Coffee, Sparkles, Flame, Check, Users, Zap, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EspressoBarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrewDrink: (drinkName: string, icon: string, focusBonus: number, cost: number) => void;
  onSendRoundToRoom: (drinkName: string, cost: number) => void;
  tickets: number;
}

interface DrinkOption {
  id: string;
  name: string;
  category: 'espresso' | 'tea' | 'specialty';
  icon: string;
  roast: string;
  temp: 'Hot' | 'Iced';
  caffeine: 'High' | 'Medium' | 'Low' | 'Zen';
  focusBonus: number;
  ticketCost: number;
  description: string;
  flavorNotes: string[];
}

const DRINK_MENU: DrinkOption[] = [
  {
    id: 'double-espresso',
    name: 'Double Ristretto',
    category: 'espresso',
    icon: '☕',
    roast: 'Dark Italian Roast',
    temp: 'Hot',
    caffeine: 'High',
    focusBonus: 20,
    ticketCost: 6,
    description: 'Intense, syrupy espresso shot with thick golden crema.',
    flavorNotes: ['Dark Cocoa', 'Toasted Hazelnut', 'Caramel'],
  },
  {
    id: 'oat-cortado',
    name: 'Vanilla Oat Cortado',
    category: 'espresso',
    icon: '🥛',
    roast: 'Medium Espresso Roast',
    temp: 'Hot',
    caffeine: 'Medium',
    focusBonus: 15,
    ticketCost: 8,
    description: 'Equal parts velvety microfoam oat milk and double espresso.',
    flavorNotes: ['Madagascar Vanilla', 'Smooth Oats', 'Cinnamon'],
  },
  {
    id: 'iced-nitro-coldbrew',
    name: 'Nitro Cold Brew',
    category: 'espresso',
    icon: '🧊',
    roast: 'Steeped 24 Hours',
    temp: 'Iced',
    caffeine: 'High',
    focusBonus: 25,
    ticketCost: 10,
    description: 'Nitrogen-infused cascading cold brew with a creamy head.',
    flavorNotes: ['Black Cherry', 'Molasses', 'Crisp Finish'],
  },
  {
    id: 'matcha-latte',
    name: 'Ceremonial Matcha Latte',
    category: 'tea',
    icon: '🍵',
    roast: 'Uji Kyoto First Harvest',
    temp: 'Hot',
    caffeine: 'Medium',
    focusBonus: 18,
    ticketCost: 8,
    description: 'Stone-ground green tea whisked with creamy oat milk.',
    flavorNotes: ['Umami', 'Fresh Greens', 'Light Sweetness'],
  },
  {
    id: 'lavender-earl-grey',
    name: 'Lavender Earl Grey',
    category: 'tea',
    icon: '🫖',
    roast: 'Bergamot & French Flowers',
    temp: 'Hot',
    caffeine: 'Low',
    focusBonus: 12,
    ticketCost: 5,
    description: 'Aromatic black tea infused with bergamot and calming lavender buds.',
    flavorNotes: ['Bergamot Citrus', 'Floral Petals', 'Wild Honey'],
  },
  {
    id: 'iced-yuzu-sparkler',
    name: 'Iced Yuzu Tonic',
    category: 'specialty',
    icon: '🍋',
    roast: 'Cold Pressed Citrus',
    temp: 'Iced',
    caffeine: 'Zen',
    focusBonus: 14,
    ticketCost: 7,
    description: 'Effervescent tonic water with Japanese yuzu juice and fresh mint.',
    flavorNotes: ['Zesty Yuzu', 'Crisp Bubble', 'Cool Mint'],
  },
];

export const EspressoBarModal: React.FC<EspressoBarModalProps> = ({
  isOpen,
  onClose,
  onBrewDrink,
  onSendRoundToRoom,
  tickets,
}) => {
  const [selectedDrink, setSelectedDrink] = useState<DrinkOption>(DRINK_MENU[0]);
  const [isBrewing, setIsBrewing] = useState<boolean>(false);
  const [brewProgress, setBrewProgress] = useState<number>(0);
  const [justBrewed, setJustBrewed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cupsBrewedToday, setCupsBrewedToday] = useState<number>(() => {
    return parseInt(localStorage.getItem('ontogether_espresso_count') || '1', 10);
  });

  if (!isOpen) return null;

  const canAffordDrink = tickets >= selectedDrink.ticketCost;
  const canAffordRound = tickets >= 20;

  const handleStartBrew = () => {
    if (isBrewing) return;
    if (!canAffordDrink) {
      setErrorMessage(`Need ${selectedDrink.ticketCost - tickets} more tickets! Complete Pomodoros to earn tickets.`);
      soundEngine.playChime('digital');
      return;
    }

    setErrorMessage(null);
    setIsBrewing(true);
    setBrewProgress(0);
    setJustBrewed(false);

    soundEngine.playChime('chime');

    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setBrewProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        setIsBrewing(false);
        setJustBrewed(true);

        const newCount = cupsBrewedToday + 1;
        setCupsBrewedToday(newCount);
        localStorage.setItem('ontogether_espresso_count', newCount.toString());

        soundEngine.playCoin();
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
        onBrewDrink(selectedDrink.name, selectedDrink.icon, selectedDrink.focusBonus, selectedDrink.ticketCost);
      }
    }, 120);
  };

  const handleSendRound = () => {
    if (!canAffordRound) {
      setErrorMessage(`Need ${20 - tickets} more tickets to treat the entire room (20 🎟️).`);
      soundEngine.playChime('digital');
      return;
    }
    setErrorMessage(null);
    soundEngine.playHighFive();
    confetti({ particleCount: 65, spread: 90, origin: { y: 0.5 } });
    onSendRoundToRoom(selectedDrink.name, 20);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#171324] border-2 border-amber-500/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-[#231a33] to-[#171324] p-5 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-600/30 border border-amber-400/50 flex items-center justify-center text-2xl shadow-inner">
              ☕
            </div>
            <div>
              <h2 className="font-cozy font-bold text-lg text-white flex items-center gap-2">
                <span>Office Espresso & Brew Bar</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  La Marzocco Voxel V4
                </span>
              </h2>
              <p className="text-xs text-amber-200/80 font-cozy">
                Craft barista-grade coffee, boost your focus score, and treat your co-workers!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-purple-950/80 border border-purple-700/50 text-purple-300 hover:text-white flex items-center justify-center font-bold text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Daily Barista Stats & Ticket Balance */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#211a33]/80 border border-amber-500/20 p-3 rounded-2xl text-center">
              <span className="text-[11px] text-amber-300/80 block font-cozy">Cups Brewed Today</span>
              <span className="text-lg font-bold text-white font-mono-timer flex items-center justify-center gap-1">
                <span>☕</span>
                <span>{cupsBrewedToday}</span>
              </span>
            </div>
            <div className="bg-[#211a33]/80 border border-amber-500/20 p-3 rounded-2xl text-center">
              <span className="text-[11px] text-amber-300/80 block font-cozy">Active Focus Boost</span>
              <span className="text-lg font-bold text-amber-400 font-mono-timer flex items-center justify-center gap-1">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>+{selectedDrink.focusBonus}%</span>
              </span>
            </div>
            <div className="bg-[#211a33]/80 border border-amber-500/20 p-3 rounded-2xl text-center">
              <span className="text-[11px] text-amber-300/80 block font-cozy">Your Balance</span>
              <span className={`text-lg font-bold font-mono-timer flex items-center justify-center gap-1 ${tickets < selectedDrink.ticketCost ? 'text-rose-400' : 'text-amber-300'}`}>
                <span>🎟️</span>
                <span>{tickets} Tickets</span>
              </span>
            </div>
          </div>

          {/* Error Message Notice if any */}
          {errorMessage && (
            <div className="bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs px-4 py-2.5 rounded-2xl flex items-center justify-between animate-fade-in font-cozy">
              <span>⚠️ {errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white ml-2 text-xs">✕</button>
            </div>
          )}

          {/* Drink Menu Grid */}
          <div>
            <h3 className="text-xs font-cozy font-bold text-amber-200 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>📋 Artisanal Office Menu</span>
              <span className="text-[11px] text-purple-300/80 font-normal">Costs focus tickets earned via Pomodoro</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DRINK_MENU.map((drink) => {
                const isSelected = selectedDrink.id === drink.id;
                const canAfford = tickets >= drink.ticketCost;
                return (
                  <button
                    key={drink.id}
                    onClick={() => {
                      setSelectedDrink(drink);
                      setJustBrewed(false);
                      setErrorMessage(null);
                      soundEngine.playCoin();
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between relative ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400'
                        : 'bg-[#1e172e]/70 border-purple-800/40 hover:bg-[#261e38] hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{drink.icon}</span>
                        <div>
                          <div className="font-cozy font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{drink.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <div className="text-[11px] text-amber-300/80 font-mono">{drink.roast}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border ${
                          canAfford ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                        }`}>
                          🎟️ {drink.ticketCost}
                        </span>
                        <span className="text-[9px] text-purple-300/80">
                          +{drink.focusBonus}% boost
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-purple-200/70 line-clamp-2 mb-2">{drink.description}</p>

                    <div className="flex items-center gap-1 flex-wrap">
                      {drink.flavorNotes.map((note) => (
                        <span
                          key={note}
                          className="text-[10px] bg-purple-900/40 text-purple-300 border border-purple-700/40 px-1.5 py-0.5 rounded-md"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Machine Preview & Action Area */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#231a36] to-[#191327] border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl bg-amber-950/70 border-2 border-amber-400/60 flex items-center justify-center text-3xl shadow-lg">
                <span>{selectedDrink.icon}</span>
                {isBrewing && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-cozy font-bold text-base text-white">{selectedDrink.name}</h4>
                  <span className="text-xs font-bold text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded-full border border-amber-600/40">
                    🎟️ {selectedDrink.ticketCost} Tickets
                  </span>
                </div>
                <p className="text-xs text-amber-300/90 font-cozy">
                  {isBrewing
                    ? 'Grinding fresh beans & extracting espresso...'
                    : justBrewed
                    ? '✨ Freshly brewed! Sipping at your desk...'
                    : `Ready to brew! Costs ${selectedDrink.ticketCost} tickets`}
                </p>
                {isBrewing && (
                  <div className="w-48 bg-purple-950 h-2 rounded-full mt-2 overflow-hidden border border-amber-500/30">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-400 h-full transition-all duration-150"
                      style={{ width: `${brewProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleStartBrew}
                disabled={isBrewing || !canAffordDrink}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-cozy font-bold text-xs shadow-lg transition-all active:scale-95"
              >
                <Coffee className="w-4 h-4" />
                <span>
                  {isBrewing ? `Extracting (${brewProgress}%)` : canAffordDrink ? `Brew (-${selectedDrink.ticketCost} 🎟️)` : `Need ${selectedDrink.ticketCost - tickets} 🎟️`}
                </span>
              </button>

              <button
                onClick={handleSendRound}
                disabled={isBrewing || !canAffordRound}
                title="Send a round of coffee to everyone in the room! Costs 20 tickets"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-purple-900/60 hover:bg-purple-800/80 disabled:opacity-40 disabled:cursor-not-allowed border border-purple-600/50 text-purple-200 text-xs font-cozy rounded-2xl transition-all active:scale-95"
              >
                <Users className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">Treat Room (-20 🎟️)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
