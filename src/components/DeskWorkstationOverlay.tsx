import React, { useState, useEffect, useRef } from 'react';
import { DeskConfig, AvatarConfig } from '../types';
import { soundEngine } from '../utils/audioSynth';
import { DesktopBrowserApp } from './DesktopBrowserApp';
import {
  Monitor,
  BookOpen,
  ShoppingBag,
  Sparkles,
  Check,
  Zap,
  RotateCcw,
  Smile,
  Flame,
  Award,
  Calendar,
  X,
  FileText,
  BarChart3,
  Calculator,
  Music,
  Timer,
  Heart,
  StickyNote,
  Image as ImageIcon,
  Minimize2,
  Maximize2,
  Minus,
  Globe,
  Copy,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface JournalEntry {
  id: string;
  date: string;
  freeForm: string;
  win?: string;
  blocker?: string;
  gratitude?: string;
  mood?: 'focused' | 'calm' | 'energetic' | 'tired' | 'proud';
  ticketsEarned: number;
}

import { WallpaperId, WallpaperItem, WALLPAPERS } from '../data/wallpapers';
export type { WallpaperId, WallpaperItem };
export { WALLPAPERS };

export type AppId = 'editor' | 'shop' | 'review' | 'journal' | 'browser' | 'calculator' | 'lofi' | 'stopwatch' | 'pet' | 'stickies';

interface DeskWorkstationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  desk: DeskConfig;
  avatar: AvatarConfig;
  onUpdateDesk: (newDesk: DeskConfig) => void;
  tickets: number;
  onAddTickets: (amount: number) => void;
  focusMinutesToday: number;
  streakDays: number;
  currentTask: string;
}

export const DeskWorkstationOverlay: React.FC<DeskWorkstationOverlayProps> = ({
  isOpen,
  onClose,
  desk,
  avatar,
  onUpdateDesk,
  tickets,
  onAddTickets,
  focusMinutesToday,
  streakDays,
  currentTask,
}) => {
  // Desktop OS State
  const [activeApp, setActiveApp] = useState<AppId | null>('journal');
  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperId>(() => {
    return (localStorage.getItem('ontogether_desktop_wallpaper') as WallpaperId) || 'azure_bliss';
  });

  const [unlockedWallpapers, setUnlockedWallpapers] = useState<WallpaperId[]>(() => {
    try {
      const saved = localStorage.getItem('ontogether_unlocked_wallpapers');
      return saved ? JSON.parse(saved) : ['azure_bliss', 'midnight_ocean'];
    } catch {
      return ['azure_bliss', 'midnight_ocean'];
    }
  });

  const [unlockedApps, setUnlockedApps] = useState<AppId[]>(() => {
    try {
      const saved = localStorage.getItem('ontogether_unlocked_apps');
      return saved ? JSON.parse(saved) : ['editor', 'shop', 'review', 'journal'];
    } catch {
      return ['editor', 'shop', 'review', 'journal'];
    }
  });

  // Shop Active Category
  const [shopCategory, setShopCategory] = useState<'wallpapers' | 'apps' | 'accessories' | 'desks'>('wallpapers');

  // Text Editor State
  const [notepadText, setNotepadText] = useState(() => {
    return localStorage.getItem('ontogether_desktop_notepad') || '# Focus Scratchpad\n- [x] Plan daily goals\n- [ ] Deep work session\n- [ ] Stretch & hydrate 🍵';
  });
  const [copiedNote, setCopiedNote] = useState(false);

  // Focus Journal State
  const [freeFormText, setFreeFormText] = useState('');
  const [showOptionalPrompts, setShowOptionalPrompts] = useState(false);
  const [winText, setWinText] = useState('');
  const [blockerText, setBlockerText] = useState('');
  const [gratitudeText, setGratitudeText] = useState('');
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>('focused');
  const [savedEntries, setSavedEntries] = useState<JournalEntry[]>(() => {
    try {
      const stored = localStorage.getItem('ontogether_focus_journal');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [hasLoggedToday, setHasLoggedToday] = useState(false);

  // Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcMemory, setCalcMemory] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcResetOnNext, setCalcResetOnNext] = useState(false);

  // Stopwatch State
  const [swTime, setSwTime] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [swLaps, setSwLaps] = useState<number[]>([]);

  // Desktop Pet Kitten State
  const [petHappiness, setPetHappiness] = useState(85);
  const [petFedCount, setPetFedCount] = useState(3);
  const [petActionMsg, setPetActionMsg] = useState('Mochi is purring peacefully! 🐾');

  // Mini Lofi Synth State
  const [lofiRain, setLofiRain] = useState(true);
  const [lofiChords, setLofiChords] = useState(true);
  const [lofiCafe, setLofiCafe] = useState(false);

  // Clock in Taskbar
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const todayStr = new Date().toLocaleDateString();
    const alreadyLogged = savedEntries.some((e) => e.date === todayStr);
    setHasLoggedToday(alreadyLogged);
  }, [savedEntries]);

  // Stopwatch timer
  useEffect(() => {
    let interval: any;
    if (swRunning) {
      interval = setInterval(() => setSwTime((prev) => prev + 10), 10);
    }
    return () => clearInterval(interval);
  }, [swRunning]);

  // Window Move & Resize State (High Performance 60+ FPS direct tracking)
  const windowRef = useRef<HTMLDivElement>(null);
  const [windowBounds, setWindowBounds] = useState({
    x: 130,
    y: 56,
    width: 920,
    height: 600,
    isMaximized: false,
  });
  const [isInteracting, setIsInteracting] = useState(false);

  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    originX: 130,
    originY: 56,
    currentX: 130,
    currentY: 56,
  });

  const resizeRef = useRef({
    isResizing: false,
    startX: 0,
    startY: 0,
    startW: 920,
    startH: 600,
    currentW: 920,
    currentH: 600,
  });

  const handleStartDrag = (e: React.MouseEvent) => {
    if (windowBounds.isMaximized) return;
    e.preventDefault();
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: windowBounds.x,
      originY: windowBounds.y,
      currentX: windowBounds.x,
      currentY: windowBounds.y,
    };
    setIsInteracting(true);
  };

  const handleStartResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (windowBounds.isMaximized) return;
    resizeRef.current = {
      isResizing: true,
      startX: e.clientX,
      startY: e.clientY,
      startW: windowBounds.width,
      startH: windowBounds.height,
      currentW: windowBounds.width,
      currentH: windowBounds.height,
    };
    setIsInteracting(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragRef.current.isDragging && windowRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        const newX = Math.max(10, Math.min(window.innerWidth - 320, dragRef.current.originX + dx));
        const newY = Math.max(45, Math.min(window.innerHeight - 150, dragRef.current.originY + dy));
        dragRef.current.currentX = newX;
        dragRef.current.currentY = newY;
        windowRef.current.style.left = `${newX}px`;
        windowRef.current.style.top = `${newY}px`;
      } else if (resizeRef.current.isResizing && windowRef.current) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        const newW = Math.max(520, Math.min(window.innerWidth - 40, resizeRef.current.startW + dx));
        const newH = Math.max(380, Math.min(window.innerHeight - 80, resizeRef.current.startH + dy));
        resizeRef.current.currentW = newW;
        resizeRef.current.currentH = newH;
        windowRef.current.style.width = `${newW}px`;
        windowRef.current.style.height = `${newH}px`;
      }
    };

    const handleMouseUp = () => {
      if (dragRef.current.isDragging) {
        dragRef.current.isDragging = false;
        setWindowBounds((prev) => ({
          ...prev,
          x: dragRef.current.currentX,
          y: dragRef.current.currentY,
        }));
        setIsInteracting(false);
      }
      if (resizeRef.current.isResizing) {
        resizeRef.current.isResizing = false;
        setWindowBounds((prev) => ({
          ...prev,
          width: resizeRef.current.currentW,
          height: resizeRef.current.currentH,
        }));
        setIsInteracting(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isOpen) return null;

  // Handle Note Save
  const handleNotepadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotepadText(e.target.value);
    localStorage.setItem('ontogether_desktop_notepad', e.target.value);
  };

  const handleCopyNote = () => {
    navigator.clipboard.writeText(notepadText);
    setCopiedNote(true);
    soundEngine.playChime('chime');
    setTimeout(() => setCopiedNote(false), 2000);
  };

  const handleDownloadNote = () => {
    const element = document.createElement('a');
    const file = new Blob([notepadText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `ontogether-notes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    soundEngine.playCoin();
  };

  // Handle Journal Submit
  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!freeFormText.trim() && !winText.trim()) return;

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      freeForm: freeFormText.trim(),
      win: winText.trim() || undefined,
      blocker: blockerText.trim() || undefined,
      gratitude: gratitudeText.trim() || undefined,
      mood: selectedMood,
      ticketsEarned: 15,
    };

    const updated = [newEntry, ...savedEntries];
    setSavedEntries(updated);
    localStorage.setItem('ontogether_focus_journal', JSON.stringify(updated));

    onAddTickets(15);
    soundEngine.playCoin();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });

    setFreeFormText('');
    setWinText('');
    setBlockerText('');
    setGratitudeText('');
    setHasLoggedToday(true);
  };

  // Wallpaper equip/purchase
  const handleEquipWallpaper = (wp: WallpaperItem) => {
    if (unlockedWallpapers.includes(wp.id)) {
      setActiveWallpaper(wp.id);
      localStorage.setItem('ontogether_desktop_wallpaper', wp.id);
      soundEngine.playChime('chime');
      return;
    }

    if (tickets < wp.cost) {
      soundEngine.playChime('digital');
      return;
    }

    onAddTickets(-wp.cost);
    const newUnlocked = [...unlockedWallpapers, wp.id];
    setUnlockedWallpapers(newUnlocked);
    localStorage.setItem('ontogether_unlocked_wallpapers', JSON.stringify(newUnlocked));
    setActiveWallpaper(wp.id);
    localStorage.setItem('ontogether_desktop_wallpaper', wp.id);
    soundEngine.playCoin();
    confetti({ particleCount: 40, spread: 60 });
  };

  // App purchase
  const handleBuyApp = (app: { id: AppId; name: string; cost: number }) => {
    if (unlockedApps.includes(app.id)) {
      setActiveApp(app.id);
      soundEngine.playChime('chime');
      return;
    }

    if (tickets < app.cost) {
      soundEngine.playChime('digital');
      return;
    }

    onAddTickets(-app.cost);
    const newUnlocked = [...unlockedApps, app.id];
    setUnlockedApps(newUnlocked);
    localStorage.setItem('ontogether_unlocked_apps', JSON.stringify(newUnlocked));
    setActiveApp(app.id);
    soundEngine.playCoin();
    confetti({ particleCount: 50, spread: 75 });
  };

  // Calculator Logic
  const handleCalcNum = (num: string) => {
    if (calcResetOnNext || calcDisplay === '0') {
      setCalcDisplay(num);
      setCalcResetOnNext(false);
    } else {
      setCalcDisplay((prev) => prev + num);
    }
  };

  const handleCalcOp = (op: string) => {
    const currentVal = parseFloat(calcDisplay);
    if (calcMemory !== null && calcOp) {
      let result = currentVal;
      if (calcOp === '+') result = calcMemory + currentVal;
      else if (calcOp === '-') result = calcMemory - currentVal;
      else if (calcOp === '×') result = calcMemory * currentVal;
      else if (calcOp === '÷') result = currentVal !== 0 ? calcMemory / currentVal : 0;
      setCalcDisplay(String(Number(result.toFixed(6))));
      setCalcMemory(result);
    } else {
      setCalcMemory(currentVal);
    }
    setCalcOp(op);
    setCalcResetOnNext(true);
  };

  const handleCalcEquals = () => {
    if (calcMemory === null || !calcOp) return;
    const currentVal = parseFloat(calcDisplay);
    let result = currentVal;
    if (calcOp === '+') result = calcMemory + currentVal;
    else if (calcOp === '-') result = calcMemory - currentVal;
    else if (calcOp === '×') result = calcMemory * currentVal;
    else if (calcOp === '÷') result = currentVal !== 0 ? calcMemory / currentVal : 0;
    setCalcDisplay(String(Number(result.toFixed(6))));
    setCalcMemory(null);
    setCalcOp(null);
    setCalcResetOnNext(true);
    soundEngine.playPop();
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcMemory(null);
    setCalcOp(null);
    setCalcResetOnNext(false);
  };

  // Pet actions
  const handleFeedPet = () => {
    setPetHappiness((prev) => Math.min(100, prev + 15));
    setPetFedCount((prev) => prev + 1);
    setPetActionMsg('Mochi loved the salmon treat! (+15% Happiness) 🐟');
    soundEngine.playPop();
    confetti({ particleCount: 25, spread: 45 });
  };

  const handlePetCat = () => {
    setPetHappiness((prev) => Math.min(100, prev + 10));
    setPetActionMsg('Mochi rubbed their head against your hand! ❤️');
    soundEngine.playChime('chime');
  };

  // Current active wallpaper item
  const curWallpaperItem = WALLPAPERS.find((w) => w.id === activeWallpaper) || WALLPAPERS[0];

  const appCatalog: {
    id: AppId;
    name: string;
    icon: React.ReactNode;
    cost: number;
    desc: string;
    tag: string;
  }[] = [
    {
      id: 'browser',
      name: 'Safari Browser Pro & Lounge',
      icon: <Globe className="w-5 h-5 text-sky-300" />,
      cost: 20,
      desc: 'Modern web browser with Luxe Boutique, cute extensive wallpapers, and CoffeeLounge social chat',
      tag: 'Internet',
    },
    {
      id: 'calculator',
      name: 'Retro Desk Calculator',
      icon: <Calculator className="w-5 h-5 text-amber-300" />,
      cost: 15,
      desc: 'Standard pocket arithmetic calculator for quick calculations',
      tag: 'Productivity',
    },
    {
      id: 'lofi',
      name: 'Lofi Mini Sound Deck',
      icon: <Music className="w-5 h-5 text-cyan-300" />,
      cost: 20,
      desc: 'Compact desktop sound generator with ambient audio controls',
      tag: 'Audio',
    },
    {
      id: 'stopwatch',
      name: 'Stopwatch & Lap Timer',
      icon: <Timer className="w-5 h-5 text-emerald-300" />,
      cost: 15,
      desc: 'High-precision lap timer for sprint challenges',
      tag: 'Utility',
    },
    {
      id: 'pet',
      name: 'Mochi Desktop Tamagotchi',
      icon: <Heart className="w-5 h-5 text-rose-300" />,
      cost: 25,
      desc: 'Animated pixel kitty companion living on your desktop screen',
      tag: 'Companion',
    },
  ];

  // Desk accessories
  const shopAccessories: {
    id: DeskConfig['deskAccessory'];
    name: string;
    icon: string;
    cost: number;
    desc: string;
  }[] = [
    { id: 'mug', name: 'Ceramic Matcha Mug', icon: '🍵', cost: 0, desc: 'Steaming cozy hot beverage' },
    { id: 'succulent', name: 'Echeveria Succulent', icon: '🪴', cost: 15, desc: 'Low maintenance desktop plant' },
    { id: 'bonsai', name: 'Miniature Bonsai', icon: '🌳', cost: 25, desc: 'Ancient zen aesthetic tree' },
    { id: 'mushroom_lamp', name: 'Toadstool Glow Lamp', icon: '🍄', cost: 30, desc: 'Warm fairy forest light' },
    { id: 'lava_lamp', name: 'Cyber Lava Lamp', icon: '🧪', cost: 35, desc: 'Retro animated bubbling flow' },
    { id: 'gameboy', name: 'Retro 8-Bit Console', icon: '🕹️', cost: 40, desc: 'Classic handheld gaming nostalgia' },
    { id: 'crystal', name: 'Amethyst Quartz', icon: '💎', cost: 45, desc: 'Resonating glowing focus crystal' },
  ];

  const shopDesks: {
    id: DeskConfig['deskStyle'];
    name: string;
    icon: string;
    cost: number;
    desc: string;
  }[] = [
    { id: 'wood', name: 'Natural Scandinavian Oak', icon: '🪵', cost: 0, desc: 'Clean, warm organic finish' },
    { id: 'walnut', name: 'Executive Dark Walnut', icon: '🌰', cost: 35, desc: 'Deep rich vintage timber' },
    { id: 'vintage', name: 'Antique Scholar Wood', icon: '📜', cost: 45, desc: 'Carved ornate library wood' },
    { id: 'sakura', name: 'Cherry Blossom Bloom', icon: '🌸', cost: 50, desc: 'Soft pastel pink sakura grain' },
    { id: 'cyber', name: 'Neo-Tokyo Cyberpunk', icon: '⚡', cost: 60, desc: 'Dark carbon alloy with neon edges' },
    { id: 'crystal', name: 'Amethyst Monolith', icon: '🔮', cost: 75, desc: 'Translucent glowing crystal slab' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* 1. Main Desktop Screen Canvas */}
      <div
        className={`relative flex-1 w-full overflow-hidden select-none transition-all duration-700 ${curWallpaperItem.gradientClass}`}
        style={{
          backgroundImage: `url("${curWallpaperItem.imageUrl}"), url("${curWallpaperItem.svgFallback}"), ${curWallpaperItem.pattern}`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay for desktop icons legibility */}
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[0.5px] pointer-events-none" />
        {/* Subtle Screen Scanline / Bezel Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]" />

        {/* Top Desktop Navigation Bar */}
        <header className="relative z-20 flex items-center justify-between px-4 py-2.5 bg-black/40 backdrop-blur-md border-b border-white/10 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-500/30 border border-blue-400/40 px-2.5 py-1 rounded-xl">
              <Laptop className="w-4 h-4 text-blue-300" />
              <span className="font-cozy font-bold text-xs tracking-wide">CozyOS Workstation</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-blue-200/80 font-mono-timer">
              <span>{avatar.name}&apos;s Station</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Ticket Counter */}
            <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/50 px-3 py-1 rounded-xl text-amber-200 text-xs font-bold font-mono-timer shadow-sm">
              <span>🎟️</span>
              <span>{tickets} Tickets</span>
            </div>

            {/* Exit to Room View */}
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-cozy font-bold shadow-lg transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit to Room</span>
            </button>
          </div>
        </header>

        {/* Desktop Icons Grid (Left side) */}
        <div className="absolute top-14 left-4 z-10 flex flex-col gap-4 p-2">
          {/* 1. Text Editor */}
          <button
            onClick={() => setActiveApp('editor')}
            className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all w-20 ${
              activeApp === 'editor' ? 'bg-white/25 shadow-lg backdrop-blur-md' : 'hover:bg-white/15'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform border border-white/20">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-cozy text-white font-medium text-center drop-shadow-md leading-tight">
              Txt Editor
            </span>
          </button>

          {/* 2. Focus Journal */}
          <button
            onClick={() => setActiveApp('journal')}
            className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all w-20 ${
              activeApp === 'journal' ? 'bg-white/25 shadow-lg backdrop-blur-md' : 'hover:bg-white/15'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform border border-white/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-cozy text-white font-medium text-center drop-shadow-md leading-tight">
              Journal
            </span>
          </button>

          {/* 3. Work Review */}
          <button
            onClick={() => setActiveApp('review')}
            className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all w-20 ${
              activeApp === 'review' ? 'bg-white/25 shadow-lg backdrop-blur-md' : 'hover:bg-white/15'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform border border-white/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-cozy text-white font-medium text-center drop-shadow-md leading-tight">
              Work Review
            </span>
          </button>

          {/* 4. App & Desk Store */}
          <button
            onClick={() => setActiveApp('shop')}
            className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all w-20 ${
              activeApp === 'shop' ? 'bg-white/25 shadow-lg backdrop-blur-md' : 'hover:bg-white/15'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform border border-white/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-cozy text-white font-medium text-center drop-shadow-md leading-tight">
              Store
            </span>
          </button>

          {unlockedApps.includes('browser') && (
            <button
              onClick={() => setActiveApp('browser')}
              className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all w-20 ${
                activeApp === 'browser' ? 'bg-white/25 shadow-lg backdrop-blur-md' : 'hover:bg-white/15'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform border border-white/20">
                <Globe className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-cozy text-white font-medium text-center drop-shadow-md leading-tight">
                Browser
              </span>
            </button>
          )}

          {unlockedApps.includes('calculator') && (
            <button
              onClick={() => setActiveApp('calculator')}
              className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all w-20 ${
                activeApp === 'calculator' ? 'bg-white/25 shadow-lg backdrop-blur-md' : 'hover:bg-white/15'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform border border-white/20">
                <Calculator className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-cozy text-white font-medium text-center drop-shadow-md leading-tight">
                Calculator
              </span>
            </button>
          )}

          {unlockedApps.includes('lofi') && (
            <button
              onClick={() => setActiveApp('lofi')}
              className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all w-20 ${
                activeApp === 'lofi' ? 'bg-white/25 shadow-lg backdrop-blur-md' : 'hover:bg-white/15'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform border border-white/20">
                <Music className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-cozy text-white font-medium text-center drop-shadow-md leading-tight">
                Lofi Deck
              </span>
            </button>
          )}

          {unlockedApps.includes('stopwatch') && (
            <button
              onClick={() => setActiveApp('stopwatch')}
              className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all w-20 ${
                activeApp === 'stopwatch' ? 'bg-white/25 shadow-lg backdrop-blur-md' : 'hover:bg-white/15'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform border border-white/20">
                <Timer className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-cozy text-white font-medium text-center drop-shadow-md leading-tight">
                Stopwatch
              </span>
            </button>
          )}

          {unlockedApps.includes('pet') && (
            <button
              onClick={() => setActiveApp('pet')}
              className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all w-20 ${
                activeApp === 'pet' ? 'bg-white/25 shadow-lg backdrop-blur-md' : 'hover:bg-white/15'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform border border-white/20">
                <Heart className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-cozy text-white font-medium text-center drop-shadow-md leading-tight">
                Mochi Pet
              </span>
            </button>
          )}
        </div>

        {/* 2. Floating Application Window Center */}
        {activeApp && (
          <div
            ref={windowRef}
            className={`absolute z-30 flex flex-col bg-[#161224]/95 backdrop-blur-xl border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden will-change-[left,top,width,height] ${
              isInteracting ? 'transition-none select-none pointer-events-auto' : 'transition-[left,top,width,height] duration-150'
            } ${
              windowBounds.isMaximized
                ? 'top-14 left-24 right-4 bottom-14 rounded-xl'
                : ''
            }`}
            style={
              windowBounds.isMaximized
                ? undefined
                : {
                    left: `${windowBounds.x}px`,
                    top: `${windowBounds.y}px`,
                    width: `${windowBounds.width}px`,
                    height: `${windowBounds.height}px`,
                  }
            }
          >
            {/* Window Title Bar with Apple-like Controls */}
            <div
              onMouseDown={handleStartDrag}
              className="flex items-center justify-between px-4 py-2.5 bg-[#201836] border-b border-purple-500/30 text-white select-none cursor-move"
            >
              {/* Apple Traffic Light Buttons (Exit / Minimize / Resize) */}
              <div className="flex items-center gap-2">
                {/* Red: Exit / Close */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveApp(null);
                    soundEngine.playChime('digital');
                  }}
                  className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] hover:bg-[#e0443e] flex items-center justify-center group/btn shadow-xs transition-transform active:scale-90"
                  title="Close (Exit)"
                >
                  <X className="w-2 h-2 text-black/80 opacity-0 group-hover/btn:opacity-100 transition-opacity font-bold" />
                </button>

                {/* Yellow: Minimize */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveApp(null);
                    soundEngine.playChime('chime');
                  }}
                  className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] hover:bg-[#dea123] flex items-center justify-center group/btn shadow-xs transition-transform active:scale-90"
                  title="Minimize"
                >
                  <Minus className="w-2 h-2 text-black/80 opacity-0 group-hover/btn:opacity-100 transition-opacity font-bold" />
                </button>

                {/* Green: Resize / Maximize */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWindowBounds((prev) => ({ ...prev, isMaximized: !prev.isMaximized }));
                    soundEngine.playChime('bell');
                  }}
                  className="w-3.5 h-3.5 rounded-full bg-[#27c93f] hover:bg-[#1aab29] flex items-center justify-center group/btn shadow-xs transition-transform active:scale-90"
                  title={windowBounds.isMaximized ? 'Restore Size' : 'Resize / Maximize'}
                >
                  {windowBounds.isMaximized ? (
                    <Minimize2 className="w-2 h-2 text-black/80 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  ) : (
                    <Maximize2 className="w-2 h-2 text-black/80 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  )}
                </button>
              </div>

              {/* Window Title & Icon */}
              <div className="flex items-center gap-2 pointer-events-none">
                {activeApp === 'editor' && <FileText className="w-4 h-4 text-sky-400" />}
                {activeApp === 'journal' && <BookOpen className="w-4 h-4 text-purple-400" />}
                {activeApp === 'review' && <BarChart3 className="w-4 h-4 text-emerald-400" />}
                {activeApp === 'shop' && <ShoppingBag className="w-4 h-4 text-amber-400" />}
                {activeApp === 'browser' && <Globe className="w-4 h-4 text-sky-400" />}
                {activeApp === 'calculator' && <Calculator className="w-4 h-4 text-orange-400" />}
                {activeApp === 'lofi' && <Music className="w-4 h-4 text-cyan-400" />}
                {activeApp === 'stopwatch' && <Timer className="w-4 h-4 text-green-400" />}
                {activeApp === 'pet' && <Heart className="w-4 h-4 text-pink-400" />}

                <span className="text-xs font-cozy font-bold">
                  {activeApp === 'editor' && 'Txt Editor - CozyPad Notes'}
                  {activeApp === 'journal' && 'Focus Journal & Brain Dump'}
                  {activeApp === 'review' && 'Work Review & Daily Analytics'}
                  {activeApp === 'shop' && 'CozyWork App & Desk Store'}
                  {activeApp === 'browser' && 'Safari Browser Pro & Lounge'}
                  {activeApp === 'calculator' && 'Retro Desk Calculator'}
                  {activeApp === 'lofi' && 'Lofi Mini Sound Generator'}
                  {activeApp === 'stopwatch' && 'Stopwatch & Lap Timer'}
                  {activeApp === 'pet' && 'Mochi Desktop Tamagotchi'}
                </span>
              </div>

              {/* Drag instruction notice */}
              <div className="flex items-center gap-1.5 text-[11px] text-purple-300/80 font-mono-timer">
                <span className="hidden sm:inline">Drag title bar to move</span>
              </div>
            </div>

            {/* Window Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-purple-100 font-cozy">
              {/* APP 1: TXT EDITOR */}
              {activeApp === 'editor' && (
                <div className="flex flex-col h-full gap-4">
                  <div className="flex items-center justify-between bg-purple-950/40 border border-purple-800/40 p-2.5 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-purple-300">
                      <span>Words: {notepadText.trim() ? notepadText.trim().split(/\s+/).length : 0}</span>
                      <span>•</span>
                      <span>Chars: {notepadText.length}</span>
                      <span>•</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Auto-saved
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyNote}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-800/60 hover:bg-purple-700 text-xs text-purple-200 transition-all"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedNote ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={handleDownloadNote}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-800/60 hover:bg-purple-700 text-xs text-purple-200 transition-all"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export .txt</span>
                      </button>
                      <button
                        onClick={() => {
                          setNotepadText('');
                          localStorage.setItem('ontogether_desktop_notepad', '');
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-900/40 hover:bg-rose-800 text-xs text-rose-300 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={notepadText}
                    onChange={handleNotepadChange}
                    placeholder="Write your focus notes, thoughts, tasks, code snippets, or thoughts here..."
                    className="flex-1 w-full p-4 bg-[#0e0a1a] border border-purple-900/60 rounded-xl text-purple-100 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:border-purple-500 shadow-inner"
                  />
                </div>
              )}

              {/* APP 2: FOCUS JOURNAL */}
              {activeApp === 'journal' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Journal Editor */}
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 p-4 rounded-2xl">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        <span>Daily Free-Form Focus Reflection</span>
                      </h3>
                      <p className="text-xs text-purple-300/80 mt-1">
                        Reflect freely on your deep work sessions today. Earn +15 🎟️ Focus Tickets on each daily entry.
                      </p>
                    </div>

                    <form onSubmit={handleSaveJournal} className="flex flex-col gap-4">
                      {/* Main Free-Form Writing Box */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-purple-200 flex items-center justify-between">
                          <span>Free-Form Journal & Brain Dump</span>
                          <span className="text-[10px] text-purple-400">Write freely...</span>
                        </label>
                        <textarea
                          rows={6}
                          value={freeFormText}
                          onChange={(e) => setFreeFormText(e.target.value)}
                          placeholder="How did your focus sessions go today? What problems did you solve, what ideas came up, or what do you want to reflect on?"
                          className="w-full p-3.5 bg-[#0f0b1c] border border-purple-800/60 rounded-xl text-purple-100 text-sm leading-relaxed focus:outline-none focus:border-purple-500 shadow-inner resize-y"
                        />
                      </div>

                      {/* Optional Structured Prompts Collapsible Accordion */}
                      <div className="border border-purple-800/50 rounded-xl bg-purple-950/20 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setShowOptionalPrompts(!showOptionalPrompts)}
                          className="w-full flex items-center justify-between p-3 text-xs font-bold text-purple-300 hover:text-white transition-colors bg-purple-900/30"
                        >
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Optional Structured Prompts (Victories, Blockers, Gratitude, Mindset)</span>
                          </span>
                          {showOptionalPrompts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showOptionalPrompts && (
                          <div className="p-4 flex flex-col gap-3.5 border-t border-purple-800/40 animate-fadeIn">
                            {/* 1. Today's Victory */}
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-medium text-emerald-300 flex items-center gap-1">
                                <span>🎯 Today&apos;s Victory / Focus Highlight</span>
                                <span className="text-[10px] text-purple-400">(Optional)</span>
                              </label>
                              <input
                                type="text"
                                value={winText}
                                onChange={(e) => setWinText(e.target.value)}
                                placeholder="e.g. Completed feature architecture, shipped PR, studied 2 full Pomodoros..."
                                className="w-full p-2.5 bg-[#0f0b1c] border border-purple-900/60 rounded-xl text-purple-100 text-xs focus:outline-none focus:border-emerald-500"
                              />
                            </div>

                            {/* 2. Distractions or Blockers */}
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-medium text-amber-300 flex items-center gap-1">
                                <span>🚧 Distraction / Blocker Overcome</span>
                                <span className="text-[10px] text-purple-400">(Optional)</span>
                              </label>
                              <input
                                type="text"
                                value={blockerText}
                                onChange={(e) => setBlockerText(e.target.value)}
                                placeholder="e.g. Turned off phone notifications, took short walking break to reset..."
                                className="w-full p-2.5 bg-[#0f0b1c] border border-purple-900/60 rounded-xl text-purple-100 text-xs focus:outline-none focus:border-amber-500"
                              />
                            </div>

                            {/* 3. Gratitude */}
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-medium text-pink-300 flex items-center gap-1">
                                <span>💖 Workspace Gratitude</span>
                                <span className="text-[10px] text-purple-400">(Optional)</span>
                              </label>
                              <input
                                type="text"
                                value={gratitudeText}
                                onChange={(e) => setGratitudeText(e.target.value)}
                                placeholder="e.g. Delicious hot tea, supportive co-workers in the room, quiet rainy evening..."
                                className="w-full p-2.5 bg-[#0f0b1c] border border-purple-900/60 rounded-xl text-purple-100 text-xs focus:outline-none focus:border-pink-500"
                              />
                            </div>

                            {/* 4. Mindset Rating */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-medium text-purple-200">
                                <span>🧠 Mindset & Focus Energy</span>
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { id: 'focused', label: '🎯 Laser Focused' },
                                  { id: 'calm', label: '🍵 Cozy & Calm' },
                                  { id: 'energetic', label: '⚡ High Energy' },
                                  { id: 'tired', label: '💤 Gentle & Tired' },
                                  { id: 'proud', label: '👑 Accomplished' },
                                ].map((m) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setSelectedMood(m.id as any)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-cozy transition-all ${
                                      selectedMood === m.id
                                        ? 'bg-purple-600 text-white font-bold border border-purple-400 shadow-md'
                                        : 'bg-purple-950/60 text-purple-300 hover:text-white border border-purple-900/40'
                                    }`}
                                  >
                                    {m.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={!freeFormText.trim() && !winText.trim()}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-cozy font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Award className="w-4 h-4 text-amber-300" />
                        <span>Save Daily Reflection (+15 🎟️ Tickets)</span>
                      </button>
                    </form>
                  </div>

                  {/* Right Column: History List */}
                  <div className="lg:col-span-5 flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span>Past Reflections History ({savedEntries.length})</span>
                    </h4>

                    <div className="flex-1 overflow-y-auto max-h-[460px] flex flex-col gap-3 pr-1">
                      {savedEntries.length === 0 ? (
                        <div className="p-8 text-center bg-purple-950/20 border border-purple-900/40 rounded-2xl text-xs text-purple-400">
                          <span>No reflections logged yet. Write your first journal entry above! ✨</span>
                        </div>
                      ) : (
                        savedEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-purple-950/40 border border-purple-800/40 p-3.5 rounded-xl flex flex-col gap-2 shadow-sm"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white">{entry.date}</span>
                              <span className="px-2 py-0.5 rounded-full bg-purple-900/80 text-[10px] text-purple-300 font-mono-timer">
                                {entry.mood || 'focused'}
                              </span>
                            </div>

                            {entry.freeForm && (
                              <p className="text-xs text-purple-200 leading-relaxed italic bg-purple-900/30 p-2.5 rounded-lg border border-purple-800/30 whitespace-pre-line">
                                &quot;{entry.freeForm}&quot;
                              </p>
                            )}

                            {entry.win && (
                              <div className="text-[11px] text-emerald-300">
                                <span className="font-bold">🎯 Win:</span> {entry.win}
                              </div>
                            )}

                            {entry.gratitude && (
                              <div className="text-[11px] text-pink-300">
                                <span className="font-bold">💖 Gratitude:</span> {entry.gratitude}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* APP 3: WORK REVIEW & ANALYTICS */}
              {activeApp === 'review' && (
                <div className="flex flex-col gap-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 p-4 rounded-2xl flex flex-col gap-1">
                      <span className="text-[11px] text-purple-300">Focus Today</span>
                      <span className="text-2xl font-bold text-white font-mono-timer">{focusMinutesToday} min</span>
                      <span className="text-[10px] text-emerald-400">🔥 +15% vs yesterday</span>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 p-4 rounded-2xl flex flex-col gap-1">
                      <span className="text-[11px] text-purple-300">Current Streak</span>
                      <span className="text-2xl font-bold text-amber-300 font-mono-timer">{streakDays} Days</span>
                      <span className="text-[10px] text-amber-200/80">🏆 Super Consistent</span>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 p-4 rounded-2xl flex flex-col gap-1">
                      <span className="text-[11px] text-purple-300">Tickets Balance</span>
                      <span className="text-2xl font-bold text-yellow-300 font-mono-timer">🎟️ {tickets}</span>
                      <span className="text-[10px] text-yellow-200/80">Earn more with Pomodoros</span>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 p-4 rounded-2xl flex flex-col gap-1">
                      <span className="text-[11px] text-purple-300">Focus Efficiency</span>
                      <span className="text-2xl font-bold text-cyan-300 font-mono-timer">96%</span>
                      <span className="text-[10px] text-cyan-200/80">⚡ Flow state reached</span>
                    </div>
                  </div>

                  {/* Hourly Session Timeline */}
                  <div className="bg-purple-950/40 border border-purple-800/40 p-5 rounded-2xl flex flex-col gap-4">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>Today&apos;s Focus Block History</span>
                    </h4>

                    <div className="flex flex-col gap-3">
                      {[
                        { time: '09:00 AM', task: 'Deep Work: Project Architecture & API Design', duration: '50m', status: 'Completed', tag: 'High Focus' },
                        { time: '11:15 AM', task: 'Co-Working Sprint: UI Components & Voxel Shader', duration: '25m', status: 'Completed', tag: 'Creative' },
                        { time: '02:00 PM', task: 'Peer Review & Ticket Milestone Check', duration: '25m', status: 'Completed', tag: 'Collaboration' },
                        { time: '04:30 PM', task: currentTask || 'Daily Focus Goal', duration: 'In Progress', status: 'Active', tag: 'Live Now' },
                      ].map((session, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-purple-900/30 border border-purple-800/30 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono-timer text-purple-400">{session.time}</span>
                            <span className="text-xs text-white font-medium">{session.task}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-800/60 text-purple-200">
                              {session.tag}
                            </span>
                            <span className="text-xs font-mono-timer text-emerald-400">{session.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* APP 4: STORE (WALLPAPERS, APPS, DESK STYLES, ACCESSORIES) */}
              {activeApp === 'shop' && (
                <div className="flex flex-col gap-5">
                  {/* Category Nav Tabs */}
                  <div className="flex flex-wrap gap-2 border-b border-purple-800/40 pb-3">
                    {[
                      { id: 'wallpapers', label: '🖼️ Desktop Wallpapers' },
                      { id: 'apps', label: '📱 Desktop Apps' },
                      { id: 'desks', label: '🪵 Desk Finishes' },
                      { id: 'accessories', label: '🪴 3D Desk Items' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setShopCategory(tab.id as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-cozy transition-all ${
                          shopCategory === tab.id
                            ? 'bg-purple-600 text-white font-bold shadow-md'
                            : 'bg-purple-950/60 text-purple-300 hover:text-white border border-purple-900/40'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* WALLPAPERS CATALOG */}
                  {shopCategory === 'wallpapers' && (
                    <div className="space-y-4">
                      {/* Safari Browser Pro Unlocked vs Locked Banner */}
                      {!unlockedApps.includes('browser') ? (
                        <div className="bg-gradient-to-r from-purple-950/80 via-pink-950/70 to-indigo-950/80 border border-pink-500/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-pink-600/30 border border-pink-400/50 flex items-center justify-center text-pink-300 shrink-0 text-xl">
                              🍜
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>Basic Wallpapers Shown</span>
                                <span className="bg-pink-500/20 text-pink-300 text-[10px] px-2 py-0.5 rounded-full border border-pink-400/30">
                                  Safari Pro Required for Premium
                                </span>
                              </h4>
                              <p className="text-[11px] text-purple-200/80 mt-0.5">
                                Buy <strong>Safari Browser Pro</strong> (🎟️ 20) in Desktop Apps to unlock 15+ cute cartoon foods, pets, and anime wallpapers!
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const safariApp = appCatalog.find((a) => a.id === 'browser');
                              if (safariApp) handleBuyApp(safariApp);
                            }}
                            className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold font-cozy shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Unlock Safari Pro (🎟️ 20)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-emerald-950/70 via-teal-950/60 to-purple-950/70 border border-emerald-500/40 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">✨</span>
                            <div>
                              <span className="text-xs font-bold text-white">Safari Browser Pro Active!</span>
                              <span className="text-[11px] text-emerald-200/80 block">
                                Full Cute Food & Pets Boutique unlocked in Safari. You can equip wallpapers directly here or inside Safari.
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveApp('browser')}
                            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Open Safari Pro</span>
                          </button>
                        </div>
                      )}

                      {/* Wallpapers Grid: Only basic when Safari not purchased */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(unlockedApps.includes('browser')
                          ? WALLPAPERS
                          : WALLPAPERS.filter((w) => w.tier === 'basic')
                        ).map((wp) => {
                          const isEquipped = activeWallpaper === wp.id;
                          const isUnlocked = unlockedWallpapers.includes(wp.id);
                          const canAfford = tickets >= wp.cost;

                          return (
                            <div
                              key={wp.id}
                              className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                                isEquipped
                                  ? 'bg-purple-900/60 border-purple-400 shadow-lg'
                                  : 'bg-purple-950/40 border-purple-800/40 hover:border-purple-600'
                              }`}
                            >
                              {/* Wallpaper Thumbnail Preview */}
                              <div>
                                <div
                                  className={`h-24 rounded-xl border border-white/20 shadow-inner relative overflow-hidden flex items-center justify-center ${wp.gradientClass}`}
                                >
                                  <img
                                    src={wp.imageUrl}
                                    alt={wp.name}
                                    onError={(e) => {
                                      e.currentTarget.src = wp.svgFallback;
                                    }}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-black/15" />
                                  {isEquipped && (
                                    <span className="absolute top-2 right-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white font-bold flex items-center gap-1 border border-white/20 shadow-lg">
                                      <Check className="w-3 h-3 text-emerald-400" /> Active
                                    </span>
                                  )}
                                  <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-purple-200 font-mono">
                                    {wp.category.toUpperCase()}
                                  </span>
                                </div>

                                <div className="flex flex-col gap-0.5 mt-2.5">
                                  <span className="text-xs font-bold text-white">{wp.name}</span>
                                  <span className="text-[10px] text-purple-300/80 leading-snug line-clamp-2">{wp.desc}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleEquipWallpaper(wp)}
                                className={`w-full py-2 rounded-xl text-xs font-cozy font-bold transition-all flex items-center justify-center gap-1.5 ${
                                  isEquipped
                                    ? 'bg-emerald-600 text-white cursor-default'
                                    : isUnlocked
                                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                    : canAfford
                                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                                    : 'bg-purple-950 text-purple-500 border border-purple-800/40 cursor-not-allowed'
                                }`}
                              >
                                {isEquipped ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" /> Equipped
                                  </>
                                ) : isUnlocked ? (
                                  'Set Wallpaper'
                                ) : (
                                  <>
                                    <span>🎟️ {wp.cost} Tickets</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* DESKTOP APPS CATALOG */}
                  {shopCategory === 'apps' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                      {appCatalog.map((app) => {
                        const isUnlocked = unlockedApps.includes(app.id);
                        const canAfford = tickets >= app.cost;

                        return (
                          <div
                            key={app.id}
                            className="bg-purple-950/40 border border-purple-800/40 p-4 rounded-2xl flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center">
                                {app.icon}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-white">{app.name}</span>
                                <span className="text-[11px] text-purple-300/80">{app.desc}</span>
                                <span className="text-[10px] text-purple-400 font-mono-timer">{app.tag}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleBuyApp(app)}
                              className={`px-4 py-2 rounded-xl text-xs font-cozy font-bold transition-all whitespace-nowrap ${
                                isUnlocked
                                  ? 'bg-purple-700 text-white hover:bg-purple-600'
                                  : canAfford
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                                  : 'bg-purple-950 text-purple-500 border border-purple-800/40 cursor-not-allowed'
                              }`}
                            >
                              {isUnlocked ? 'Open App' : `Buy (🎟️ ${app.cost})`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* DESK FINISHES CATALOG */}
                  {shopCategory === 'desks' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {shopDesks.map((d) => {
                        const isEquipped = desk.deskStyle === d.id;
                        return (
                          <div
                            key={d.id}
                            className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                              isEquipped ? 'bg-purple-900/60 border-purple-400' : 'bg-purple-950/40 border-purple-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{d.icon}</span>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">{d.name}</span>
                                <span className="text-[10px] text-purple-300/80">{d.desc}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                onUpdateDesk({ ...desk, deskStyle: d.id });
                                soundEngine.playChime('chime');
                              }}
                              className={`w-full py-2 rounded-xl text-xs font-cozy font-bold ${
                                isEquipped ? 'bg-emerald-600 text-white' : 'bg-purple-700 hover:bg-purple-600 text-white'
                              }`}
                            >
                              {isEquipped ? 'Equipped' : d.cost === 0 ? 'Equip Free' : `Equip (🎟️ ${d.cost})`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 3D ACCESSORIES CATALOG */}
                  {shopCategory === 'accessories' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {shopAccessories.map((acc) => {
                        const isEquipped = desk.deskAccessory === acc.id;
                        return (
                          <div
                            key={acc.id}
                            className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                              isEquipped ? 'bg-purple-900/60 border-purple-400' : 'bg-purple-950/40 border-purple-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{acc.icon}</span>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">{acc.name}</span>
                                <span className="text-[10px] text-purple-300/80">{acc.desc}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                onUpdateDesk({ ...desk, deskAccessory: acc.id });
                                soundEngine.playChime('chime');
                              }}
                              className={`w-full py-2 rounded-xl text-xs font-cozy font-bold ${
                                isEquipped ? 'bg-emerald-600 text-white' : 'bg-purple-700 hover:bg-purple-600 text-white'
                              }`}
                            >
                              {isEquipped ? 'Equipped' : acc.cost === 0 ? 'Equip Free' : `Equip (🎟️ ${acc.cost})`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* APP 5: CALCULATOR */}
              {activeApp === 'calculator' && (
                <div className="max-w-xs mx-auto bg-[#0f0a1c] border border-purple-700/50 p-4 rounded-2xl flex flex-col gap-3 shadow-2xl">
                  {/* Display */}
                  <div className="bg-[#1b1333] border border-purple-800 p-3 rounded-xl text-right font-mono text-xl text-white font-bold overflow-x-auto">
                    {calcDisplay}
                  </div>

                  {/* Keypad */}
                  <div className="grid grid-cols-4 gap-2 text-xs font-bold font-mono">
                    <button onClick={handleCalcClear} className="col-span-2 p-2.5 rounded-xl bg-rose-900/60 text-rose-200">
                      C
                    </button>
                    <button onClick={() => handleCalcOp('÷')} className="p-2.5 rounded-xl bg-purple-800 text-purple-200">
                      ÷
                    </button>
                    <button onClick={() => handleCalcOp('×')} className="p-2.5 rounded-xl bg-purple-800 text-purple-200">
                      ×
                    </button>

                    {['7', '8', '9'].map((n) => (
                      <button key={n} onClick={() => handleCalcNum(n)} className="p-2.5 rounded-xl bg-purple-950 text-white">
                        {n}
                      </button>
                    ))}
                    <button onClick={() => handleCalcOp('-')} className="p-2.5 rounded-xl bg-purple-800 text-purple-200">
                      -
                    </button>

                    {['4', '5', '6'].map((n) => (
                      <button key={n} onClick={() => handleCalcNum(n)} className="p-2.5 rounded-xl bg-purple-950 text-white">
                        {n}
                      </button>
                    ))}
                    <button onClick={() => handleCalcOp('+')} className="p-2.5 rounded-xl bg-purple-800 text-purple-200">
                      +
                    </button>

                    {['1', '2', '3'].map((n) => (
                      <button key={n} onClick={() => handleCalcNum(n)} className="p-2.5 rounded-xl bg-purple-950 text-white">
                        {n}
                      </button>
                    ))}
                    <button onClick={handleCalcEquals} className="row-span-2 p-2.5 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      =
                    </button>

                    <button onClick={() => handleCalcNum('0')} className="col-span-2 p-2.5 rounded-xl bg-purple-950 text-white">
                      0
                    </button>
                    <button onClick={() => handleCalcNum('.')} className="p-2.5 rounded-xl bg-purple-950 text-white">
                      .
                    </button>
                  </div>
                </div>
              )}

              {/* APP 6: LO-FI SOUND DECK */}
              {activeApp === 'lofi' && (
                <div className="max-w-md mx-auto bg-purple-950/40 border border-purple-800/40 p-5 rounded-2xl flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Music className="w-4 h-4 text-cyan-400" />
                    <span>Desk Ambient Sound Deck</span>
                  </h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 bg-purple-900/30 rounded-xl">
                      <span>🌧️ Rain Window</span>
                      <button
                        onClick={() => setLofiRain(!lofiRain)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${lofiRain ? 'bg-cyan-600 text-white' : 'bg-purple-950 text-purple-400'}`}
                      >
                        {lofiRain ? 'Playing' : 'Muted'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-900/30 rounded-xl">
                      <span>🎹 Lo-Fi Chords</span>
                      <button
                        onClick={() => setLofiChords(!lofiChords)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${lofiChords ? 'bg-purple-600 text-white' : 'bg-purple-950 text-purple-400'}`}
                      >
                        {lofiChords ? 'Playing' : 'Muted'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-900/30 rounded-xl">
                      <span>☕ Cafe Murmur</span>
                      <button
                        onClick={() => setLofiCafe(!lofiCafe)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${lofiCafe ? 'bg-amber-600 text-white' : 'bg-purple-950 text-purple-400'}`}
                      >
                        {lofiCafe ? 'Playing' : 'Muted'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* APP 7: STOPWATCH */}
              {activeApp === 'stopwatch' && (
                <div className="max-w-sm mx-auto bg-[#0e0a1a] border border-green-800/50 p-5 rounded-2xl flex flex-col items-center gap-4">
                  <div className="text-3xl font-mono-timer font-bold text-green-400">
                    {Math.floor(swTime / 60000)
                      .toString()
                      .padStart(2, '0')}
                    :
                    {Math.floor((swTime % 60000) / 1000)
                      .toString()
                      .padStart(2, '0')}
                    .
                    {Math.floor((swTime % 1000) / 10)
                      .toString()
                      .padStart(2, '0')}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSwRunning(!swRunning)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold ${
                        swRunning ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {swRunning ? 'Pause' : 'Start'}
                    </button>
                    <button
                      onClick={() => {
                        setSwLaps([swTime, ...swLaps]);
                        soundEngine.playPop();
                      }}
                      disabled={!swRunning}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white disabled:opacity-40"
                    >
                      Lap
                    </button>
                    <button
                      onClick={() => {
                        setSwRunning(false);
                        setSwTime(0);
                        setSwLaps([]);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-800 text-white"
                    >
                      Reset
                    </button>
                  </div>

                  {swLaps.length > 0 && (
                    <div className="w-full max-h-32 overflow-y-auto flex flex-col gap-1 text-[11px] font-mono-timer text-purple-300">
                      {swLaps.map((lap, idx) => (
                        <div key={idx} className="flex justify-between p-1 border-b border-purple-900/40">
                          <span>Lap {swLaps.length - idx}</span>
                          <span>{(lap / 1000).toFixed(2)}s</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* APP 8: PET */}
              {activeApp === 'pet' && (
                <div className="max-w-sm mx-auto bg-purple-950/40 border border-purple-800/40 p-5 rounded-2xl flex flex-col items-center gap-4 text-center">
                  <div className="text-5xl animate-bounce">🐱</div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-white">Mochi the Calico Kitty</span>
                    <span className="text-xs text-purple-300">{petActionMsg}</span>
                  </div>

                  {/* Happiness Bar */}
                  <div className="w-full bg-purple-950 rounded-full h-3 border border-purple-800 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-rose-500 h-full transition-all duration-500"
                      style={{ width: `${petHappiness}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-pink-300 font-mono-timer">Happiness: {petHappiness}%</span>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleFeedPet}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md"
                    >
                      Feed Salmon 🐟
                    </button>
                    <button
                      onClick={handlePetCat}
                      className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md"
                    >
                      Pet Mochi 💕
                    </button>
                  </div>
                </div>
              )}

              {/* APP 9: SAFARI BROWSER PRO */}
              {activeApp === 'browser' && (
                <div className="h-full min-h-[460px]">
                  <DesktopBrowserApp
                    tickets={tickets}
                    onAddTickets={onAddTickets}
                    activeWallpaper={activeWallpaper}
                    onSelectWallpaper={handleEquipWallpaper}
                    unlockedWallpapers={unlockedWallpapers}
                    desk={desk}
                    onUpdateDesk={onUpdateDesk}
                    userName={avatar.name}
                  />
                </div>
              )}
            </div>

            {/* Bottom-Right Corner Resize Grip (Apple-like) */}
            {!windowBounds.isMaximized && (
              <div
                onMouseDown={handleStartResize}
                className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5 text-purple-400/60 hover:text-purple-200 z-50 select-none"
                title="Drag to resize window"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M8 2L2 8M9 5L5 9M9 8L8 9" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* 3. Bottom OS Taskbar / Dock */}
        <footer className="absolute bottom-0 left-0 right-0 z-40 h-11 bg-black/60 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-3 text-white select-none">
          <div className="flex items-center gap-2">
            {/* Start Button */}
            <button
              onClick={() => setActiveApp('shop')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-cozy font-bold shadow-md transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Start</span>
            </button>

            {/* Quick Open App Tabs */}
            <div className="flex items-center gap-1">
              {[
                { id: 'editor', name: 'Txt Editor', icon: <FileText className="w-3.5 h-3.5" /> },
                { id: 'journal', name: 'Journal', icon: <BookOpen className="w-3.5 h-3.5" /> },
                { id: 'review', name: 'Review', icon: <BarChart3 className="w-3.5 h-3.5" /> },
                { id: 'shop', name: 'Store', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
              ].map((app) => (
                <button
                  key={app.id}
                  onClick={() => setActiveApp(app.id as any)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-cozy transition-all ${
                    activeApp === app.id
                      ? 'bg-white/20 text-white font-bold border border-white/20'
                      : 'text-purple-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {app.icon}
                  <span className="hidden sm:inline">{app.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Wallpaper Quick Switcher Button */}
            <button
              onClick={() => {
                setActiveApp('shop');
                setShopCategory('wallpapers');
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-900/50 hover:bg-purple-800/80 text-[11px] text-purple-200 border border-purple-700/40"
              title="Decorate Desktop Wallpaper"
            >
              <ImageIcon className="w-3 h-3 text-pink-300" />
              <span className="hidden sm:inline">Wallpaper</span>
            </button>

            {/* Time */}
            <div className="text-xs font-mono-timer text-purple-200 px-2 py-0.5 bg-black/40 rounded-lg">
              {currentTimeStr}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
