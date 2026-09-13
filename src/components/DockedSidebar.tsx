import React from 'react';
import { RoomPeer, PomodoroMode, PomodoroSettings, TaskItem } from '../types';
import { AvatarRenderer } from './AvatarRenderer';
import { DeskRenderer } from './DeskRenderer';
import { PomodoroTimer } from './PomodoroTimer';
import { TodoList } from './TodoList';
import { Maximize2, Sparkles, Music, Gamepad2 } from 'lucide-react';

interface DockedSidebarProps {
  userPeer: RoomPeer;
  mode: PomodoroMode;
  timeRemaining: number;
  isRunning: boolean;
  completedSessions: number;
  settings: PomodoroSettings;
  tasks: TaskItem[];
  activeTaskId: string | null;
  tickets: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onSkip: () => void;
  onModeChange: (mode: PomodoroMode) => void;
  onAddTask: (title: string, category: TaskItem['category'], est: number, priority: TaskItem['priority']) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSetActiveTask: (id: string) => void;
  onExpandToFull: () => void;
  onOpenMixer: () => void;
  onOpenBreakGames: () => void;
}

export const DockedSidebar: React.FC<DockedSidebarProps> = ({
  userPeer,
  mode,
  timeRemaining,
  isRunning,
  completedSessions,
  settings,
  tasks,
  activeTaskId,
  tickets,
  onTogglePlay,
  onReset,
  onSkip,
  onModeChange,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onSetActiveTask,
  onExpandToFull,
  onOpenMixer,
  onOpenBreakGames,
}) => {
  return (
    <div className="w-full max-w-sm mx-auto h-screen bg-[#181524] border-x border-purple-500/30 p-4 flex flex-col justify-between overflow-y-auto select-none space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-purple-800/40 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="font-cozy font-bold text-sm text-white">CoworkingBrew Companion</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMixer}
            title="Ambient Music Mixer"
            className="p-1.5 rounded-xl bg-purple-900/60 text-purple-300 hover:text-white"
          >
            <Music className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onExpandToFull}
            title="Full Studio Mode"
            className="p-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini Avatar & Desk Banner */}
      <div className="bg-purple-950/60 rounded-2xl p-3 border border-purple-800/40 flex flex-col items-center">
        <AvatarRenderer avatar={userPeer.avatar} size={90} animate={true} showActivityProp={true} />
        <div className="w-full max-w-[160px] -mt-5">
          <DeskRenderer desk={userPeer.desk} />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-cozy text-white font-semibold">{userPeer.name}</span>
          <span className="text-xs font-cozy font-bold text-amber-300">🎟️ {tickets}</span>
        </div>
      </div>

      {/* Pomodoro Timer */}
      <PomodoroTimer
        mode={mode}
        timeRemaining={timeRemaining}
        isRunning={isRunning}
        completedSessions={completedSessions}
        settings={settings}
        onTogglePlay={onTogglePlay}
        onReset={onReset}
        onSkip={onSkip}
        onModeChange={onModeChange}
        onOpenBreakGames={onOpenBreakGames}
      />

      {/* Todo List */}
      <div className="flex-1 min-h-[220px]">
        <TodoList
          tasks={tasks}
          activeTaskId={activeTaskId}
          onAddTask={onAddTask}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onSetActiveTask={onSetActiveTask}
        />
      </div>
    </div>
  );
};
