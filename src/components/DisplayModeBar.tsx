import React from 'react';
import { DisplayMode } from '../types';
import { Layout, Sidebar, Sticker, Sparkles, Maximize } from 'lucide-react';

interface DisplayModeBarProps {
  currentMode: DisplayMode;
  onChangeMode: (mode: DisplayMode) => void;
}

export const DisplayModeBar: React.FC<DisplayModeBarProps> = ({ currentMode, onChangeMode }) => {
  return (
    <div className="flex items-center gap-1 bg-[#1e1a2f]/90 backdrop-blur-md p-1 rounded-2xl border border-purple-500/30 shadow-lg text-xs font-cozy select-none">
      <button
        onClick={() => onChangeMode('full')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
          currentMode === 'full'
            ? 'bg-purple-600 text-white font-semibold shadow-md'
            : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
        }`}
      >
        <Layout className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Full Studio</span>
      </button>

      <button
        onClick={() => onChangeMode('docked')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
          currentMode === 'docked'
            ? 'bg-purple-600 text-white font-semibold shadow-md'
            : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
        }`}
      >
        <Sidebar className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Docked Side</span>
      </button>

      <button
        onClick={() => onChangeMode('sticker')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
          currentMode === 'sticker'
            ? 'bg-purple-600 text-white font-semibold shadow-md'
            : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
        }`}
      >
        <Sticker className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sticker Mini</span>
      </button>

      <button
        onClick={() => onChangeMode('zen')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
          currentMode === 'zen'
            ? 'bg-purple-600 text-white font-semibold shadow-md'
            : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
        }`}
      >
        <Maximize className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Zen Room</span>
      </button>
    </div>
  );
};
