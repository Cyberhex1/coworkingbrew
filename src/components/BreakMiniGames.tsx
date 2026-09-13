import React, { useState, useEffect, useRef } from 'react';
import { CaughtFish } from '../types';
import { soundEngine } from '../utils/audioSynth';
import {
  Gamepad2,
  Trophy,
  Volume2,
  Sparkles,
  X,
  RotateCcw,
  Plus,
  Trash2,
  Play,
  Sliders,
  Mic,
  Music,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BreakMiniGamesProps {
  isOpen: boolean;
  onClose: () => void;
  onEarnTickets: (amount: number) => void;
  caughtFish: CaughtFish[];
  onCatchFish: (fish: CaughtFish) => void;
}

export interface CustomSample {
  id: string;
  label: string;
  freq: number;
  type: OscillatorType | 'bell' | 'noise';
  duration: number;
  filterFreq: number;
  wobble: boolean;
  color: string;
  audioDataUrl?: string;
}

export const BreakMiniGames: React.FC<BreakMiniGamesProps> = ({
  isOpen,
  onClose,
  onEarnTickets,
  caughtFish,
  onCatchFish,
}) => {
  const [activeGame, setActiveGame] = useState<'basketball' | 'fishing' | 'lofi_jam' | 'bubblegum'>('basketball');

  // --- Cooldown System (5 minutes per game) ---
  const [cooldownRemaining, setCooldownRemaining] = useState<{ [gameKey: string]: number }>({});

  useEffect(() => {
    const updateCooldowns = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('cozy_games_cooldowns') || '{}');
        const now = Date.now();
        const updated: { [k: string]: number } = {};
        for (const [k, v] of Object.entries(saved)) {
          const rem = Math.max(0, Math.ceil(((v as number) - now) / 1000));
          if (rem > 0) {
            updated[k] = rem;
          }
        }
        setCooldownRemaining(updated);
      } catch (err) {
        console.warn('Error reading cooldowns', err);
      }
    };

    updateCooldowns();
    const interval = setInterval(updateCooldowns, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerCooldown = (gameId: string) => {
    const durationMs = 5 * 60 * 1000; // 5 minutes
    const expireTime = Date.now() + durationMs;
    try {
      const saved = JSON.parse(localStorage.getItem('cozy_games_cooldowns') || '{}');
      saved[gameId] = expireTime;
      localStorage.setItem('cozy_games_cooldowns', JSON.stringify(saved));
    } catch (err) {
      console.warn('Error saving cooldown', err);
    }
    setCooldownRemaining((prev) => ({ ...prev, [gameId]: 300 }));
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- 1. Basketball State ---
  const courtRef = useRef<HTMLDivElement>(null);
  const hoopRef = useRef<HTMLDivElement>(null);
  const [hoopScore, setHoopScore] = useState(0);
  const [power, setPower] = useState(55);
  const [angle, setAngle] = useState(48);
  const [isShooting, setIsShooting] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 35, y: 175 });
  const [basketResult, setBasketResult] = useState<string | null>(null);
  const [wind, setWind] = useState(0);

  useEffect(() => {
    setWind(Math.floor(Math.random() * 7) - 3);
  }, [hoopScore]);

  // --- 2. Fishing State ---
  const [fishingState, setFishingState] = useState<'idle' | 'waiting' | 'bite' | 'reeling' | 'caught'>('idle');
  const [currentFish, setCurrentFish] = useState<CaughtFish | null>(null);
  const biteTimerRef = useRef<number | null>(null);

  // --- 3. Lo-Fi Jam State & Custom Samples ---
  const defaultSoundPads = [
    { id: 'def-1', label: 'Cmaj9 Chord', freq: 261.63, type: 'triangle' as const, duration: 0.7, filterFreq: 1800, wobble: true, color: 'from-purple-600 to-indigo-600' },
    { id: 'def-2', label: 'Am7 Rhodes', freq: 220.0, type: 'triangle' as const, duration: 0.7, filterFreq: 1600, wobble: true, color: 'from-indigo-600 to-blue-600' },
    { id: 'def-3', label: 'Dm9 Lush', freq: 293.66, type: 'triangle' as const, duration: 0.8, filterFreq: 2000, wobble: false, color: 'from-blue-600 to-teal-600' },
    { id: 'def-4', label: 'G13 Mellow', freq: 196.0, type: 'triangle' as const, duration: 0.7, filterFreq: 1400, wobble: true, color: 'from-teal-600 to-emerald-600' },
    { id: 'def-5', label: 'Kalimba Bell', freq: 783.99, type: 'bell' as const, duration: 0.9, filterFreq: 3000, wobble: false, color: 'from-amber-600 to-orange-600' },
    { id: 'def-6', label: 'Star Chime', freq: 1046.5, type: 'sine' as const, duration: 0.8, filterFreq: 2400, wobble: false, color: 'from-pink-600 to-rose-600' },
    { id: 'def-7', label: 'Vinyl Snare', freq: 300, type: 'noise' as const, duration: 0.25, filterFreq: 1200, wobble: false, color: 'from-violet-600 to-purple-600' },
    { id: 'def-8', label: 'Deep Sine 808', freq: 130.81, type: 'sine' as const, duration: 0.9, filterFreq: 800, wobble: false, color: 'from-fuchsia-600 to-purple-800' },
  ];

  const [customSamples, setCustomSamples] = useState<CustomSample[]>(() => {
    try {
      const saved = localStorage.getItem('lofi_custom_samples');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activePad, setActivePad] = useState<string | null>(null);
  const [isSampleStudioOpen, setIsSampleStudioOpen] = useState(false);

  // New Sample Creator Form State
  const [sampleName, setSampleName] = useState('');
  const [sampleType, setSampleType] = useState<OscillatorType | 'bell' | 'noise'>('triangle');
  const [sampleFreq, setSampleFreq] = useState(329.63);
  const [sampleDuration, setSampleDuration] = useState(0.6);
  const [sampleFilter, setSampleFilter] = useState(1800);
  const [sampleWobble, setSampleWobble] = useState(true);
  const [sampleColor, setSampleColor] = useState('from-cyan-600 to-blue-600');
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // --- 4. Bubblegum Float State ---
  const [bubbleBalloons, setBubbleBalloons] = useState<{ id: number; x: number; y: number; val: number }[]>([]);
  const [bubbleScore, setBubbleScore] = useState(0);

  if (!isOpen) return null;

  // --- Accurate Basketball Physics with Rim Collision ---
  const shootBall = () => {
    if (isShooting) return;
    if (cooldownRemaining['basketball'] && cooldownRemaining['basketball'] > 0) return;

    setIsShooting(true);
    setBasketResult(null);

    const court = courtRef.current;
    const hoop = hoopRef.current;
    if (!court || !hoop) {
      setIsShooting(false);
      return;
    }

    const courtRect = court.getBoundingClientRect();
    const hoopRect = hoop.getBoundingClientRect();

    // Coordinates of the orange rim relative to the court canvas
    const hoopCenterX = hoopRect.left - courtRect.left + hoopRect.width / 2;
    const hoopCenterY = hoopRect.top - courtRect.top + 16;
    const startX = 35;
    const startY = courtRect.height - 35;

    setBallPos({ x: startX, y: startY });

    // Physics parameters scaled to court width and power/angle
    const rad = (angle * Math.PI) / 180;
    const velocityMagnitude = (power / 100) * 23;
    let vx = velocityMagnitude * Math.cos(rad) + wind * 0.16;
    let vy = velocityMagnitude * Math.sin(rad);
    const gravity = 0.58;

    let posX = startX;
    let posY = startY;
    let hasScored = false;
    let tickCount = 0;

    const interval = setInterval(() => {
      tickCount++;
      const prevX = posX;
      const prevY = posY;

      posX += vx;
      posY -= vy;
      vy -= gravity;

      setBallPos({ x: posX, y: posY });

      // Basket Detection: Check if the ball passes into or across the hoop opening!
      const isNearRimX = Math.abs(posX - hoopCenterX) <= 26;
      const crossesRimY = prevY <= hoopCenterY + 4 && posY >= hoopCenterY - 14;
      const isInsideRimZone = Math.hypot(posX - hoopCenterX, posY - hoopCenterY) <= 24;

      // Ball must be moving downward into the basket
      if (!hasScored && isNearRimX && (crossesRimY || isInsideRimZone) && vy < 3) {
        hasScored = true;
        soundEngine.playSwish();
        soundEngine.playCoin();
        setHoopScore((s) => s + 1);
        setBasketResult('SWISH! 🏀 +2 🎟️');
        onEarnTickets(2);
        confetti({
          particleCount: 30,
          spread: 50,
          origin: {
            x: (hoopRect.left + hoopRect.width / 2) / window.innerWidth,
            y: (hoopRect.top + hoopRect.height / 2) / window.innerHeight,
          },
        });

        setTimeout(() => {
          setBallPos({ x: hoopCenterX, y: hoopCenterY + 28 });
        }, 120);

        // 5-minute pause after each basket scored
        triggerCooldown('basketball');
      }

      // Ball hits the floor or flies off-screen
      if (posY >= courtRect.height - 20 || posX > courtRect.width + 40 || tickCount > 45) {
        clearInterval(interval);
        setIsShooting(false);

        if (!hasScored) {
          if (Math.hypot(posX - hoopCenterX, posY - hoopCenterY) < 45) {
            setBasketResult('Clank off the rim! So close 🍃');
          } else {
            setBasketResult('Miss! Try adjusting angle or power 🍃');
          }
        }

        setTimeout(() => {
          setBallPos({ x: startX, y: startY });
        }, 1200);
      }
    }, 25);
  };

  // --- Fishing Logic ---
  const castRod = () => {
    if (cooldownRemaining['fishing'] && cooldownRemaining['fishing'] > 0) return;
    setFishingState('waiting');
    soundEngine.playSplash();
    const waitTime = 2000 + Math.random() * 2500;
    biteTimerRef.current = window.setTimeout(() => {
      setFishingState('bite');
      soundEngine.playChime('chime');
    }, waitTime);
  };

  const reelIn = () => {
    if (fishingState !== 'bite') return;
    setFishingState('reeling');
    soundEngine.playSplash();

    setTimeout(() => {
      const fishSpecies: { name: string; icon: string; rarity: CaughtFish['rarity']; ticketValue: number }[] = [
        { name: 'Golden Koi', icon: '🐟', rarity: 'Epic', ticketValue: 15 },
        { name: 'Matcha Guppy', icon: '🐠', rarity: 'Common', ticketValue: 4 },
        { name: 'Boba Pearl Fish', icon: '🐡', rarity: 'Rare', ticketValue: 8 },
        { name: 'Starry Lotus Eel', icon: '🐉', rarity: 'Legendary', ticketValue: 25 },
        { name: 'Rubber Duckie', icon: '🦆', rarity: 'Common', ticketValue: 3 },
        { name: 'Cozy Sea Turtle', icon: '🐢', rarity: 'Epic', ticketValue: 18 },
      ];

      const caught = fishSpecies[Math.floor(Math.random() * fishSpecies.length)];
      const newCaughtFish: CaughtFish = {
        id: `fish-${Date.now()}`,
        name: caught.name,
        icon: caught.icon,
        rarity: caught.rarity,
        ticketValue: caught.ticketValue,
        weight: `${(Math.random() * 3 + 0.5).toFixed(1)} kg`,
        caughtAt: Date.now(),
      };

      setCurrentFish(newCaughtFish);
      onCatchFish(newCaughtFish);
      onEarnTickets(caught.ticketValue);
      setFishingState('caught');
      soundEngine.playCoin();
      confetti({ particleCount: 40, spread: 60 });

      // Trigger 5-minute pause after catching a fish
      triggerCooldown('fishing');
    }, 500);
  };

  // --- Lo-Fi Jam Play ---
  const handlePlayPad = (pad: CustomSample | (typeof defaultSoundPads)[0]) => {
    setActivePad(pad.id);
    soundEngine.playCustomSample({
      freq: pad.freq,
      type: pad.type,
      duration: pad.duration,
      filterFreq: pad.filterFreq,
      wobble: pad.wobble,
      audioDataUrl: 'audioDataUrl' in pad ? pad.audioDataUrl : undefined,
    });
    setTimeout(() => setActivePad(null), 300);
  };

  // Test Play current preview in Studio
  const handleTestPreview = () => {
    soundEngine.playCustomSample({
      freq: sampleFreq,
      type: sampleType,
      duration: sampleDuration,
      filterFreq: sampleFilter,
      wobble: sampleWobble,
      audioDataUrl: recordedAudioUrl || undefined,
    });
  };

  // Save new custom sample
  const handleSaveCustomSample = () => {
    const newSample: CustomSample = {
      id: `sample-${Date.now()}`,
      label: sampleName.trim() || `Custom Tone ${customSamples.length + 1}`,
      freq: sampleFreq,
      type: sampleType,
      duration: sampleDuration,
      filterFreq: sampleFilter,
      wobble: sampleWobble,
      color: sampleColor,
      audioDataUrl: recordedAudioUrl || undefined,
    };

    const updated = [...customSamples, newSample];
    setCustomSamples(updated);
    try {
      localStorage.setItem('lofi_custom_samples', JSON.stringify(updated));
    } catch (err) {
      console.warn('Error saving custom sample', err);
    }
    setIsSampleStudioOpen(false);
    setSampleName('');
    setRecordedAudioUrl(null);
    soundEngine.playCoin();
    confetti({ particleCount: 20, spread: 45 });
  };

  const handleDeleteCustomSample = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customSamples.filter((s) => s.id !== id);
    setCustomSamples(updated);
    try {
      localStorage.setItem('lofi_custom_samples', JSON.stringify(updated));
    } catch (err) {
      console.warn('Error updating samples', err);
    }
  };

  // Mic Recording handlers
  const handleStartMicRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingMic(true);

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecordingMic(false);
        }
      }, 2500);
    } catch (err) {
      console.warn('Microphone access unavailable or denied', err);
      alert('Microphone access is unavailable. You can design rich synthesizer tones with the sliders below!');
    }
  };

  const handleStopMicRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecordingMic(false);
    }
  };

  // --- Bubblegum Logic ---
  const startBubbleGame = () => {
    if (cooldownRemaining['bubblegum'] && cooldownRemaining['bubblegum'] > 0) return;
    const balloons = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 65,
      val: Math.floor(Math.random() * 3) + 1,
    }));
    setBubbleBalloons(balloons);
  };

  const popBalloon = (id: number, val: number) => {
    soundEngine.playCoin();
    onEarnTickets(val);
    setBubbleScore((s) => s + val);
    const remaining = bubbleBalloons.filter((b) => b.id !== id);
    setBubbleBalloons(remaining);

    // If popped all, trigger 5 min cooldown!
    if (remaining.length === 0) {
      triggerCooldown('bubblegum');
    }
  };

  const activeCooldownSec = cooldownRemaining[activeGame] || 0;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="w-full max-w-2xl bg-[#1a162b] border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl animate-fade-in text-purple-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-800/40 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shadow-inner">
              🎮
            </div>
            <div>
              <h2 className="font-cozy font-bold text-lg text-white">Cozy Break Mini-Games</h2>
              <p className="text-xs text-purple-300">Relax your mind, refresh your energy & balance your flow!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-purple-900/60 text-purple-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Tabs */}
        <div className="flex items-center gap-2 border-b border-purple-800/40 pb-3 mb-4 overflow-x-auto text-xs font-cozy">
          <button
            onClick={() => setActiveGame('basketball')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeGame === 'basketball'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-950/50 text-purple-300 hover:text-white'
            }`}
          >
            <span>🏀 Paper Toss Basketball</span>
            {cooldownRemaining['basketball'] > 0 && (
              <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/40">
                ⏳ {formatTimer(cooldownRemaining['basketball'])}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveGame('fishing')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeGame === 'fishing'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-950/50 text-purple-300 hover:text-white'
            }`}
          >
            <span>🎣 Lily Pad Fishing</span>
            {cooldownRemaining['fishing'] > 0 && (
              <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/40">
                ⏳ {formatTimer(cooldownRemaining['fishing'])}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveGame('lofi_jam')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeGame === 'lofi_jam'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-950/50 text-purple-300 hover:text-white'
            }`}
          >
            <span>🎹 Lo-Fi Soundpad Jam</span>
            {customSamples.length > 0 && (
              <span className="text-[10px] bg-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded-full border border-cyan-500/40">
                +{customSamples.length} Custom
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveGame('bubblegum');
              if (bubbleBalloons.length === 0 && (!cooldownRemaining['bubblegum'] || cooldownRemaining['bubblegum'] === 0)) {
                startBubbleGame();
              }
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeGame === 'bubblegum'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-950/50 text-purple-300 hover:text-white'
            }`}
          >
            <span>🫧 Bubblegum Float</span>
            {cooldownRemaining['bubblegum'] > 0 && (
              <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/40">
                ⏳ {formatTimer(cooldownRemaining['bubblegum'])}
              </span>
            )}
          </button>
        </div>

        {/* 5-Minute Pause / Balance Cooldown Banner */}
        {activeCooldownSec > 0 && activeGame !== 'lofi_jam' && (
          <div className="w-full bg-purple-950/60 border border-amber-500/40 rounded-2xl p-3.5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-lg">
                ⏳
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>5-Minute Focus Recharge Active</span>
                  <span className="font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-600/40">
                    {formatTimer(activeCooldownSec)}
                  </span>
                </h4>
                <p className="text-[11px] text-purple-300">
                  Game rewards pause for 5 minutes to balance points & support mindful focus habits.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveGame('lofi_jam')}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md whitespace-nowrap transition-all"
            >
              🎹 Jam Soundpad while waiting
            </button>
          </div>
        )}

        {/* Game 1: Basketball / Paper Toss */}
        {activeGame === 'basketball' && (
          <div className="flex flex-col items-center space-y-4">
            <div
              ref={courtRef}
              className="w-full h-56 bg-gradient-to-b from-purple-950/90 via-indigo-950/80 to-[#141026] rounded-2xl border border-purple-800/40 relative overflow-hidden flex items-end shadow-inner"
            >
              {/* Wind indicator */}
              <div className="absolute top-3 left-3 bg-purple-900/70 px-2.5 py-1 rounded-full text-[11px] font-cozy text-purple-200 border border-purple-700/50 backdrop-blur-sm shadow">
                🍃 Wind: {wind > 0 ? `+${wind} ➔` : wind < 0 ? `${wind} ⬅` : 'Calm'}
              </div>

              <div className="absolute top-3 right-3 bg-amber-950/80 px-3 py-1 rounded-full text-xs font-cozy font-bold text-amber-300 border border-amber-600/50 shadow">
                Score: {hoopScore} 🏀
              </div>

              {/* Realistic Basketball Hoop / Waste Bin */}
              <div
                ref={hoopRef}
                className="absolute right-8 sm:right-12 top-14 flex flex-col items-center select-none z-10"
              >
                {/* Backboard */}
                <div className="w-16 h-12 bg-white/20 border-2 border-white/60 rounded-md flex items-center justify-center -mb-2 shadow-md backdrop-blur-[1px]">
                  <div className="w-8 h-6 border border-orange-400/80 rounded-sm" />
                </div>
                {/* Rim */}
                <div className="w-14 h-3 bg-orange-500 rounded-full shadow-lg border border-orange-300 relative z-20" />
                {/* Net */}
                <div className="w-12 h-10 border-x-2 border-b-2 border-white/80 border-dashed rounded-b-2xl bg-white/5 backdrop-blur-[1px] relative z-10" />
              </div>

              {/* The Paper Ball */}
              <div
                className="absolute w-7 h-7 rounded-full bg-amber-100 shadow-md border-2 border-amber-300 flex items-center justify-center text-xs z-20 pointer-events-none transition-transform"
                style={{
                  left: `${ballPos.x}px`,
                  top: `${ballPos.y}px`,
                  transform: isShooting ? 'rotate(720deg)' : 'none',
                }}
              >
                📄
              </div>

              {/* Shot Result Banner */}
              {basketResult && (
                <div className="absolute inset-x-0 bottom-6 text-center font-cozy font-bold text-sm text-amber-300 animate-bounce drop-shadow-md z-30">
                  {basketResult}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
              <div className="w-full sm:flex-1 space-y-1">
                <div className="flex justify-between text-xs font-cozy text-purple-300">
                  <span>Power</span>
                  <span className="font-bold text-purple-100">{power}%</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="95"
                  value={power}
                  disabled={isShooting || activeCooldownSec > 0}
                  onChange={(e) => setPower(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer disabled:opacity-50"
                />
              </div>

              <div className="w-full sm:flex-1 space-y-1">
                <div className="flex justify-between text-xs font-cozy text-purple-300">
                  <span>Angle</span>
                  <span className="font-bold text-purple-100">{angle}°</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="75"
                  value={angle}
                  disabled={isShooting || activeCooldownSec > 0}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer disabled:opacity-50"
                />
              </div>

              <button
                onClick={shootBall}
                disabled={isShooting || activeCooldownSec > 0}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-cozy font-bold text-xs text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {activeCooldownSec > 0
                  ? `Recharging (${formatTimer(activeCooldownSec)})`
                  : isShooting
                  ? 'Shooting...'
                  : '🏀 Toss Paper Ball'}
              </button>
            </div>
          </div>
        )}

        {/* Game 2: Lily Pad Fishing */}
        {activeGame === 'fishing' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full h-48 bg-gradient-to-b from-teal-950/80 via-cyan-950/70 to-blue-950/80 rounded-2xl border border-teal-600/40 relative overflow-hidden flex flex-col items-center justify-center p-4">
              {/* Animated Lily Pads */}
              <div className="absolute left-8 top-10 text-3xl animate-float-gentle opacity-80 select-none">🪷</div>
              <div className="absolute right-12 bottom-8 text-4xl animate-float-gentle opacity-75 select-none">🌿</div>
              <div className="absolute left-1/3 bottom-5 text-2xl animate-float-gentle opacity-60 select-none">🐸</div>

              <div className="z-10 text-center space-y-2">
                {fishingState === 'idle' && (
                  <p className="text-xs font-cozy text-cyan-200">
                    Cast your bamboo rod into the lotus pond to discover rare and cozy fish!
                  </p>
                )}
                {fishingState === 'waiting' && (
                  <div className="flex items-center gap-2 text-xs font-cozy text-cyan-300 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Watching the water rippling quietly...</span>
                  </div>
                )}
                {fishingState === 'bite' && (
                  <div className="text-sm font-cozy font-bold text-amber-300 animate-bounce">
                    ✨ SOMETHING IS BITING! REEL IN QUICK! ✨
                  </div>
                )}
                {fishingState === 'reeling' && (
                  <div className="text-xs font-cozy text-cyan-300">Reeling in the line... 🌊</div>
                )}
                {fishingState === 'caught' && currentFish && (
                  <div className="flex flex-col items-center gap-1 bg-purple-950/80 p-2.5 rounded-2xl border border-purple-500/50 shadow-xl animate-fade-in">
                    <span className="text-3xl">{currentFish.icon}</span>
                    <span className="text-xs font-bold text-white">{currentFish.name}</span>
                    <span className="text-[10px] text-purple-300 font-cozy">
                      {currentFish.rarity} • {currentFish.weight}
                    </span>
                    <span className="text-[10px] text-amber-300 font-bold">+{currentFish.ticketValue} 🎟️ Tickets!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fishing Action Button */}
            <div>
              {activeCooldownSec > 0 ? (
                <button
                  disabled
                  className="px-6 py-2.5 bg-purple-950/60 rounded-xl font-cozy text-xs text-purple-400 border border-purple-800"
                >
                  ⏳ Resting rod ({formatTimer(activeCooldownSec)})
                </button>
              ) : fishingState === 'idle' || fishingState === 'caught' ? (
                <button
                  onClick={castRod}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-cozy font-bold text-xs text-white shadow-lg transition-all active:scale-95"
                >
                  🎣 Cast Rod
                </button>
              ) : fishingState === 'bite' ? (
                <button
                  onClick={reelIn}
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 rounded-xl font-cozy font-bold text-sm text-white shadow-xl animate-pulse active:scale-95"
                >
                  🎯 REEL IN!
                </button>
              ) : (
                <button
                  disabled
                  className="px-6 py-2.5 bg-purple-950/60 rounded-xl font-cozy text-xs text-purple-400 border border-purple-800"
                >
                  Waiting for bite...
                </button>
              )}
            </div>

            {/* Caught fish collection display */}
            {caughtFish.length > 0 && (
              <div className="w-full flex items-center gap-2 overflow-x-auto p-2 bg-purple-950/50 rounded-xl border border-purple-800/30 text-[11px] font-cozy">
                <span className="text-purple-300 font-bold whitespace-nowrap">Aquarium:</span>
                {caughtFish.map((f, i) => (
                  <span key={i} title={`${f.name} (${f.rarity})`} className="p-1 bg-purple-900/60 rounded-lg whitespace-nowrap">
                    {f.icon} {f.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Game 3: Lo-Fi Soundpad Jam with Custom Sample Creator */}
        {activeGame === 'lofi_jam' && (
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2 font-cozy">
                  <Music className="w-4 h-4 text-purple-400" />
                  <span>Lo-Fi Soundpad & Sample Rack</span>
                </h3>
                <p className="text-[11px] text-purple-300 font-cozy">
                  Tap pads to jam chords, or design your own custom sound samples!
                </p>
              </div>

              <button
                onClick={() => setIsSampleStudioOpen(!isSampleStudioOpen)}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-cozy font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Sound Sample</span>
              </button>
            </div>

            {/* Custom Sample Designer Studio Drawer / Modal */}
            {isSampleStudioOpen && (
              <div className="bg-[#141024] border border-cyan-500/40 rounded-2xl p-4 space-y-3.5 animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="flex items-center justify-between border-b border-purple-800/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white font-cozy">Lo-Fi Sample Studio</span>
                  </div>
                  <button
                    onClick={() => setIsSampleStudioOpen(false)}
                    className="text-purple-400 hover:text-white text-xs"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Left Column: Waveform and Pitch */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-cozy text-purple-300 block mb-1">Sample Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Cozy Rhodes, Velvet Chime, Lo-Fi 808"
                        value={sampleName}
                        onChange={(e) => setSampleName(e.target.value)}
                        className="w-full bg-purple-950/80 border border-purple-700/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-purple-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-cozy text-purple-300 block mb-1">Tone Engine / Waveform</label>
                      <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                        {[
                          { id: 'triangle', label: '🎹 Triangle', sub: 'Warm Rhodes' },
                          { id: 'sine', label: '🎵 Sine', sub: 'Pure Bell' },
                          { id: 'sawtooth', label: '🎷 Saw', sub: 'Synth Lead' },
                          { id: 'square', label: '👾 Square', sub: 'Retro 8-Bit' },
                          { id: 'bell', label: '🔔 Bell', sub: 'Chime' },
                          { id: 'noise', label: '🌧️ Noise', sub: 'Vinyl / Snare' },
                        ].map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => setSampleType(w.id as any)}
                            className={`p-1.5 rounded-xl border text-left flex flex-col transition-all ${
                              sampleType === w.id
                                ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-sm'
                                : 'bg-purple-950/40 border-purple-800/50 text-purple-300 hover:bg-purple-900/40'
                            }`}
                          >
                            <span className="font-bold text-[10px]">{w.label}</span>
                            <span className="text-[8px] text-purple-400">{w.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-cozy text-purple-300 mb-1">
                        <span>Musical Pitch / Frequency</span>
                        <span className="font-mono text-cyan-300">{Math.round(sampleFreq)} Hz</span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {[
                          { label: 'C3', f: 130.81 },
                          { label: 'E3', f: 164.81 },
                          { label: 'A3', f: 220.0 },
                          { label: 'C4', f: 261.63 },
                          { label: 'E4', f: 329.63 },
                          { label: 'G4', f: 392.0 },
                          { label: 'A4', f: 440.0 },
                          { label: 'C5', f: 523.25 },
                          { label: 'E5', f: 659.25 },
                        ].map((note) => (
                          <button
                            key={note.label}
                            type="button"
                            onClick={() => setSampleFreq(note.f)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                              Math.abs(sampleFreq - note.f) < 2
                                ? 'bg-cyan-500 text-white border-cyan-300 font-bold'
                                : 'bg-purple-950/50 border-purple-800 text-purple-300 hover:text-white'
                            }`}
                          >
                            {note.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="range"
                        min="65"
                        max="1200"
                        value={sampleFreq}
                        onChange={(e) => setSampleFreq(Number(e.target.value))}
                        className="w-full accent-cyan-400 mt-1"
                      />
                    </div>
                  </div>

                  {/* Right Column: Acoustics, Color, and Recording */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[11px] font-cozy text-purple-300 mb-1">
                        <span>Duration / Decay</span>
                        <span className="font-mono text-cyan-300">{sampleDuration.toFixed(2)}s</span>
                      </div>
                      <input
                        type="range"
                        min="0.15"
                        max="1.8"
                        step="0.05"
                        value={sampleDuration}
                        onChange={(e) => setSampleDuration(Number(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-cozy text-purple-300 mb-1">
                        <span>Lo-Fi Warmth (Lowpass Filter)</span>
                        <span className="font-mono text-cyan-300">{sampleFilter} Hz</span>
                      </div>
                      <input
                        type="range"
                        min="400"
                        max="3500"
                        step="100"
                        value={sampleFilter}
                        onChange={(e) => setSampleFilter(Number(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-purple-950/50 p-2 rounded-xl border border-purple-800/40">
                      <div className="text-[11px]">
                        <span className="font-bold text-white block">Analog Tape Warble</span>
                        <span className="text-[9px] text-purple-400">Adds pitch vibrato for vintage feel</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSampleWobble(!sampleWobble)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          sampleWobble ? 'bg-cyan-500' : 'bg-purple-900'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                            sampleWobble ? 'left-5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] font-cozy text-purple-300 block mb-1">Pad Color Theme</label>
                      <div className="flex items-center gap-1.5">
                        {[
                          'from-cyan-600 to-blue-600',
                          'from-purple-600 to-indigo-600',
                          'from-amber-600 to-orange-600',
                          'from-rose-600 to-pink-600',
                          'from-teal-600 to-emerald-600',
                          'from-slate-700 to-purple-900',
                        ].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSampleColor(c)}
                            className={`w-6 h-6 rounded-lg bg-gradient-to-br ${c} border transition-transform ${
                              sampleColor === c ? 'border-white scale-110 shadow' : 'border-transparent opacity-70'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Acoustic Mic Option */}
                    <div className="pt-1">
                      <div className="flex items-center gap-2">
                        {!isRecordingMic ? (
                          <button
                            type="button"
                            onClick={handleStartMicRecord}
                            className="px-2.5 py-1 bg-purple-900/60 hover:bg-purple-800 border border-purple-700/60 rounded-xl text-[10px] text-purple-200 flex items-center gap-1.5 transition-all"
                          >
                            <Mic className="w-3 h-3 text-rose-400" />
                            <span>Record Live Acoustic Mic (2.5s)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleStopMicRecord}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded-xl text-[10px] flex items-center gap-1.5 animate-pulse"
                          >
                            <span>Recording... Stop</span>
                          </button>
                        )}
                        {recordedAudioUrl && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Mic Audio Attached
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Studio Bottom Actions */}
                <div className="flex items-center justify-end gap-2 border-t border-purple-800/40 pt-3">
                  <button
                    type="button"
                    onClick={handleTestPreview}
                    className="px-3.5 py-1.5 bg-purple-900/70 hover:bg-purple-800 text-purple-200 rounded-xl text-xs font-cozy font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Test Sound</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomSample}
                    className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-cozy font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Save to Soundpad</span>
                  </button>
                </div>
              </div>
            )}

            {/* Soundpad Grid: Default Presets + User Custom Samples */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
              {/* Preset Pads */}
              {defaultSoundPads.map((pad, idx) => (
                <button
                  key={pad.id}
                  onClick={() => handlePlayPad(pad)}
                  className={`h-20 rounded-2xl bg-gradient-to-br ${pad.color} p-2.5 text-left flex flex-col justify-between shadow-lg transition-all transform active:scale-90 font-cozy ${
                    activePad === pad.id ? 'ring-4 ring-white scale-95' : 'hover:scale-105'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider text-white/80 font-bold">PAD {idx + 1}</span>
                    <span className="text-[9px] text-white/60 font-mono">{Math.round(pad.freq)}Hz</span>
                  </div>
                  <span className="text-xs font-bold text-white line-clamp-1">{pad.label}</span>
                </button>
              ))}

              {/* User Custom Samples */}
              {customSamples.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handlePlayPad(sample)}
                  className={`relative h-20 rounded-2xl bg-gradient-to-br ${sample.color} p-2.5 text-left flex flex-col justify-between shadow-lg transition-all transform active:scale-90 font-cozy cursor-pointer group ${
                    activePad === sample.id ? 'ring-4 ring-white scale-95' : 'hover:scale-105'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider bg-black/30 px-1.5 py-0.2 rounded text-cyan-200 font-bold">
                      CUSTOM
                    </span>
                    <button
                      onClick={(e) => handleDeleteCustomSample(sample.id, e)}
                      className="p-1 text-white/50 hover:text-white rounded-md hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete sample"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white line-clamp-1">{sample.label}</span>
                    <span className="text-[9px] text-white/70 font-mono">
                      {sample.audioDataUrl ? '🎙️ Mic' : `${Math.round(sample.freq)}Hz`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full bg-purple-950/40 rounded-xl p-3 text-center border border-purple-800/30 flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-[11px] text-purple-300 font-cozy">
                Pro tip: Combine Pad 1 (Cmaj9) and Pad 3 (Dm9) with your own custom ambient bells for quintessential chill coffee shop vibes!
              </p>
            </div>
          </div>
        )}

        {/* Game 4: Bubblegum Pop Float */}
        {activeGame === 'bubblegum' && (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-full h-48 bg-gradient-to-b from-purple-950/80 via-pink-950/60 to-purple-900/80 rounded-2xl border border-pink-700/40 relative overflow-hidden">
              <div className="absolute top-3 left-3 bg-pink-950/80 px-3 py-1 rounded-full text-xs font-cozy font-bold text-pink-300 border border-pink-500/40">
                Popped: {bubbleScore} 🎟️
              </div>
              <button
                onClick={startBubbleGame}
                disabled={activeCooldownSec > 0}
                className="absolute top-3 right-3 p-1.5 bg-purple-900/60 hover:bg-purple-800 rounded-full text-purple-300 disabled:opacity-50"
                title="Respawn balloons"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Floating Balloons to Pop */}
              {bubbleBalloons.map((b) => (
                <button
                  key={b.id}
                  onClick={() => popBalloon(b.id, b.val)}
                  disabled={activeCooldownSec > 0}
                  className="absolute w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 border border-white/60 shadow-lg text-white font-bold text-xs flex items-center justify-center animate-float-gentle transition-transform hover:scale-125 active:scale-75 cursor-pointer disabled:pointer-events-none"
                  style={{ left: `${b.x}%`, top: `${b.y}%` }}
                >
                  +{b.val}🎟️
                </button>
              ))}

              {bubbleBalloons.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-xs font-cozy text-pink-200 mb-2">
                    {activeCooldownSec > 0
                      ? `Recharging for 5 minutes (${formatTimer(activeCooldownSec)})`
                      : 'All popped! Great reflexes!'}
                  </p>
                  {activeCooldownSec === 0 && (
                    <button
                      onClick={startBubbleGame}
                      className="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 rounded-xl text-xs font-cozy font-bold text-white shadow-md"
                    >
                      Blow More Bubbles 🫧
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
