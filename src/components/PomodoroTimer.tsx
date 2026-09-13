import React, { useState } from 'react';
import { PomodoroMode, PomodoroSettings } from '../types';
import { Play, Pause, RotateCcw, SkipForward, Flame, Sparkles, Gamepad2, Settings, Plus, Minus, Check, Sliders } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';

interface PomodoroTimerProps {
  mode: PomodoroMode;
  timeRemaining: number; // in seconds
  isRunning: boolean;
  completedSessions: number;
  settings: PomodoroSettings;
  onTogglePlay: () => void;
  onReset: () => void;
  onSkip: () => void;
  onModeChange: (newMode: PomodoroMode) => void;
  onOpenBreakGames: () => void;
  onUpdateSettings?: (newSettings: PomodoroSettings) => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  mode,
  timeRemaining,
  isRunning,
  completedSessions,
  settings,
  onTogglePlay,
  onReset,
  onSkip,
  onModeChange,
  onOpenBreakGames,
  onUpdateSettings,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTotalSeconds = () => {
    switch (mode) {
      case 'work':
        return settings.workDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
    }
  };

  const totalSecs = getTotalSeconds();
  const progressPercent = Math.max(0, Math.min(100, ((totalSecs - timeRemaining) / totalSecs) * 100));

  // Circular progress calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const getModeTheme = () => {
    switch (mode) {
      case 'work':
        return {
          title: 'Deep Focus',
          color: 'text-purple-400',
          strokeColor: '#c084fc',
          badge: 'bg-purple-900/60 border-purple-500/40 text-purple-200',
        };
      case 'shortBreak':
        return {
          title: 'Short Rest',
          color: 'text-emerald-400',
          strokeColor: '#34d399',
          badge: 'bg-emerald-900/60 border-emerald-500/40 text-emerald-200',
        };
      case 'longBreak':
        return {
          title: 'Cozy Long Rest',
          color: 'text-sky-400',
          strokeColor: '#38bdf8',
          badge: 'bg-sky-900/60 border-sky-500/40 text-sky-200',
        };
    }
  };

  const currentTheme = getModeTheme();

  const handleUpdateDuration = (key: 'workDuration' | 'shortBreakDuration' | 'longBreakDuration' | 'sessionsBeforeLongBreak', delta: number) => {
    if (!onUpdateSettings) return;
    const minVal = key === 'sessionsBeforeLongBreak' ? 1 : 1;
    const maxVal = key === 'sessionsBeforeLongBreak' ? 12 : 120;
    const newVal = Math.max(minVal, Math.min(maxVal, (settings[key] || 1) + delta));
    onUpdateSettings({ ...settings, [key]: newVal });
  };

  const handleSetExactValue = (key: 'workDuration' | 'shortBreakDuration' | 'longBreakDuration' | 'sessionsBeforeLongBreak', val: number) => {
    if (!onUpdateSettings) return;
    onUpdateSettings({ ...settings, [key]: val });
  };

  return (
    <div className="bg-[#1e1a2f]/90 backdrop-blur-md border border-purple-500/20 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col items-center justify-between text-purple-100 select-none relative overflow-hidden w-full">
      {/* Header with Mode Switcher Tabs and Settings Toggle */}
      <div className="w-full flex items-center justify-between gap-2 mb-3 min-w-0">
        <div className="flex items-center gap-1 p-1 bg-purple-950/80 rounded-xl border border-purple-800/40 text-xs font-cozy font-medium flex-1 min-w-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => onModeChange('work')}
            className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-lg transition-all text-center whitespace-nowrap ${
              mode === 'work'
                ? 'bg-purple-600 text-white font-semibold shadow-md'
                : 'text-purple-300 hover:text-white'
            }`}
            title={`Focus (${settings.workDuration}m)`}
          >
            🎯 Focus ({settings.workDuration}m)
          </button>
          <button
            onClick={() => onModeChange('shortBreak')}
            className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-lg transition-all text-center whitespace-nowrap ${
              mode === 'shortBreak'
                ? 'bg-emerald-600 text-white font-semibold shadow-md'
                : 'text-purple-300 hover:text-white'
            }`}
            title={`Break (${settings.shortBreakDuration}m)`}
          >
            ☕ Break ({settings.shortBreakDuration}m)
          </button>
          <button
            onClick={() => onModeChange('longBreak')}
            className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-lg transition-all text-center whitespace-nowrap ${
              mode === 'longBreak'
                ? 'bg-sky-600 text-white font-semibold shadow-md'
                : 'text-purple-300 hover:text-white'
            }`}
            title={`Rest (${settings.longBreakDuration}m)`}
          >
            🛋️ Rest ({settings.longBreakDuration}m)
          </button>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`shrink-0 p-2 rounded-xl border transition-all ${
            showSettings
              ? 'bg-purple-600 border-purple-400 text-white'
              : 'bg-purple-950/80 border-purple-800/60 text-purple-300 hover:text-white'
          }`}
          title="Customize focus, break, rest times and rounds"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Panel Drawer */}
      {showSettings ? (
        <div className="w-full my-2 bg-purple-950/70 border border-purple-700/50 rounded-2xl p-4 flex flex-col gap-3.5 animate-fadeIn text-xs font-cozy">
          <div className="flex items-center justify-between border-b border-purple-800/50 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-purple-400" />
              <span>Timer & Rounds Settings</span>
            </span>
            <button
              onClick={() => setShowSettings(false)}
              className="text-purple-400 hover:text-white font-bold"
            >
              Done
            </button>
          </div>

          {/* 1. Focus Duration */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-medium block">🎯 Focus Time</span>
              <span className="text-[10px] text-purple-400">Deep concentration period</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateDuration('workDuration', -5)}
                className="w-7 h-7 rounded-lg bg-purple-900/80 hover:bg-purple-800 flex items-center justify-center text-purple-200"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center font-mono font-bold text-white text-sm">
                {settings.workDuration}m
              </span>
              <button
                onClick={() => handleUpdateDuration('workDuration', 5)}
                className="w-7 h-7 rounded-lg bg-purple-900/80 hover:bg-purple-800 flex items-center justify-center text-purple-200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. Break Duration */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-medium block">☕ Short Break</span>
              <span className="text-[10px] text-purple-400">Between focus rounds</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateDuration('shortBreakDuration', -1)}
                className="w-7 h-7 rounded-lg bg-purple-900/80 hover:bg-purple-800 flex items-center justify-center text-purple-200"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center font-mono font-bold text-emerald-300 text-sm">
                {settings.shortBreakDuration}m
              </span>
              <button
                onClick={() => handleUpdateDuration('shortBreakDuration', 1)}
                className="w-7 h-7 rounded-lg bg-purple-900/80 hover:bg-purple-800 flex items-center justify-center text-purple-200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3. Rest Duration */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-medium block">🛋️ Long Rest</span>
              <span className="text-[10px] text-purple-400">After completing cycle rounds</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateDuration('longBreakDuration', -5)}
                className="w-7 h-7 rounded-lg bg-purple-900/80 hover:bg-purple-800 flex items-center justify-center text-purple-200"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center font-mono font-bold text-sky-300 text-sm">
                {settings.longBreakDuration}m
              </span>
              <button
                onClick={() => handleUpdateDuration('longBreakDuration', 5)}
                className="w-7 h-7 rounded-lg bg-purple-900/80 hover:bg-purple-800 flex items-center justify-center text-purple-200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 4. Rounds before Long Rest */}
          <div className="flex items-center justify-between border-t border-purple-800/40 pt-2">
            <div>
              <span className="text-white font-medium block">🍅 Rounds Per Cycle</span>
              <span className="text-[10px] text-purple-400">Sessions before long rest</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateDuration('sessionsBeforeLongBreak', -1)}
                className="w-7 h-7 rounded-lg bg-purple-900/80 hover:bg-purple-800 flex items-center justify-center text-purple-200"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center font-mono font-bold text-amber-300 text-sm">
                {settings.sessionsBeforeLongBreak || 4}
              </span>
              <button
                onClick={() => handleUpdateDuration('sessionsBeforeLongBreak', 1)}
                className="w-7 h-7 rounded-lg bg-purple-900/80 hover:bg-purple-800 flex items-center justify-center text-purple-200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="border-t border-purple-800/40 pt-2 flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-[10px] text-purple-400">Presets:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  handleSetExactValue('workDuration', 25);
                  handleSetExactValue('shortBreakDuration', 5);
                  handleSetExactValue('longBreakDuration', 15);
                  handleSetExactValue('sessionsBeforeLongBreak', 4);
                }}
                className="px-2 py-1 bg-purple-900 hover:bg-purple-800 rounded-lg text-[10px] text-purple-200 font-semibold transition-all active:scale-95"
              >
                Classic 25/5
              </button>
              <button
                onClick={() => {
                  handleSetExactValue('workDuration', 50);
                  handleSetExactValue('shortBreakDuration', 10);
                  handleSetExactValue('longBreakDuration', 20);
                  handleSetExactValue('sessionsBeforeLongBreak', 3);
                }}
                className="px-2 py-1 bg-purple-900 hover:bg-purple-800 rounded-lg text-[10px] text-purple-200 font-semibold transition-all active:scale-95"
              >
                Deep 50/10
              </button>
              <button
                onClick={() => {
                  handleSetExactValue('workDuration', 90);
                  handleSetExactValue('shortBreakDuration', 20);
                  handleSetExactValue('longBreakDuration', 30);
                  handleSetExactValue('sessionsBeforeLongBreak', 2);
                }}
                className="px-2 py-1 bg-purple-900 hover:bg-purple-800 rounded-lg text-[10px] text-purple-200 font-semibold transition-all active:scale-95"
              >
                Flow 90/20
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Circular Radial Countdown Timer */}
          <div className="relative my-2 flex items-center justify-center">
            <svg className="w-44 h-44 transform -rotate-90">
              {/* Background circle track */}
              <circle
                cx="88"
                cy="88"
                r={radius}
                className="stroke-purple-950/60"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Progress circle */}
              <circle
                cx="88"
                cy="88"
                r={radius}
                stroke={currentTheme.strokeColor}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 ease-out"
              />
            </svg>

            {/* Center Timer Time & Status */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-mono-timer text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-md">
                {formatTime(timeRemaining)}
              </span>
              <span className={`text-xs font-cozy font-medium mt-1 ${currentTheme.color}`}>
                {currentTheme.title}
              </span>
            </div>
          </div>

          {/* 3. Session Tracker (Tomatoes / Pomodoros) with Round Controls */}
          <div className="flex items-center justify-center gap-2 my-2 bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-800/40">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-cozy text-purple-300">Rounds:</span>
              {[...Array(settings.sessionsBeforeLongBreak || 4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-transform ${
                    i < (completedSessions % (settings.sessionsBeforeLongBreak || 4))
                      ? 'bg-rose-500/80 text-white shadow-[0_0_8px_#f43f5e] scale-110'
                      : 'bg-purple-950/80 border border-purple-800 text-purple-400'
                  }`}
                >
                  🍅
                </div>
              ))}
            </div>

            {/* Round increment / decrement buttons */}
            <div className="flex items-center gap-1 ml-2 border-l border-purple-800/50 pl-2">
              <button
                onClick={() => handleUpdateDuration('sessionsBeforeLongBreak', -1)}
                title="Decrease rounds"
                className="w-5 h-5 rounded hover:bg-purple-800/60 flex items-center justify-center text-purple-300 hover:text-white"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-[11px] font-mono text-purple-300 font-bold">
                {settings.sessionsBeforeLongBreak || 4}
              </span>
              <button
                onClick={() => handleUpdateDuration('sessionsBeforeLongBreak', 1)}
                title="Increase rounds"
                className="w-5 h-5 rounded hover:bg-purple-800/60 flex items-center justify-center text-purple-300 hover:text-white"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 4. Timer Controls */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={onReset}
              title="Reset timer"
              className="p-2.5 rounded-full bg-purple-950/80 hover:bg-purple-900 border border-purple-800/60 text-purple-300 hover:text-white transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                soundEngine.playChime('chime');
                onTogglePlay();
              }}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-cozy font-bold text-sm text-white shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40'
                  : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/40'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                  <span>Start Focus</span>
                </>
              )}
            </button>

            <button
              onClick={onSkip}
              title="Skip session"
              className="p-2.5 rounded-full bg-purple-950/80 hover:bg-purple-900 border border-purple-800/60 text-purple-300 hover:text-white transition-all active:scale-95"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Break Time Mini-Game Prompt */}
          {(mode === 'shortBreak' || mode === 'longBreak') && (
            <button
              onClick={onOpenBreakGames}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl font-cozy text-xs font-bold text-white shadow-lg transition-all animate-pulse"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>🎮 Break Mini-Games (Earn 🎟️)</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
