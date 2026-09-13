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
import { AuthModal } from './components/AuthModal';
import { UserNametagModal } from './components/UserNametagModal';
import { DirectMessageModal } from './components/DirectMessageModal';
import { DisplayModeBar } from './components/DisplayModeBar';
import { StickerWidget } from './components/StickerWidget';
import { DockedSidebar } from './components/DockedSidebar';
import { soundEngine } from './utils/audioSynth';
import { ALL_ROOM_SERVERS, THEME_BOTS } from './data/roomServers';
import {
  auth,
  saveFirebaseUserProfile,
  getFirebaseUserProfile,
  FirebaseUserProfile,
  listenRoomPresences,
  setRoomPresence,
  removeRoomPresence,
  saveFriendship,
  deleteFriendship,
  getUserFriends,
  listenUserDirectMessages,
  sendDirectMessage,
  DirectMessage,
  RoomPresence,
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
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
  User as UserIcon,
  MessageSquare,
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
  const [currentRoom, setCurrentRoom] = useState<CoWorkingRoom>(() => ALL_ROOM_SERVERS[0]);
  const [userDeskIndex, setUserDeskIndex] = useState<number>(1);

  // --- Peers / Multiplayer Co-Workers & Bot Presence ---
  const [peers, setPeers] = useState<RoomPeer[]>(() => {
    const defaultBot = THEME_BOTS[ALL_ROOM_SERVERS[0].theme] || THEME_BOTS.office;
    return [defaultBot];
  });

  // --- Social & Direct Messaging State ---
  const [selectedPeerForModal, setSelectedPeerForModal] = useState<RoomPeer | null>(null);
  const [isNametagModalOpen, setIsNametagModalOpen] = useState(false);
  const [activeDmPeer, setActiveDmPeer] = useState<RoomPeer | null>(null);
  const [isDmModalOpen, setIsDmModalOpen] = useState(false);
  const [friendsList, setFriendsList] = useState<{ id: string; name: string; avatarUrl?: string }[]>(() => {
    const saved = localStorage.getItem('ontogether_friends');
    return saved ? JSON.parse(saved) : [];
  });
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(() => {
    const saved = localStorage.getItem('ontogether_direct_messages');
    return saved ? JSON.parse(saved) : [];
  });

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
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // --- Auth & Cloud Profile State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Automatically sync from cloud
        try {
          const profile = await getFirebaseUserProfile(user.uid);
          if (profile) {
            if (typeof profile.tickets === 'number') {
              setTickets(profile.tickets);
            }
            if (typeof profile.totalMinutesFocused === 'number') {
              setTotalFocusMinutes(profile.totalMinutesFocused);
            }
            if (profile.avatarConfigJson) {
              try {
                const parsedAvatar = JSON.parse(profile.avatarConfigJson);
                setAvatar(parsedAvatar);
              } catch (e) {
                console.warn('Could not parse cloud avatar', e);
              }
            }
            if (profile.deskConfigJson) {
              try {
                const parsedDesk = JSON.parse(profile.deskConfigJson);
                setDesk(parsedDesk);
              } catch (e) {
                console.warn('Could not parse cloud desk', e);
              }
            }
            if (profile.displayName && (!avatar.name || avatar.name === 'You')) {
              setAvatar((prev) => ({ ...prev, name: profile.displayName }));
            }
          } else {
            // First time login for this user: initialize their profile in Firestore
            await saveFirebaseUserProfile({
              userId: user.uid,
              displayName: user.displayName || avatar.name || 'Cozy Coworker',
              email: user.email || undefined,
              tickets,
              totalMinutesFocused: totalFocusMinutes,
              avatarConfigJson: JSON.stringify(avatar),
              deskConfigJson: JSON.stringify(desk),
            });
          }
          setIsCloudSynced(true);
        } catch (err) {
          console.warn('Firebase user profile sync notice:', err);
        }
      } else {
        setIsCloudSynced(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Manual & Auto cloud sync handler
  const handleCloudSync = async () => {
    if (!currentUser) return;
    try {
      await saveFirebaseUserProfile({
        userId: currentUser.uid,
        displayName: currentUser.displayName || avatar.name || 'Cozy Coworker',
        email: currentUser.email || undefined,
        tickets,
        totalMinutesFocused: totalFocusMinutes,
        currentActivity: activeTask ? activeTask.title : avatar.statusText,
        avatarConfigJson: JSON.stringify(avatar),
        deskConfigJson: JSON.stringify(desk),
        unlockedItemsJson: JSON.stringify(shopItems.filter((s) => s.isUnlocked).map((s) => s.id)),
      });
      setIsCloudSynced(true);
    } catch (err) {
      console.warn('Cloud sync err:', err);
    }
  };

  // Sync to cloud when major state items change and user is logged in
  useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => {
        handleCloudSync();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [tickets, totalFocusMinutes, avatar, desk, currentUser]);

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
  const myUserId = currentUser?.uid || 'user-me';

  const userPeer: RoomPeer = {
    id: myUserId,
    name: avatar.name?.trim() ? avatar.name : 'You',
    isUser: true,
    avatar,
    desk,
    currentTask: activeTask ? activeTask.title : avatar.statusText,
    focusMinutesToday: totalFocusMinutes,
    streakDays: currentStreak,
    tickets,
    deskIndex: userDeskIndex,
    reactionEmoji: userReactionEmoji || undefined,
  };

  const allRoomPeers = [userPeer, ...peers];

  // --- Multiplayer Room Presence & Bot Integration ---
  useEffect(() => {
    // 1. Get room-specific bot (always placed at Desk 0)
    const roomTheme = currentRoom.theme || 'office';
    const themeBot = THEME_BOTS[roomTheme] || THEME_BOTS.office;

    // 2. Subscribe to real-time remote coworker presences in current room
    const unsubscribePresence = listenRoomPresences(currentRoom.id, (presences) => {
      // Remote peers excluding current user
      const remotePresences = presences.filter((p) => p.userId !== myUserId);

      // Determine available player desk indices (1 to 5)
      const occupiedDesks = new Set<number>(remotePresences.map((p) => p.deskIndex));
      let assignedDesk = userDeskIndex;
      if (occupiedDesks.has(assignedDesk) || assignedDesk === 0) {
        for (let i = 1; i <= 5; i++) {
          if (!occupiedDesks.has(i)) {
            assignedDesk = i;
            break;
          }
        }
        setUserDeskIndex(assignedDesk);
      }

      // Convert remote presences into RoomPeer objects
      const remotePeers: RoomPeer[] = remotePresences.map((p) => {
        let pAvatar = initialUserAvatar;
        let pDesk = initialUserDesk;
        try {
          if (p.avatarConfigJson) pAvatar = JSON.parse(p.avatarConfigJson);
          if (p.deskConfigJson) pDesk = JSON.parse(p.deskConfigJson);
        } catch (e) {
          // fallback default
        }

        return {
          id: p.userId,
          name: p.userName || 'Co-Worker',
          isUser: false,
          avatar: pAvatar,
          desk: pDesk,
          currentTask: p.status || 'Focusing',
          focusMinutesToday: 45,
          streakDays: 3,
          tickets: 20,
          deskIndex: p.deskIndex,
          isOnline: Date.now() - (typeof p.lastSeen === 'number' ? p.lastSeen : new Date(p.lastSeen).getTime()) < 60000,
        };
      });

      // The room consists of ONE designated theme bot (Desk 0) + any real remote coworkers (Desks 1-5)
      setPeers([themeBot, ...remotePeers]);
    });

    // 3. Register / heartbeat current user's presence in this room server
    const heartbeat = () => {
      setRoomPresence({
        roomId: currentRoom.id,
        userId: myUserId,
        userName: avatar.name || 'You',
        avatarConfigJson: JSON.stringify(avatar),
        deskConfigJson: JSON.stringify(desk),
        deskIndex: userDeskIndex,
        status: activeTask ? activeTask.title : avatar.statusText,
        lastSeen: Date.now(),
      }).catch((err) => console.warn('Room presence heartbeat notice:', err));
    };

    heartbeat();
    const heartbeatInterval = window.setInterval(heartbeat, 15000);

    return () => {
      unsubscribePresence();
      window.clearInterval(heartbeatInterval);
      removeRoomPresence(currentRoom.id, myUserId).catch(() => {});
    };
  }, [currentRoom.id, currentRoom.theme, myUserId, avatar, desk, activeTask, userDeskIndex]);

  // --- Real-time Direct Messaging Listener ---
  useEffect(() => {
    if (currentUser) {
      const unsub = listenUserDirectMessages(currentUser.uid, (dms) => {
        setDirectMessages(dms);
      });
      return () => unsub();
    }
  }, [currentUser]);

  // Save DMs and friends to localStorage
  useEffect(() => {
    localStorage.setItem('ontogether_direct_messages', JSON.stringify(directMessages));
  }, [directMessages]);

  useEffect(() => {
    localStorage.setItem('ontogether_friends', JSON.stringify(friendsList));
  }, [friendsList]);

  // Load cloud friends on user login
  useEffect(() => {
    if (currentUser) {
      getUserFriends(currentUser.uid).then((friends) => {
        if (friends && friends.length > 0) {
          setFriendsList(
            friends.map((f) => ({
              id: f.friendUserId,
              name: f.friendName,
            }))
          );
        }
      });
    }
  }, [currentUser]);

  // Handle Send Direct Message (supports both real users & intelligent theme bot auto-responses!)
  const handleSendMessage = async (targetUserId: string, targetUserName: string, text: string) => {
    const newMsg: DirectMessage = {
      id: `dm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId: myUserId,
      senderName: avatar.name || 'You',
      recipientId: targetUserId,
      recipientName: targetUserName,
      text: text,
      content: text,
      createdAt: Date.now(),
      read: true,
    };

    setDirectMessages((prev) => [...prev, newMsg]);

    // If logged in to Firebase, push to cloud
    if (currentUser) {
      await sendDirectMessage(myUserId, avatar.name || 'You', targetUserId, targetUserName, text);
    }

    // If target is a Room Bot, generate a cozy automated response!
    if (targetUserId.startsWith('bot-')) {
      const botTheme = currentRoom.theme || 'office';
      const botReplies: Record<string, string[]> = {
        tea_loft: [
          '🍵 *Sips matcha peacefully* Great to focus together! Remember to breathe deeply and stay hydrated.',
          '🌸 Quiet focus is the best kind of energy. Let’s finish this pomodoro sprint with calmness!',
          '✨ Warm greetings from the tatami loft. You are doing fantastic work today!',
        ],
        treehouse: [
          '🌿 *Leaves rustle gently in the breeze* Keep up that creative momentum! The canopy view is lovely today.',
          '🐿️ Sending high focus vibes up into the branches! Let’s crush this task list together.',
          '🍃 Beautiful rhythm you’ve got going! Stay in that awesome flow state.',
        ],
        lilypad: [
          '🌙 *Gentle water ripples in the moonlight* The fireflies are glowing. Keep going, star traveler!',
          '✨ Peaceful twilight energy for your deep work session. You’re making real progress tonight!',
          '🪐 Deep work under starry skies. Let’s conquer that milestone!',
        ],
        cafe: [
          '☕ *Fresh espresso brewed & steam swirls* Here’s a virtual latte for your focus sprint!',
          '🥐 Cozy cafe ambiance for the win! Getting things done one sip at a time.',
          '🎵 The coffee aroma and lofi rain beats are in full sync. Proud of your hustle!',
        ],
        arcade: [
          '🕹️ *Pixel victory chime plays* Focus combo multiplier: 10X! High score incoming!',
          '👾 Game on! Keep that energetic productivity power-up going strong.',
          '⚡ Boss level unlocked: Task Completion! You got this, champion!',
        ],
        greenhouse: [
          '🌱 *Fresh botanical breeze* Water your mind with some quiet focus! Every small step grows into something big.',
          '🌿 The orchids and ferns are blooming. Let’s make this study session blossom!',
          '🌻 Steady growth beats rushing every time. Wonderful work today!',
        ],
        office: [
          '📊 *Clacking mechanical keys* Sprint mode engaged! Let’s knock out this milestone together.',
          '💼 Excellent pace! Take quick micro-breaks to stretch and keep that sharpness.',
          '🚀 Collaborative synergy at 100%. Let’s finish strong!',
        ],
      };

      const repliesList = botReplies[botTheme] || botReplies.office;
      const botResponseText = repliesList[Math.floor(Math.random() * repliesList.length)];

      setTimeout(() => {
        soundEngine.playChime('bell');
        const botReplyMsg: DirectMessage = {
          id: `dm-bot-reply-${Date.now()}`,
          senderId: targetUserId,
          senderName: targetUserName,
          recipientId: myUserId,
          recipientName: avatar.name || 'You',
          text: botResponseText,
          content: botResponseText,
          createdAt: Date.now(),
          read: false,
        };
        setDirectMessages((prev) => [...prev, botReplyMsg]);
      }, 1200);
    }
  };

  // Toggle Friend handler
  const handleToggleFriend = async (peer: RoomPeer) => {
    const isAlreadyFriend = friendsList.some((f) => f.id === peer.id);
    if (isAlreadyFriend) {
      setFriendsList((prev) => prev.filter((f) => f.id !== peer.id));
      if (currentUser) {
        await deleteFriendship(currentUser.uid, peer.id);
      }
      soundEngine.playChime('bell');
    } else {
      setFriendsList((prev) => [...prev, { id: peer.id, name: peer.name }]);
      if (currentUser) {
        await saveFriendship(currentUser.uid, currentUser.displayName || 'You', peer.id, peer.name);
      }
      soundEngine.playCoin();
      confetti({ particleCount: 25, spread: 50 });
      setTickets((t) => t + 5);
    }
  };

  // Open Nametag Modal
  const handleSelectPeer = (peer: RoomPeer) => {
    setSelectedPeerForModal(peer);
    setIsNametagModalOpen(true);
  };

  // Open Direct Message Modal from Nametag
  const handleOpenPmFromNametag = (peer: RoomPeer) => {
    setIsNametagModalOpen(false);
    setActiveDmPeer(peer);
    setIsDmModalOpen(true);
  };

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
          onSelectPeer={handleSelectPeer}
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
        <UserNametagModal
          isOpen={isNametagModalOpen}
          peer={selectedPeerForModal}
          isFriend={friendsList.some((f) => f.id === selectedPeerForModal?.id)}
          onClose={() => setIsNametagModalOpen(false)}
          onToggleFriend={handleToggleFriend}
          onOpenPm={handleOpenPmFromNametag}
          onSendReactionToPeer={(peer, emoji) => handleSendReaction(emoji)}
        />
        <DirectMessageModal
          isOpen={isDmModalOpen}
          onClose={() => setIsDmModalOpen(false)}
          targetPeer={activeDmPeer || peers[0] || userPeer}
          currentUserId={myUserId}
          currentUserName={avatar.name || 'You'}
          messages={directMessages}
          onSendMessage={handleSendMessage}
          friendsList={friendsList}
          onSelectFriendChat={(peerId) => {
            const foundPeer = allRoomPeers.find((p) => p.id === peerId) || {
              id: peerId,
              name: friendsList.find((f) => f.id === peerId)?.name || 'Friend',
              isUser: false,
              avatar: initialUserAvatar,
              desk: initialUserDesk,
              currentTask: 'Online Friend',
              focusMinutesToday: 0,
              streakDays: 1,
              tickets: 0,
              deskIndex: 1,
            };
            setActiveDmPeer(foundPeer);
          }}
        />
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

            <button
              onClick={() => {
                if (!activeDmPeer && peers.length > 0) {
                  setActiveDmPeer(peers[0]);
                }
                setIsDmModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/40 text-purple-200 text-xs font-cozy font-medium transition-all shadow-sm relative"
            >
              <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
              <span>Messages & DMs</span>
              {directMessages.some((m) => !m.read && m.recipientId === myUserId) && (
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse absolute -top-0.5 -right-0.5" />
              )}
            </button>
          </div>

          {/* Right Status & Display Mode Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Tickets Balance Pill */}
            <button
              onClick={() => setIsShopOpen(true)}
              title="Open Ticket Shop"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 font-cozy font-bold text-xs shadow-inner hover:scale-105 transition-transform"
            >
              <span>🎟️</span>
              <span>{tickets}</span>
            </button>

            {/* Cafe Member Account Pass Button */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/70 hover:bg-purple-900/80 border border-purple-600/40 hover:border-purple-400 text-xs font-cozy text-purple-200 hover:text-white transition-all shadow-md group"
              title={currentUser ? "Account Profile & Cloud Sync" : "Sign In / Cafe Member Pass"}
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold overflow-hidden border border-purple-400/40 flex-shrink-0">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : currentUser?.displayName ? (
                  currentUser.displayName[0].toUpperCase()
                ) : (
                  <UserIcon className="w-3 h-3 text-purple-200" />
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-none text-left">
                <span className="font-semibold text-white max-w-[85px] truncate text-[11px]">
                  {currentUser ? (currentUser.displayName || 'Member') : 'Member Pass'}
                </span>
                <span className="text-[9px] text-purple-400 flex items-center gap-1 mt-0.5">
                  {currentUser ? (
                    <span className="text-emerald-400 font-mono">● Synced</span>
                  ) : (
                    <span className="text-purple-300">Sign In</span>
                  )}
                </span>
              </div>
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
          onSelectPeer={handleSelectPeer}
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

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        tickets={tickets}
        totalFocusMinutes={totalFocusMinutes}
        streakDays={currentStreak}
        onTriggerSync={handleCloudSync}
      />

      <UserNametagModal
        isOpen={isNametagModalOpen}
        peer={selectedPeerForModal}
        isFriend={friendsList.some((f) => f.id === selectedPeerForModal?.id)}
        onClose={() => setIsNametagModalOpen(false)}
        onToggleFriend={handleToggleFriend}
        onOpenPm={handleOpenPmFromNametag}
        onSendReactionToPeer={(peer, emoji) => handleSendReaction(emoji)}
      />

      <DirectMessageModal
        isOpen={isDmModalOpen}
        onClose={() => setIsDmModalOpen(false)}
        targetPeer={activeDmPeer || peers[0] || userPeer}
        currentUserId={myUserId}
        currentUserName={avatar.name || 'You'}
        messages={directMessages}
        onSendMessage={handleSendMessage}
        friendsList={friendsList}
        onSelectFriendChat={(peerId) => {
          const foundPeer = allRoomPeers.find((p) => p.id === peerId) || {
            id: peerId,
            name: friendsList.find((f) => f.id === peerId)?.name || 'Friend',
            isUser: false,
            avatar: initialUserAvatar,
            desk: initialUserDesk,
            currentTask: 'Online Friend',
            focusMinutesToday: 0,
            streakDays: 1,
            tickets: 0,
            deskIndex: 1,
          };
          setActiveDmPeer(foundPeer);
        }}
      />
    </div>
  );
}
