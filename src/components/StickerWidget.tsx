import React from 'react';
import { AvatarConfig, DeskConfig, PomodoroMode } from '../types';
import { AvatarRenderer } from './AvatarRenderer';
import { DeskRenderer } from './DeskRenderer';
import { Play, Pause, Maximize2, Sparkles } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';

interface StickerWidgetProps {
  avatar: AvatarConfig;
  desk: DeskConfig;
  timeRemaining: number;
  isRunning: boolean;
  mode: PomodoroMode;
  activeTaskTitle: string;
  tickets: number;
  onTogglePlay: () => void;
  onExpandToFull: () => void;
}

export const StickerWidget: React.FC<StickerWidgetProps> = ({
  avatar,
  desk,
  timeRemaining,
  isRunning,
  mode,
  activeTaskTitle,
  tickets,
  onTogglePlay,
  onExpandToFull,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none animate-fade-in">
      <div className="bg-[#1e1a2f]/95 backdrop-blur-xl border-2 border-purple-400/50 rounded-3xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.6)] flex flex-col items-center w-64 text-purple-100 ring-4 ring-purple-950/40">
        {/* Top bar with tickets and expand */}
        <div className="w-full flex items-center justify-between mb-1">
          <span className="text-[11px] font-cozy font-bold text-amber-300 flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-600/40">
            🎟️ {tickets}
          </span>
          <button
            onClick={onExpandToFull}
            title="Expand to Full Studio"
            className="p-1 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-300 hover:text-white transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status bubble */}
        {activeTaskTitle && (
          <div className="text-[10px] font-cozy text-purple-200 bg-purple-900/60 border border-purple-700/50 px-2.5 py-1 rounded-xl truncate max-w-[200px] mb-1">
            {activeTaskTitle}
          </div>
        )}

        {/* Chibi Avatar & Desk */}
        <div className="flex flex-col items-center justify-center my-1">
          <AvatarRenderer avatar={avatar} size={110} animate={true} showActivityProp={true} />
          <div className="w-full max-w-[170px] -mt-5">
            <DeskRenderer desk={desk} />
          </div>
        </div>

        {/* Mini Timer & Controls */}
        <div className="w-full mt-2 bg-purple-950/80 rounded-2xl p-2.5 border border-purple-800/40 flex items-center justify-between">
          <div>
            <span className="font-mono-timer text-lg font-bold text-white block leading-none">
              {formatTime(timeRemaining)}
            </span>
            <span className="text-[9px] font-cozy text-purple-300 capitalize">
              {mode === 'work' ? '🎯 Focus' : '☕ Break'}
            </span>
          </div>

          <button
            onClick={() => {
              soundEngine.playChime('chime');
              onTogglePlay();
            }}
            className={`p-2 rounded-xl text-white font-bold transition-all shadow-md active:scale-95 ${
              isRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-purple-600 hover:bg-purple-500'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
