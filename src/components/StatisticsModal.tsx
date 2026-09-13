import React from 'react';
import { Achievement } from '../types';
import { Trophy, Flame, Clock, Award, Target, Sparkles, CheckCircle2, X } from 'lucide-react';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalFocusMinutes: number;
  totalSessions: number;
  currentStreak: number;
  bestStreak: number;
  ticketsEarned: number;
  achievements: Achievement[];
  weeklyFocusData: { day: string; minutes: number }[];
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  isOpen,
  onClose,
  totalFocusMinutes,
  totalSessions,
  currentStreak,
  bestStreak,
  ticketsEarned,
  achievements,
  weeklyFocusData,
}) => {
  if (!isOpen) return null;

  const maxWeekly = Math.max(...weeklyFocusData.map((d) => d.minutes), 60);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="w-full max-w-2xl bg-[#1e1a2f] border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl animate-fade-in text-purple-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-800/40 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl text-amber-300">
              📊
            </div>
            <div>
              <h2 className="font-cozy font-bold text-lg text-white">Focus & Growth Analytics</h2>
              <p className="text-xs text-purple-300">Your co-working productivity habits and milestones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-purple-900/60 text-purple-400 hover:text-white transition-all text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* 1. Core Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <div className="bg-purple-950/70 border border-purple-800/40 rounded-2xl p-3 flex flex-col items-center text-center">
            <Clock className="w-5 h-5 text-purple-400 mb-1" />
            <span className="text-lg font-bold text-white font-mono-timer">
              {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
            </span>
            <span className="text-[10px] text-purple-300 font-cozy">Total Focus Time</span>
          </div>

          <div className="bg-purple-950/70 border border-purple-800/40 rounded-2xl p-3 flex flex-col items-center text-center">
            <Target className="w-5 h-5 text-rose-400 mb-1" />
            <span className="text-lg font-bold text-white font-mono-timer">{totalSessions}</span>
            <span className="text-[10px] text-purple-300 font-cozy">Sessions Completed</span>
          </div>

          <div className="bg-purple-950/70 border border-purple-800/40 rounded-2xl p-3 flex flex-col items-center text-center">
            <Flame className="w-5 h-5 text-orange-400 mb-1" />
            <span className="text-lg font-bold text-orange-300 font-mono-timer">{currentStreak} Days</span>
            <span className="text-[10px] text-purple-300 font-cozy">Daily Streak</span>
          </div>

          <div className="bg-purple-950/70 border border-purple-800/40 rounded-2xl p-3 flex flex-col items-center text-center">
            <Sparkles className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-lg font-bold text-amber-300 font-mono-timer">🎟️ {ticketsEarned}</span>
            <span className="text-[10px] text-purple-300 font-cozy">Tickets Earned</span>
          </div>
        </div>

        {/* 2. Weekly Focus Chart */}
        <div className="bg-purple-950/50 border border-purple-800/30 rounded-2xl p-4 mb-4">
          <h4 className="font-cozy font-bold text-xs text-white mb-3 flex items-center gap-1.5">
            <span>📅 Past 7 Days Focus (Minutes)</span>
          </h4>
          <div className="h-28 flex items-end justify-between gap-2 pt-2 px-2">
            {weeklyFocusData.map((item, idx) => {
              const heightPercent = Math.max(8, (item.minutes / maxWeekly) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[9px] font-mono-timer text-purple-300">{item.minutes}m</span>
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-lg transition-all duration-500 hover:brightness-125"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[10px] font-cozy text-purple-400">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Achievements Rack */}
        <div className="flex-1 overflow-y-auto pr-1">
          <h4 className="font-cozy font-bold text-xs text-white mb-2 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Achievements & Badges</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                  ach.unlocked
                    ? 'bg-purple-950/80 border-amber-500/40 shadow-sm'
                    : 'bg-purple-950/30 border-purple-800/30 opacity-60'
                }`}
              >
                <div className="text-2xl w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-700/40 flex items-center justify-center">
                  {ach.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="font-cozy font-bold text-xs text-white truncate">{ach.title}</h5>
                    {ach.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-purple-300 font-cozy line-clamp-1">{ach.description}</p>
                  {/* Progress bar */}
                  <div className="w-full bg-purple-900/60 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
