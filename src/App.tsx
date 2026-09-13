import React, { useState, useEffect, useRef } from 'react';
import {
  AvatarConfig,
  DeskConfig,
  RoomPeer,
  PomodoroMode,
  PomodoroSettings,
  TaskItem,
  JournalEntry,
  TimeBlock,
  ShopItem,
  Achievement,
  CoWorkingRoom,
  AudioTrackVolume,
  TimeOfDay,
  DisplayMode,
  CaughtFish,
} from './types';
import {
  initialUserAvatar,
  initialUserDesk,
  initialCoWorkers,
  initialShopItems,
  initialAchievements,
  initialTasks,
  initialTimeBlocks,
} from './data/initialData';
import { EnvironmentCanvas } from './components/EnvironmentCanvas';
import { PomodoroTimer } from './components/PomodoroTimer';
import { TodoList } from './components/TodoList';
import { PlannerAndJournal } from './components/PlannerAndJournal';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';
import { TicketShopModal } from './components/TicketShopModal';
import { BreakMiniGames } from './components/BreakMiniGames';
import { AmbientSoundMixer } from './components/AmbientSoundMixer';
import { StatisticsModal } from './components/StatisticsModal';
import { RoomLobbyModal } from './components/RoomLobbyModal';
import { BookshelfModal } from './components/BookshelfModal';
import { DisplayModeBar } from './components/DisplayModeBar';
import { StickerWidget } from './components/StickerWidget';
import { DockedSidebar } from './components/DockedSidebar';
import { soundEngine } from './utils/audioSynth';
import {
  Sparkles,
  Music,
  ShoppingBag,
  Trophy,
  Users,
  Palette,
  Gamepad2,
  Maximize2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // --- Core State ---
  const [avatar, setAvatar] = useState<AvatarConfig>(() => {
    const saved = localStorage.getItem('ontogether_avatar');
    return saved ? JSON.parse(saved) : initialUserAvatar;
  });

  const [desk, setDesk] = useState<DeskConfig>(() => {
    const saved = localStorage.getItem('ontogether_desk');
    return saved ? JSON.parse(saved) : initialUserDesk;
  });

  const [tickets, setTickets] = useState<number>(() => {
    const saved = localStorage.getItem('ontogether_tickets');
    return saved ? parseInt(saved, 10) : 65;
  });

  const [shopItems, setShopItems] = useState<ShopItem[]>(() => {
    const saved = localStorage.getItem('ontogether_shop');
    return saved ? JSON.parse(saved) : initialShopItems;
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem('ontogether_tasks');
    return saved ? JSON.parse(saved) : initialTasks;
  });

  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    return localStorage.getItem('ontogether_active_task') || 'task-1';
  });

  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(() => {
    const saved = localStorage.getItem('ontogether_timeblocks');
    return saved ? JSON.parse(saved) : initialTimeBlocks;
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('ontogether_journal');
    return saved ? JSON.parse(saved) : [];
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('ontogether_achievements');
    return saved ? JSON.parse(saved) : initialAchievements;
  });

  const [caughtFish, setCaughtFish] = useState<CaughtFish[]>(() => {
    const saved = localStorage.getItem('ontogether_fish');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Display & Environment State ---
  const [displayMode, setDisplayMode] = useState<DisplayMode>('full');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [currentRoom, setCurrentRoom] = useState<CoWorkingRoom>({
    id: 'room-office-1',
    name: '🏢 Open-Plan Studio Office',
    code: 'OFFICE-1042',
    theme: 'office',
    topic: 'Sprint Deep Work & Collaborative Flow',
    timeOfDay: 'day',
    isPrivate: false,
    creatorName: 'Alex',
    maxCapacity: 6,
  });

  // --- Peers / Multiplayer Co-Workers ---
  const [peers, setPeers] = useState<RoomPeer[]>(initialCoWorkers);

  // --- Pomodoro Settings & State ---
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(() => {
    const saved = localStorage.getItem('ontogether_pomodoro_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
      autoStartBreaks: true,
      autoStartPomodoro: false,
      tickingSound: false,
      alarmSound: 'bell',
      volume: 0.8,
    };
  });

  useEffect(() => {
    localStorage.setItem('ontogether_pomodoro_settings', JSON.stringify(pomodoroSettings));
  }, [pomodoroSettings]);

  const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>('work');
  const [timeRemaining, setTimeRemaining] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);

  // --- Analytics State ---
  const [totalFocusMinutes, setTotalFocusMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('ontogether_focus_mins');
    return saved ? parseInt(saved, 10) : 50;
  });

  const [currentStreak, setCurrentStreak] = useState<number>(3);
  const [userReactionEmoji, setUserReactionEmoji] = useState<string | null>(null);
  const userReactionTimerRef = useRef<number | null>(null);
  const [weeklyFocusData, setWeeklyFocusData] = useState<{ day: string; minutes: number }[]>([
    { day: 'Mon', minutes: 45 },
    { day: 'Tue', minutes: 60 },
    { day: 'Wed', minutes: 75 },
    { day: 'Thu', minutes: 50 },
    { day: 'Fri', minutes: 90 },
    { day: 'Sat', minutes: 65 },
    { day: 'Sun', minutes: 80 },
  ]);

  // --- Audio Mixer State ---
  const [audioState, setAudioState] = useState<AudioTrackVolume>({
    lofiChords: 0.5,
    rain: 0,
    fireplace: 0,
    cafeMurmur: 0,
    forestBirds: 0,
    nightCrickets: 0,
    oceanWaves: 0,
    clockTick: 0,
    master: 0.8,
    isPlaying: false,
  });

  // --- Modal Open States ---
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isBreakGamesOpen, setIsBreakGamesOpen] = useState(false);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [isBookshelfOpen, setIsBookshelfOpen] = useState(false);

  // --- LocalStorage Synchronization ---
  useEffect(() => {
    localStorage.setItem('ontogether_avatar', JSON.stringify(avatar));
  }, [avatar]);
  useEffect(() => {
    localStorage.setItem('ontogether_desk', JSON.stringify(desk));
  }, [desk]);
  useEffect(() => {
    localStorage.setItem('ontogether_tickets', tickets.toString());
  }, [tickets]);
  useEffect(() => {
    localStorage.setItem('ontogether_shop', JSON.stringify(shopItems));
  }, [shopItems]);
  useEffect(() => {
    localStorage.setItem('ontogether_tasks', JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    if (activeTaskId) localStorage.setItem('ontogether_active_task', activeTaskId);
  }, [activeTaskId]);
  useEffect(() => {
    localStorage.setItem('ontogether_timeblocks', JSON.stringify(timeBlocks));
  }, [timeBlocks]);
  useEffect(() => {
    localStorage.setItem('ontogether_journal', JSON.stringify(journalEntries));
  }, [journalEntries]);
  useEffect(() => {
    localStorage.setItem('ontogether_achievements', JSON.stringify(achievements));
  }, [achievements]);
  useEffect(() => {
    localStorage.setItem('ontogether_fish', JSON.stringify(caughtFish));
  }, [caughtFish]);
  useEffect(() => {
    localStorage.setItem('ontogether_focus_mins', totalFocusMinutes.toString());
  }, [totalFocusMinutes]);

  // --- User as a Peer in the Room ---
  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const userPeer: RoomPeer = {
    id: 'user-me',
    name: avatar.name?.trim() ? avatar.name : 'You',
    isUser: true,
    avatar,
    desk,
    currentTask: activeTask ? activeTask.title : avatar.statusText,
    focusMinutesToday: totalFocusMinutes,
    streakDays: currentStreak,
    tickets,
    deskIndex: 0,
    reactionEmoji: userReactionEmoji || undefined,
  };

  const allRoomPeers = [userPeer, ...peers];

  // --- Pomodoro Countdown Timer Loop ---
  useEffect(() => {
    let interval: number | null = null;

    if (isTimerRunning && timeRemaining > 0) {
      interval = window.setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isTimerRunning) {
      // Session Complete!
      soundEngine.playChime(pomodoroSettings.alarmSound);

      if (pomodoroMode === 'work') {
        const earned = 10;
        setTickets((t) => t + earned);
        setCompletedSessions((s) => s + 1);
        setTotalFocusMinutes((m) => m + pomodoroSettings.workDuration);

        // Update task progress if active
        if (activeTaskId) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === activeTaskId ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t
            )
          );
        }

        confetti({ particleCount: 70, spread: 80, origin: { y: 0.7 } });

        // Switch to Break
        const nextBreakMode =
          (completedSessions + 1) % pomodoroSettings.sessionsBeforeLongBreak === 0
            ? 'longBreak'
            : 'shortBreak';
        setPomodoroMode(nextBreakMode);
        setTimeRemaining(
          (nextBreakMode === 'longBreak'
            ? pomodoroSettings.longBreakDuration
            : pomodoroSettings.shortBreakDuration) * 60
        );

        if (pomodoroSettings.autoStartBreaks) {
          setIsTimerRunning(true);
        } else {
          setIsTimerRunning(false);
        }

        // Open break mini games modal automatically to encourage rest!
        setIsBreakGamesOpen(true);
      } else {
        // Break is over, back to focus
        setPomodoroMode('work');
        setTimeRemaining(pomodoroSettings.workDuration * 60);
        setIsTimerRunning(pomodoroSettings.autoStartPomodoro);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeRemaining, pomodoroMode, pomodoroSettings, completedSessions, activeTaskId]);

  // --- Simulated Lively Peer Co-Workers Interactions ---
  useEffect(() => {
    const peerInterval = setInterval(() => {
      // Pick a random peer to emote or change status
      const randomIdx = Math.floor(Math.random() * peers.length);
      const emojis = ['☕', '👏', '💖', '🔥', '✨', '🎯', '📚', '🚀'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

      setPeers((prev) =>
        prev.map((p, i) =>
          i === randomIdx
            ? {
                ...p,
                reactionEmoji: randomEmoji,
                reactionTimestamp: Date.now(),
              }
            : p
        )
      );

      // Clear reaction after 3 seconds
      setTimeout(() => {
        setPeers((prev) =>
          prev.map((p, i) => (i === randomIdx ? { ...p, reactionEmoji: undefined } : p))
        );
      }, 3000);
    }, 12000);

    return () => clearInterval(peerInterval);
  }, [peers.length]);

  // --- Handlers ---
  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    if (pomodoroMode === 'work') setTimeRemaining(pomodoroSettings.workDuration * 60);
    else if (pomodoroMode === 'shortBreak') setTimeRemaining(pomodoroSettings.shortBreakDuration * 60);
    else setTimeRemaining(pomodoroSettings.longBreakDuration * 60);
  };

  const handleSkipTimer = () => {
    setIsTimerRunning(false);
    if (pomodoroMode === 'work') {
      setPomodoroMode('shortBreak');
      setTimeRemaining(pomodoroSettings.shortBreakDuration * 60);
    } else {
      setPomodoroMode('work');
      setTimeRemaining(pomodoroSettings.workDuration * 60);
    }
  };

  const handleModeChange = (newMode: PomodoroMode) => {
    setIsTimerRunning(false);
    setPomodoroMode(newMode);
    if (newMode === 'work') setTimeRemaining(pomodoroSettings.workDuration * 60);
    else if (newMode === 'shortBreak') setTimeRemaining(pomodoroSettings.shortBreakDuration * 60);
    else setTimeRemaining(pomodoroSettings.longBreakDuration * 60);
  };

  const handleUpdatePomodoroSettings = (newSettings: PomodoroSettings) => {
    setPomodoroSettings(newSettings);
    if (!isTimerRunning) {
      if (pomodoroMode === 'work') setTimeRemaining(newSettings.workDuration * 60);
      else if (pomodoroMode === 'shortBreak') setTimeRemaining(newSettings.shortBreakDuration * 60);
      else if (pomodoroMode === 'longBreak') setTimeRemaining(newSettings.longBreakDuration * 60);
    }
  };

  const handleAddTask = (
    title: string,
    category: TaskItem['category'],
    estPomodoros: number,
    priority: TaskItem['priority']
  ) => {
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title,
      category,
      estimatedPomodoros: estPomodoros,
      completedPomodoros: 0,
      completed: false,
      priority,
      createdAt: Date.now(),
    };
    setTasks([newTask, ...tasks]);
    if (!activeTaskId) setActiveTaskId(newTask.id);
    setTickets((t) => t + 5);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed;
          if (nextCompleted) setTickets((curr) => curr + 5);
          return { ...t, completed: nextCompleted };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeTaskId === taskId) setActiveTaskId(null);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<TaskItem>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const handleUpdateTimeBlock = (id: string, updates: Partial<TimeBlock>) => {
    setTimeBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const handleUpdateJournalEntry = (id: string, updates: Partial<JournalEntry>) => {
    setJournalEntries((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...updates } : j))
    );
  };

  const handleSaveAvatarAndDesk = (newAvatar: AvatarConfig, newDesk: DeskConfig) => {
    setAvatar(newAvatar);
    setDesk(newDesk);
  };

  const handleBuyShopItem = (itemId: string) => {
    const item = shopItems.find((i) => i.id === itemId);
    if (!item || tickets < item.cost) return;

    setTickets((t) => t - item.cost);
    setShopItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, unlocked: true } : i)));

    // Auto-equip purchased item
    if (item.targetKey in avatar) {
      setAvatar((prev) => ({ ...prev, [item.targetKey]: item.targetValue }));
    } else if (item.targetKey in desk) {
      setDesk((prev) => ({ ...prev, [item.targetKey]: item.targetValue }));
    }
  };

  const handleSendReaction = (emoji: string) => {
    // Show reaction emoji above user's avatar & nametag briefly
    setUserReactionEmoji(emoji);
    if (userReactionTimerRef.current) {
      window.clearTimeout(userReactionTimerRef.current);
    }
    userReactionTimerRef.current = window.setTimeout(() => {
      setUserReactionEmoji(null);
    }, 4200);

    const el = document.getElementById('user-me');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendHighFive = (targetPeerId: string) => {
    soundEngine.playHighFive();
    setTickets((t) => t + 2);
    confetti({ particleCount: 30, spread: 50 });
  };

  const handleSendCoffee = (targetPeerId: string) => {
    soundEngine.playCoin();
    setTickets((t) => t + 2);
  };

  const handlePetInteraction = () => {
    setTickets((t) => t + 1);
  };

  const handleEarnTickets = (amount: number) => {
    setTickets((t) => t + amount);
  };

  const handleCatchFish = (fish: CaughtFish) => {
    setCaughtFish((prev) => [fish, ...prev]);
  };

  // --- Render Docked Companion Mode ---
  if (displayMode === 'docked') {
    return (
      <DockedSidebar
        userPeer={userPeer}
        mode={pomodoroMode}
        timeRemaining={timeRemaining}
        isRunning={isTimerRunning}
        completedSessions={completedSessions}
        settings={pomodoroSettings}
        tasks={tasks}
        activeTaskId={activeTaskId}
        tickets={tickets}
        onTogglePlay={handleToggleTimer}
        onReset={handleResetTimer}
        onSkip={handleSkipTimer}
        onModeChange={handleModeChange}
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
        onSetActiveTask={setActiveTaskId}
        onExpandToFull={() => setDisplayMode('full')}
        onOpenMixer={() => setIsMixerOpen(true)}
        onOpenBreakGames={() => setIsBreakGamesOpen(true)}
      />
    );
  }

  // --- Render Zen Fullscreen Mode ---
  if (displayMode === 'zen') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
        <EnvironmentCanvas
          room={currentRoom}
          peers={allRoomPeers}
          userPeer={userPeer}
          timeOfDay={timeOfDay}
          onTimeOfDayChange={setTimeOfDay}
          onSendReaction={handleSendReaction}
          onSendHighFive={handleSendHighFive}
          onSendCoffee={handleSendCoffee}
          onPeerPetClick={() => handlePetInteraction()}
          onOpenCustomizer={() => setIsCustomizerOpen(true)}
        />

        {/* Floating Zen Controls */}
        <div className="absolute top-6 left-6 z-30 flex items-center gap-2">
          <button
            onClick={() => setDisplayMode('full')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-950/80 backdrop-blur-md border border-purple-500/40 text-purple-200 hover:text-white text-xs font-cozy font-semibold shadow-lg transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Exit Zen</span>
          </button>
          <button
            onClick={() => setIsLobbyOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-purple-950/80 backdrop-blur-md border border-purple-500/40 text-purple-200 hover:text-white text-xs font-cozy font-semibold shadow-lg transition-all"
            title="Step into Hallway & Room Wall"
          >
            <span>🚪</span>
            <span>Hallway</span>
          </button>
          <button
            onClick={() => setIsMixerOpen(true)}
            className="p-2 rounded-full bg-purple-950/80 backdrop-blur-md border border-purple-500/40 text-purple-200 hover:text-white transition-all shadow-lg"
          >
            <Music className="w-4 h-4" />
          </button>
        </div>

        {/* Zen Timer Pill */}
        <div className="absolute top-6 right-6 z-30 bg-purple-950/85 backdrop-blur-md px-4 py-2 rounded-full border border-purple-500/40 text-white font-mono-timer font-bold text-sm shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>
            {Math.floor(timeRemaining / 60)}:{Math.floor(timeRemaining % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Modals in Zen Mode */}
        <AmbientSoundMixer
          isOpen={isMixerOpen}
          onClose={() => setIsMixerOpen(false)}
          audioState={audioState}
          onAudioChange={setAudioState}
        />
        <AvatarCustomizerModal
          isOpen={isCustomizerOpen}
          avatar={avatar}
          desk={desk}
          onSave={handleSaveAvatarAndDesk}
          onClose={() => setIsCustomizerOpen(false)}
        />
      </div>
    );
  }

  // --- Render Full Studio Workspace (Default) ---
  return (
    <div className="min-h-screen bg-[#13111c] text-[#e8e4f3] flex flex-col justify-between selection:bg-purple-500/30 selection:text-purple-200">
      {/* 1. Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#181524]/90 backdrop-blur-xl border-b border-purple-500/20 px-4 sm:px-6 py-3 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Current Room Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-900/40 text-lg">
              ✨
            </div>
            <div>
              <h1 className="font-cozy font-bold text-base sm:text-lg text-white leading-tight flex items-center gap-1.5">
                <span>CoworkingBrew</span>
                <span className="text-[10px] bg-purple-900/70 border border-purple-600/40 text-purple-200 px-1.5 py-0.2 rounded-md font-sans">
                  Co-Working
                </span>
              </h1>
              <button
                onClick={() => setIsLobbyOpen(true)}
                className="text-xs text-purple-300 hover:text-white font-cozy flex items-center gap-1 transition-colors text-left"
              >
                <span>{currentRoom.name}</span>
                <span className="text-purple-400/60">• #{currentRoom.code}</span>
              </button>
            </div>
          </div>

          {/* Center Action Toolbar */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/40 text-purple-200 text-xs font-cozy font-medium transition-all shadow-sm"
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Avatar & Desk</span>
            </button>

            <button
              onClick={() => setIsShopOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/40 text-purple-200 text-xs font-cozy font-medium transition-all shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>Ticket Shop</span>
            </button>

            <button
              onClick={() => setIsBreakGamesOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/40 text-purple-200 text-xs font-cozy font-medium transition-all shadow-sm"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Break Games</span>
            </button>

            <button
              onClick={() => setIsMixerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/40 text-purple-200 text-xs font-cozy font-medium transition-all shadow-sm"
            >
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span>Lofi & Ambiance</span>
            </button>

            <button
              onClick={() => setIsStatsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/40 text-purple-200 text-xs font-cozy font-medium transition-all shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5 text-orange-400" />
              <span>Stats & Growth</span>
            </button>
          </div>

          {/* Right Status & Display Mode Switcher */}
          <div className="flex items-center gap-3">
            {/* Tickets Balance Pill */}
            <button
              onClick={() => setIsShopOpen(true)}
              title="Open Ticket Shop"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 font-cozy font-bold text-xs shadow-inner hover:scale-105 transition-transform"
            >
              <span>🎟️</span>
              <span>{tickets}</span>
            </button>

            {/* Display Mode Bar */}
            <DisplayModeBar currentMode={displayMode} onChangeMode={setDisplayMode} />
          </div>
        </div>
      </header>

      {/* 2. Main Content Grid */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col gap-6">
        {/* Top: Cozy Environment Canvas Scene */}
        <EnvironmentCanvas
          room={currentRoom}
          peers={allRoomPeers}
          userPeer={userPeer}
          timeOfDay={timeOfDay}
          pomodoroMode={pomodoroMode}
          isTimerRunning={isTimerRunning}
          onTimeOfDayChange={setTimeOfDay}
          onSendReaction={handleSendReaction}
          onSendHighFive={handleSendHighFive}
          onSendCoffee={handleSendCoffee}
          onPeerPetClick={() => handlePetInteraction()}
          onOpenCustomizer={() => setIsCustomizerOpen(true)}
          onOpenBreakGames={() => setIsBreakGamesOpen(true)}
          onOpenBookshelf={() => setIsBookshelfOpen(true)}
          onOpenHallway={() => setIsLobbyOpen(true)}
          tasks={tasks}
          timeBlocks={timeBlocks}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onAddTickets={(amount) => setTickets((prev) => prev + amount)}
          tickets={tickets}
          onUpdateDesk={setDesk}
          focusMinutesToday={totalFocusMinutes}
          streakDays={currentStreak}
        />

        {/* Bottom Productivity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Pomodoro Focus Timer (4 cols) */}
          <div className="md:col-span-4 flex flex-col">
            <PomodoroTimer
              mode={pomodoroMode}
              timeRemaining={timeRemaining}
              isRunning={isTimerRunning}
              completedSessions={completedSessions}
              settings={pomodoroSettings}
              onTogglePlay={handleToggleTimer}
              onReset={handleResetTimer}
              onSkip={handleSkipTimer}
              onModeChange={handleModeChange}
              onOpenBreakGames={() => setIsBreakGamesOpen(true)}
              onUpdateSettings={handleUpdatePomodoroSettings}
            />
          </div>

          {/* Center Column: Focus Todo List & Tasks (4 cols) */}
          <div className="md:col-span-4 flex flex-col">
            <TodoList
              tasks={tasks}
              activeTaskId={activeTaskId}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onSetActiveTask={setActiveTaskId}
              onUpdateTask={handleUpdateTask}
            />
          </div>

          {/* Right Column: Time Planner & Reflection Journal (4 cols) */}
          <div className="md:col-span-4 flex flex-col">
            <PlannerAndJournal
              timeBlocks={timeBlocks}
              journalEntries={journalEntries}
              todayFocusMinutes={totalFocusMinutes}
              onAddTimeBlock={(block) =>
                setTimeBlocks([...timeBlocks, { ...block, id: `block-${Date.now()}` }])
              }
              onDeleteTimeBlock={(id) => setTimeBlocks(timeBlocks.filter((b) => b.id !== id))}
              onToggleTimeBlock={(id) =>
                setTimeBlocks(
                  timeBlocks.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b))
                )
              }
              onUpdateTimeBlock={handleUpdateTimeBlock}
              onSaveJournalEntry={(entry) => {
                const newEntry: JournalEntry = {
                  ...entry,
                  id: `journal-${Date.now()}`,
                  date: new Date().toISOString().split('T')[0],
                };
                setJournalEntries([newEntry, ...journalEntries]);
                setTickets((t) => t + 10);
              }}
              onUpdateJournalEntry={handleUpdateJournalEntry}
            />
          </div>
        </div>
      </main>

      {/* Floating Sticker Mode Widget when in 'sticker' mode */}
      {displayMode === 'sticker' && (
        <StickerWidget
          avatar={avatar}
          desk={desk}
          timeRemaining={timeRemaining}
          isRunning={isTimerRunning}
          mode={pomodoroMode}
          activeTaskTitle={activeTask ? activeTask.title : avatar.statusText}
          tickets={tickets}
          onTogglePlay={handleToggleTimer}
          onExpandToFull={() => setDisplayMode('full')}
        />
      )}

      {/* 3. Footer */}
      <footer className="border-t border-purple-950/80 bg-[#100e18] py-4 px-6 select-none text-center">
        <p className="text-xs text-purple-400/60 font-cozy">
          CoworkingBrew: Virtual Co-Working • Built with cozy focus, gentle social accountability & lofi soundscapes ☕
        </p>
      </footer>

      {/* Modals & Dialogs */}
      <AvatarCustomizerModal
        isOpen={isCustomizerOpen}
        avatar={avatar}
        desk={desk}
        onSave={handleSaveAvatarAndDesk}
        onClose={() => setIsCustomizerOpen(false)}
      />

      <TicketShopModal
        isOpen={isShopOpen}
        tickets={tickets}
        shopItems={shopItems}
        onBuyItem={handleBuyShopItem}
        onClose={() => setIsShopOpen(false)}
      />

      <BreakMiniGames
        isOpen={isBreakGamesOpen}
        onClose={() => setIsBreakGamesOpen(false)}
        onEarnTickets={handleEarnTickets}
        caughtFish={caughtFish}
        onCatchFish={handleCatchFish}
      />

      <AmbientSoundMixer
        isOpen={isMixerOpen}
        onClose={() => setIsMixerOpen(false)}
        audioState={audioState}
        onAudioChange={setAudioState}
      />

      <StatisticsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        totalFocusMinutes={totalFocusMinutes}
        totalSessions={completedSessions}
        currentStreak={currentStreak}
        bestStreak={7}
        ticketsEarned={tickets + 40}
        achievements={achievements}
        weeklyFocusData={weeklyFocusData}
      />

      <RoomLobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        currentRoom={currentRoom}
        onSelectRoom={setCurrentRoom}
        onCreateRoom={(newRoom) => {
          setCurrentRoom(newRoom);
        }}
      />

      <BookshelfModal
        isOpen={isBookshelfOpen}
        onClose={() => setIsBookshelfOpen(false)}
      />
    </div>
  );
}
