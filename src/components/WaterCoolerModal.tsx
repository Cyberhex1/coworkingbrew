import React, { useState } from 'react';
import { soundEngine } from '../utils/audioSynth';
import { Droplet, Sparkles, Heart, Check, Plus, MessageSquare, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WaterCoolerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDrinkWater: (glassesTotal: number) => void;
  onPostMemo: (memoText: string) => void;
}

interface WaterMemo {
  id: string;
  author: string;
  text: string;
  color: string;
  time: string;
}

const INITIAL_MEMOS: WaterMemo[] = [
  {
    id: 'memo-1',
    author: 'Alex',
    text: '“Remember 20-20-20 rule: every 20 mins, look 20 feet away for 20 seconds!” 👀✨',
    color: 'bg-amber-400/90 text-amber-950',
    time: '10m ago',
  },
  {
    id: 'memo-2',
    author: 'Sam',
    text: '“Water is brain fuel! Reaching 8 glasses makes coding bugs 50% easier to solve!” 🧠💧',
    color: 'bg-cyan-300/90 text-cyan-950',
    time: '25m ago',
  },
  {
    id: 'memo-3',
    author: 'Jordan',
    text: '“Sprint deployment today at 3 PM. Let’s crush it team!” 🚀',
    color: 'bg-emerald-300/90 text-emerald-950',
    time: '1h ago',
  },
];

export const WaterCoolerModal: React.FC<WaterCoolerModalProps> = ({
  isOpen,
  onClose,
  onDrinkWater,
  onPostMemo,
}) => {
  const [glassesDrank, setGlassesDrank] = useState<number>(() => {
    return parseInt(localStorage.getItem('ontogether_water_glasses') || '3', 10);
  });
  const [memos, setMemos] = useState<WaterMemo[]>(INITIAL_MEMOS);
  const [newMemoInput, setNewMemoInput] = useState<string>('');
  const [isDispensing, setIsDispensing] = useState<boolean>(false);

  if (!isOpen) return null;

  const targetGlasses = 8;

  const handleDispenseWater = () => {
    if (isDispensing) return;
    setIsDispensing(true);

    soundEngine.playChime('chime');

    setTimeout(() => {
      setIsDispensing(false);
      const nextGlasses = glassesDrank + 1;
      setGlassesDrank(nextGlasses);
      localStorage.setItem('ontogether_water_glasses', nextGlasses.toString());

      soundEngine.playCoin();
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
      onDrinkWater(nextGlasses);
    }, 600);
  };

  const handleAddMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoInput.trim()) return;

    const colors = [
      'bg-amber-300/90 text-amber-950',
      'bg-pink-300/90 text-pink-950',
      'bg-cyan-300/90 text-cyan-950',
      'bg-lime-300/90 text-lime-950',
    ];
    const memo: WaterMemo = {
      id: `memo-${Date.now()}`,
      author: 'You',
      text: newMemoInput.trim(),
      color: colors[Math.floor(Math.random() * colors.length)],
      time: 'Just now',
    };

    setMemos([memo, ...memos]);
    setNewMemoInput('');
    soundEngine.playCoin();
    onPostMemo(memo.text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#131a29] border-2 border-cyan-500/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-950/80 via-[#16253a] to-[#131a29] p-5 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-600/30 border border-cyan-400/50 flex items-center justify-center text-2xl shadow-inner">
              💧
            </div>
            <div>
              <h2 className="font-cozy font-bold text-lg text-white flex items-center gap-2">
                <span>Office Cooler & Hydration Hub</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  38°F Chilled Spring Water
                </span>
              </h2>
              <p className="text-xs text-cyan-200/80 font-cozy">
                Stay refreshed, log your daily 8-glass goal, and share water cooler notes!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 hover:text-white flex items-center justify-center font-bold text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Hydration Tracker Meter */}
          <div className="p-4 rounded-2xl bg-[#1b263b]/80 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-cyan-300 font-cozy font-bold uppercase tracking-wider block mb-1">
                Daily Goal: 8 Glasses (2.0 Liters)
              </span>
              <div className="text-2xl font-bold font-mono-timer text-white flex items-center gap-2">
                <span>💧</span>
                <span>
                  {glassesDrank} / {targetGlasses} Glasses
                </span>
                {glassesDrank >= targetGlasses && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    Goal Reached! 🌟
                  </span>
                )}
              </div>
              <p className="text-xs text-cyan-200/70 font-cozy mt-1">
                Proper hydration boosts cognitive focus and prevents afternoon fatigue.
              </p>
            </div>

            <button
              onClick={handleDispenseWater}
              disabled={isDispensing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-cozy font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <Droplet className={`w-4 h-4 ${isDispensing ? 'animate-bounce' : ''}`} />
              <span>{isDispensing ? 'Pouring Chilled Water...' : 'Dispense Glass (250ml)'}</span>
            </button>
          </div>

          {/* 8 Glasses Visual Meter */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[...Array(targetGlasses)].map((_, i) => {
              const isFilled = i < glassesDrank;
              return (
                <div
                  key={i}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    isFilled
                      ? 'bg-cyan-600/30 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-[#152033]/60 border-cyan-900/40 opacity-60'
                  }`}
                >
                  <span className="text-2xl block mb-1">{isFilled ? '🥛' : '🫙'}</span>
                  <span className="text-[10px] font-mono text-cyan-200 font-bold">
                    {isFilled ? 'Done' : `#${i + 1}`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Water Cooler Chat & Sticky Memos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-cozy font-bold text-cyan-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>💬 Water Cooler Sticky Memos</span>
              </h3>
            </div>

            {/* Post New Memo Form */}
            <form onSubmit={handleAddMemo} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newMemoInput}
                onChange={(e) => setNewMemoInput(e.target.value)}
                placeholder="Stick a supportive memo on the cooler wall..."
                maxLength={90}
                className="flex-1 bg-[#162136] border border-cyan-500/30 rounded-2xl px-4 py-2 text-xs text-white placeholder:text-cyan-300/40 focus:outline-none focus:border-cyan-400 font-cozy"
              />
              <button
                type="submit"
                disabled={!newMemoInput.trim()}
                className="px-4 py-2 bg-cyan-700/80 hover:bg-cyan-600 disabled:opacity-40 text-white rounded-2xl font-cozy text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Note</span>
              </button>
            </form>

            {/* Sticky Memos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {memos.map((memo) => (
                <div
                  key={memo.id}
                  className={`p-3.5 rounded-2xl shadow-md transform rotate-[-1deg] hover:rotate-0 transition-transform ${memo.color}`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold opacity-75 mb-1.5 font-mono">
                    <span>{memo.author}</span>
                    <span>{memo.time}</span>
                  </div>
                  <p className="text-xs font-cozy font-medium leading-snug">{memo.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
