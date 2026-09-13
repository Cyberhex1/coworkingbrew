import React, { useState } from 'react';
import { RoomPeer, TimeOfDay, CoWorkingRoom, PomodoroMode, TaskItem, TimeBlock } from '../types';
import { AvatarRenderer } from './AvatarRenderer';
import { DeskRenderer } from './DeskRenderer';
import { Pixel3DWorld } from './Pixel3DWorld';
import { soundEngine } from '../utils/audioSynth';
import { Sparkles, Sun, Moon, Sunset, CloudRain, Heart, Coffee, ThumbsUp, Flame, MessageSquarePlus, Box, Layers } from 'lucide-react';

interface EnvironmentCanvasProps {
  room: CoWorkingRoom;
  peers: RoomPeer[];
  userPeer: RoomPeer;
  timeOfDay: TimeOfDay;
  pomodoroMode?: PomodoroMode;
  isTimerRunning?: boolean;
  onTimeOfDayChange: (time: TimeOfDay) => void;
  onSendReaction: (emoji: string) => void;
  onSendHighFive: (targetPeerId: string) => void;
  onSendCoffee: (targetPeerId: string) => void;
  onPeerPetClick: (peerId: string) => void;
  onOpenCustomizer: () => void;
  onOpenBreakGames?: () => void;
  tasks?: TaskItem[];
  timeBlocks?: TimeBlock[];
  onAddTask?: (title: string, category: 'work' | 'study' | 'creative' | 'chores', pomodoros: number) => void;
  onToggleTask?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onAddTickets?: (amount: number) => void;
  tickets?: number;
  onUpdateDesk?: (newDesk: any) => void;
  focusMinutesToday?: number;
  streakDays?: number;
}

export const EnvironmentCanvas: React.FC<EnvironmentCanvasProps> = ({
  room,
  peers,
  userPeer,
  timeOfDay,
  pomodoroMode = 'work',
  isTimerRunning = false,
  onTimeOfDayChange,
  onSendReaction,
  onSendHighFive,
  onSendCoffee,
  onPeerPetClick,
  onOpenCustomizer,
  onOpenBreakGames,
  tasks = [],
  timeBlocks = [],
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onAddTickets,
  tickets = 50,
  onUpdateDesk,
  focusMinutesToday = 75,
  streakDays = 3,
}) => {
  const [engineMode, setEngineMode] = useState<'3d_voxel' | '2d_chibi'>('3d_voxel');
  const [selectedPeer, setSelectedPeer] = useState<RoomPeer | null>(null);
  const [showEmoteMenu, setShowEmoteMenu] = useState(false);

  // If 3D Voxel Engine is selected (default)
  if (engineMode === '3d_voxel') {
    return (
      <div className="relative">
        <Pixel3DWorld
          room={room}
          peers={peers.filter((p) => !p.isUser)}
          userPeer={userPeer}
          timeOfDay={timeOfDay}
          pomodoroMode={pomodoroMode}
          isTimerRunning={isTimerRunning}
          onTimeOfDayChange={onTimeOfDayChange}
          onSendReaction={onSendReaction}
          onSendHighFive={onSendHighFive}
          onSendCoffee={onSendCoffee}
          onPeerPetClick={() => onPeerPetClick(userPeer.id)}
          onOpenCustomizer={onOpenCustomizer}
          onOpenBreakGames={onOpenBreakGames}
          tasks={tasks}
          timeBlocks={timeBlocks}
          onAddTask={onAddTask}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onAddTickets={onAddTickets}
          tickets={tickets}
          onUpdateDesk={onUpdateDesk}
          focusMinutesToday={focusMinutesToday}
          streakDays={streakDays}
          onSwitchTo2D={() => setEngineMode('2d_chibi')}
        />
      </div>
    );
  }

  const quickEmotes = ['☕', '👏', '💖', '🔥', '✨', '💤', '🎯', '🚀', '🐱', '🎉'];

  // Environment visual setups for 2D fallback
  const getThemeBackground = () => {
    switch (room.theme) {
      case 'tea_loft':
        return timeOfDay === 'night'
          ? 'bg-gradient-to-b from-[#1a1216] via-[#2a1b24] to-[#120d13]'
          : timeOfDay === 'sunset'
          ? 'bg-gradient-to-b from-[#4a2829] via-[#633a39] to-[#2b171c]'
          : timeOfDay === 'rainy'
          ? 'bg-gradient-to-b from-[#1e242b] via-[#242e38] to-[#141a20]'
          : 'bg-gradient-to-b from-[#e8d5b5] via-[#f5e6cc] to-[#c9ad87]';
      case 'treehouse':
        return timeOfDay === 'night'
          ? 'bg-gradient-to-b from-[#091b12] via-[#0f2d1e] to-[#06120b]'
          : timeOfDay === 'sunset'
          ? 'bg-gradient-to-b from-[#3f2b18] via-[#4d321d] to-[#1f150c]'
          : timeOfDay === 'rainy'
          ? 'bg-gradient-to-b from-[#1b2a26] via-[#243833] to-[#121c19]'
          : 'bg-gradient-to-b from-[#86efac] via-[#bbf7d0] to-[#4ade80]';
      case 'lilypad':
        return 'bg-gradient-to-b from-[#070c1e] via-[#0f1d3a] to-[#040813]';
      case 'cafe':
        return timeOfDay === 'night'
          ? 'bg-gradient-to-b from-[#1f1518] via-[#2b1d22] to-[#120c0f]'
          : timeOfDay === 'rainy'
          ? 'bg-gradient-to-b from-[#1b232a] via-[#232f38] to-[#11171d]'
          : 'bg-gradient-to-b from-[#451a03] via-[#78350f] to-[#291b0f]';
      case 'greenhouse':
        return timeOfDay === 'night'
          ? 'bg-gradient-to-b from-[#062419] via-[#0b3828] to-[#04160f]'
          : 'bg-gradient-to-b from-[#dcfce7] via-[#f0fdf4] to-[#86efac]';
      case 'arcade':
      default:
        return 'bg-gradient-to-b from-[#180e29] via-[#271744] to-[#0f091a]';
    }
  };

  return (
    <div
      className={`relative w-full h-[380px] sm:h-[440px] md:h-[480px] rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl transition-all duration-700 select-none ${getThemeBackground()}`}
    >
      {/* 3D Switch Button */}
      <div className="absolute top-4 right-52 sm:right-64 z-30 hidden md:block">
        <button
          onClick={() => setEngineMode('3d_voxel')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#181524]/90 backdrop-blur-md border border-purple-500/40 text-purple-200 hover:text-white text-xs font-cozy shadow-lg transition-all"
        >
          <Box className="w-3.5 h-3.5 text-purple-400" />
          <span>3D Voxel Engine</span>
        </button>
      </div>
      {/* 1. Dynamic Room Background Scenery Elements */}
      {/* Japanese Tea Loft Shoji & Lanterns */}
      {room.theme === 'tea_loft' && (
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-0 right-0 h-16 border-b-4 border-amber-900/40 flex justify-around">
            <div className="w-10 h-16 bg-amber-400/20 rounded-b-lg border-2 border-amber-800/40 animate-pulse" />
            <div className="w-10 h-16 bg-amber-400/20 rounded-b-lg border-2 border-amber-800/40 animate-pulse" />
            <div className="w-10 h-16 bg-amber-400/20 rounded-b-lg border-2 border-amber-800/40 animate-pulse" />
          </div>
          {/* Tatami Floor pattern */}
          <div className="absolute bottom-0 inset-x-0 h-48 border-t-2 border-amber-950/30 grid grid-cols-6 opacity-30">
            <div className="border-r border-amber-950/40" />
            <div className="border-r border-amber-950/40" />
            <div className="border-r border-amber-950/40" />
            <div className="border-r border-amber-950/40" />
            <div className="border-r border-amber-950/40" />
          </div>
        </div>
      )}

      {/* Treehouse Foliage & Hanging Fairy Lights */}
      {room.theme === 'treehouse' && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Canopy leaves top */}
          <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-emerald-950/80 to-transparent flex justify-around items-start">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-12 h-14 bg-emerald-700/40 rounded-b-full transform rotate-12 -mt-4 animate-float-gentle"
                style={{ animationDelay: `${i * 0.4}s` }}
              />
            ))}
          </div>
          {/* Glowing fairy string lights */}
          <div className="absolute top-12 inset-x-8 flex justify-between">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-amber-200 shadow-[0_0_12px_#fbbf24] animate-ping"
                style={{ animationDuration: `${2 + (i % 3)}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lilypad Starry Night & Fireflies */}
      {room.theme === 'lilypad' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Moon */}
          <div className="absolute top-6 right-12 w-16 h-16 rounded-full bg-amber-100 shadow-[0_0_35px_rgba(254,240,138,0.7)]" />
          {/* Water reflection ripples */}
          <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-blue-950/90 to-transparent opacity-60">
            <div className="w-full h-full border-b-2 border-cyan-400/20 animate-pulse" />
          </div>
          {/* Glowing fireflies */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_10px_#fde047] animate-float-gentle"
              style={{
                top: `${20 + (i * 7) % 65}%`,
                left: `${10 + (i * 11) % 85}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Rainy Cafe Window droplets */}
      {room.theme === 'cafe' && (
        <div className="absolute inset-0 pointer-events-none opacity-35">
          {/* Window frames */}
          <div className="absolute inset-x-0 top-0 h-full grid grid-cols-4 border-b border-amber-950/40">
            <div className="border-r border-amber-950/30" />
            <div className="border-r border-amber-950/30" />
            <div className="border-r border-amber-950/30" />
          </div>
          {/* Rain droplet streaks */}
          <div className="absolute inset-0 flex justify-around">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 h-16 bg-cyan-200/40 rounded-full animate-bounce"
                style={{ animationDuration: '1.4s', animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        {/* Room Title & Theme badge */}
        <div className="bg-[#181524]/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-purple-500/40 shadow-lg flex items-center gap-2">
          <span className="text-xs font-cozy font-bold text-white flex items-center gap-1.5">
            <span>🏢</span>
            <span>{room.name}</span>
          </span>
          <span className="text-[10px] bg-purple-900/70 border border-purple-700/50 px-2 py-0.5 rounded-full text-purple-300 font-mono-timer">
            2D Chibi Office
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Time of Day & Lighting Switcher */}
          <div className="flex items-center bg-[#181524]/90 backdrop-blur-md p-1 rounded-2xl border border-purple-500/40 shadow-lg">
            <button
              onClick={() => onTimeOfDayChange('day')}
              title="Sunny Day"
              className={`p-1.5 rounded-xl transition-all ${timeOfDay === 'day' ? 'bg-amber-500 text-white shadow-md' : 'text-purple-300 hover:text-white'}`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTimeOfDayChange('sunset')}
              title="Golden Sunset"
              className={`p-1.5 rounded-xl transition-all ${timeOfDay === 'sunset' ? 'bg-orange-500 text-white shadow-md' : 'text-purple-300 hover:text-white'}`}
            >
              <Sunset className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTimeOfDayChange('night')}
              title="Cozy Night"
              className={`p-1.5 rounded-xl transition-all ${timeOfDay === 'night' ? 'bg-indigo-600 text-white shadow-md' : 'text-purple-300 hover:text-white'}`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTimeOfDayChange('rainy')}
              title="Rainy Mood"
              className={`p-1.5 rounded-xl transition-all ${timeOfDay === 'rainy' ? 'bg-cyan-600 text-white shadow-md' : 'text-purple-300 hover:text-white'}`}
            >
              <CloudRain className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Unified View Mode Switcher Pill */}
          <div className="flex items-center bg-[#181524]/90 backdrop-blur-md p-1 rounded-2xl border border-purple-500/40 shadow-lg text-xs font-cozy">
            <button
              onClick={() => setEngineMode('3d_voxel')}
              className="px-2.5 py-1 rounded-xl transition-all text-purple-300 hover:text-white hover:bg-purple-900/40"
            >
              3D View
            </button>
            <button
              onClick={() => setEngineMode('3d_voxel')}
              className="px-2.5 py-1 rounded-xl transition-all text-purple-300 hover:text-white hover:bg-purple-900/40"
            >
              Orbit 3D
            </button>
            <button
              onClick={() => setEngineMode('3d_voxel')}
              className="px-2.5 py-1 rounded-xl transition-all text-purple-300 hover:text-white hover:bg-purple-900/40"
            >
              Desk View
            </button>
            <button
              className="px-2.5 py-1 rounded-xl transition-all bg-purple-600 text-white font-bold"
            >
              2D View
            </button>
          </div>
        </div>
      </div>

      {/* 2. Co-Working Desks and Peers Layout */}
      <div className="absolute inset-x-2 sm:inset-x-6 bottom-4 sm:bottom-6 z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 items-end justify-items-center">
        {peers.map((peer) => {
          const isMe = peer.isUser;
          return (
            <div
              key={peer.id}
              onClick={() => setSelectedPeer(peer)}
              className={`relative flex flex-col items-center group cursor-pointer transition-all duration-300 p-1 rounded-xl ${
                isMe ? 'ring-2 ring-purple-400/60 bg-purple-950/20' : 'hover:bg-purple-950/20'
              }`}
            >
              {/* Live Emoji Reaction Burst */}
              {peer.reactionEmoji && (
                <div className="absolute -top-12 sm:-top-14 z-30 text-2xl sm:text-3xl animate-bounce drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                  {peer.reactionEmoji}
                </div>
              )}

              {/* Status / Active Task Speech Bubble */}
              {peer.currentTask && (
                <div className="max-w-[130px] sm:max-w-[160px] bg-[#120e22]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-purple-700/60 text-center shadow-lg text-[10px] sm:text-xs font-cozy text-purple-200 truncate mb-1 animate-float-gentle group-hover:max-w-none group-hover:whitespace-normal group-hover:z-30">
                  ⚡ {peer.currentTask}
                </div>
              )}

              {/* Chibi Avatar */}
              <div className="relative -mb-6 z-10 transform hover:scale-105 transition-transform">
                <AvatarRenderer
                  avatar={peer.avatar}
                  size={95}
                  animate={true}
                  showActivityProp={true}
                />
              </div>

              {/* Desk Setup & Pet */}
              <div className="w-full max-w-[170px] sm:max-w-[190px]">
                <DeskRenderer
                  desk={peer.desk}
                  onPetClick={() => onPeerPetClick(peer.id)}
                />
              </div>

              {/* Unified Crisp Peer Nametag Badge */}
              <div
                className={`flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.6)] backdrop-blur-md border text-xs font-cozy transition-all ${
                  isMe
                    ? 'bg-gradient-to-r from-purple-900/95 to-indigo-900/95 border-purple-300 text-white ring-1 ring-purple-300/80'
                    : 'bg-[#18122c]/95 border-purple-500/70 text-purple-100 hover:border-amber-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full inline-block ${isMe ? 'bg-emerald-400 animate-pulse' : peer.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span className="font-bold tracking-wide drop-shadow-sm whitespace-nowrap truncate max-w-[85px]">
                  {peer.name}
                </span>
                {isMe && (
                  <span className="text-[9px] bg-purple-600 text-purple-100 px-1.5 py-0.2 rounded-md font-semibold">
                    YOU
                  </span>
                )}
                <span className="text-amber-400 font-bold flex items-center text-[10px] font-mono-timer">
                  🔥{peer.streakDays}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Quick Reaction & Emote Bar */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setShowEmoteMenu(!showEmoteMenu)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/90 backdrop-blur-md border border-purple-400/40 hover:border-purple-300 text-purple-200 hover:text-white text-xs font-cozy font-medium shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>React</span>
        </button>

        {showEmoteMenu && (
          <div className="flex items-center gap-1 p-1 bg-purple-950/95 backdrop-blur-lg border border-purple-400/40 rounded-full shadow-2xl animate-fade-in">
            {quickEmotes.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  soundEngine.playCoin();
                  onSendReaction(emoji);
                  setShowEmoteMenu(false);
                }}
                className="w-7 h-7 flex items-center justify-center hover:bg-purple-800/50 rounded-full text-base transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Right Avatar Customizer Quick Launcher */}
      <div className="absolute bottom-3 right-4 z-20">
        <button
          onClick={onOpenCustomizer}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600/90 hover:bg-purple-500 backdrop-blur-md border border-purple-400/50 text-white text-xs font-cozy font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <span>🎨 My Avatar & Desk</span>
        </button>
      </div>

      {/* Peer Profile & Social Interaction Modal */}
      {selectedPeer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#1e1a2f] border border-purple-500/30 rounded-2xl p-5 shadow-2xl animate-fade-in text-purple-100">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <AvatarRenderer avatar={selectedPeer.avatar} size={65} animate={false} />
                <div>
                  <h3 className="font-cozy font-bold text-lg text-white">
                    {selectedPeer.name} {selectedPeer.isUser && '(You)'}
                  </h3>
                  <p className="text-xs text-purple-300 font-cozy">
                    {selectedPeer.avatar.statusText || 'Focusing quietly'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPeer(null)}
                className="text-purple-400 hover:text-white text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="bg-purple-950/60 rounded-xl p-3 border border-purple-800/40 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-purple-300">🎯 Active Goal:</span>
                <span className="font-semibold text-white">{selectedPeer.currentTask || 'Free focus'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">⏱️ Focus Today:</span>
                <span className="font-semibold text-amber-300">{selectedPeer.focusMinutesToday} mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">🔥 Focus Streak:</span>
                <span className="font-semibold text-orange-400">{selectedPeer.streakDays} Days</span>
              </div>
            </div>

            {/* Social Encouragement Actions */}
            {!selectedPeer.isUser && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    soundEngine.playHighFive();
                    onSendHighFive(selectedPeer.id);
                    setSelectedPeer(null);
                  }}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-purple-700/60 hover:bg-purple-600 rounded-xl font-cozy text-xs font-semibold text-white transition-all active:scale-95"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-amber-300" />
                  <span>High Five!</span>
                </button>
                <button
                  onClick={() => {
                    soundEngine.playCoin();
                    onSendCoffee(selectedPeer.id);
                    setSelectedPeer(null);
                  }}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-700/60 hover:bg-emerald-600 rounded-xl font-cozy text-xs font-semibold text-white transition-all active:scale-95"
                >
                  <Coffee className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Send Tea 🍵</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
