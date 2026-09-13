import React, { useState } from 'react';
import { DeskConfig } from '../types';
import { soundEngine } from '../utils/audioSynth';

interface DeskRendererProps {
  desk: DeskConfig;
  onPetClick?: () => void;
}

export const DeskRenderer: React.FC<DeskRendererProps> = ({ desk, onPetClick }) => {
  const [isPetting, setIsPetting] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  const handlePetInteraction = () => {
    soundEngine.playCoin();
    setIsPetting(true);
    const newHeart = {
      id: Date.now(),
      x: Math.random() * 20 - 10,
      y: Math.random() * 10,
    };
    setHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1200);
    setTimeout(() => setIsPetting(false), 400);

    if (onPetClick) {
      onPetClick();
    }
  };

  const getDeskStyleColors = () => {
    switch (desk.deskStyle) {
      case 'sakura':
        return { top: '#fbcfe8', front: '#f472b6', border: '#db2777' };
      case 'cyber':
        return { top: '#0f172a', front: '#0284c7', border: '#38bdf8' };
      case 'walnut':
        return { top: '#543d2b', front: '#3d2817', border: '#291b0f' };
      case 'crystal':
        return { top: '#c084fc', front: '#9333ea', border: '#7e22ce' };
      case 'vintage':
        return { top: '#a16207', front: '#713f12', border: '#451a03' };
      case 'wood':
      default:
        return { top: '#d97706', front: '#b45309', border: '#78350f' };
    }
  };

  const deskColors = getDeskStyleColors();

  return (
    <div className="relative w-full max-w-[210px] h-[90px] flex items-end justify-center select-none">
      {/* Desk SVG Structure */}
      <svg viewBox="0 0 200 90" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="deskTopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={deskColors.top} />
            <stop offset="100%" stopColor={deskColors.front} />
          </linearGradient>
          <filter id="deskGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 1. Desk Legs */}
        <rect x="22" y="38" width="8" height="48" rx="2" fill={deskColors.front} />
        <rect x="170" y="38" width="8" height="48" rx="2" fill={deskColors.front} />
        <line x1="26" y1="62" x2="174" y2="62" stroke={deskColors.front} strokeWidth="3" opacity="0.6" />

        {/* 2. Desk Top Table Surface */}
        <polygon
          points="8,34 192,34 180,44 20,44"
          fill="url(#deskTopGrad)"
          stroke={deskColors.border}
          strokeWidth="1.5"
          filter="url(#deskGlow)"
        />
        {/* Desk Front Bevel */}
        <polygon
          points="20,44 180,44 178,50 22,50"
          fill={deskColors.front}
          stroke={deskColors.border}
          strokeWidth="1"
        />

        {/* 3. Desk Accessories (Left Side) */}
        {desk.deskAccessory === 'mug' && (
          <g transform="translate(26, 12)">
            {/* Steaming Mug */}
            <rect x="2" y="10" width="14" height="13" rx="2" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
            <path d="M 16 13 Q 21 16 16 20" fill="none" stroke="#0284c7" strokeWidth="2" />
            {/* Steam animation */}
            <path d="M 6 7 Q 8 2 5 -3" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" className="animate-steam" />
            <path d="M 12 7 Q 10 3 13 -3" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" className="animate-steam" />
          </g>
        )}

        {desk.deskAccessory === 'succulent' && (
          <g transform="translate(24, 8)">
            {/* Pot */}
            <polygon points="4,18 16,18 14,26 6,26" fill="#fb923c" stroke="#c2410c" strokeWidth="1" />
            {/* Leaves */}
            <ellipse cx="10" cy="14" rx="4" ry="7" fill="#4ade80" />
            <ellipse cx="6" cy="16" rx="5" ry="4" fill="#22c55e" transform="rotate(-30 6 16)" />
            <ellipse cx="14" cy="16" rx="5" ry="4" fill="#22c55e" transform="rotate(30 14 16)" />
          </g>
        )}

        {desk.deskAccessory === 'mushroom_lamp' && (
          <g transform="translate(24, 0)">
            <rect x="8" y="16" width="4" height="18" fill="#e2e8f0" />
            <ellipse cx="10" cy="14" rx="14" ry="10" fill="#ef4444" className="animate-glow" />
            <circle cx="6" cy="12" r="2.5" fill="#ffffff" />
            <circle cx="13" cy="10" r="2.5" fill="#ffffff" />
          </g>
        )}

        {desk.deskAccessory === 'lava_lamp' && (
          <g transform="translate(24, -4)">
            <polygon points="6,34 14,34 12,12 8,12" fill="#334155" />
            <path d="M 8 16 C 6 22, 14 24, 12 30" fill="none" stroke="#ec4899" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
          </g>
        )}

        {desk.deskAccessory === 'crystal' && (
          <g transform="translate(25, 4)">
            <polygon points="10,4 16,14 14,28 6,28 4,14" fill="#a855f7" stroke="#9333ea" strokeWidth="1" className="animate-pulse" />
            <polygon points="10,4 16,14 10,28" fill="#c084fc" opacity="0.6" />
          </g>
        )}

        {desk.deskAccessory === 'gameboy' && (
          <g transform="translate(24, 14)">
            <rect x="0" y="0" width="18" height="20" rx="2" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
            <rect x="3" y="2" width="12" height="9" fill="#84cc16" />
            <circle cx="14" cy="15" r="1.5" fill="#ef4444" />
            <circle cx="11" cy="17" r="1.5" fill="#ef4444" />
          </g>
        )}

        {desk.deskAccessory === 'bonsai' && (
          <g transform="translate(22, 2)">
            <polygon points="4,22 18,22 16,28 6,28" fill="#78350f" />
            <path d="M 11 22 Q 9 14 14 10 Q 12 6 10 4" fill="none" stroke="#451a03" strokeWidth="2.5" />
            <circle cx="9" cy="4" r="5" fill="#15803d" />
            <circle cx="15" cy="9" r="4.5" fill="#16a34a" />
          </g>
        )}
      </svg>

      {/* 4. Interactive Companion Pet (Right of Desk) */}
      {desk.petType !== 'none' && (
        <div
          onClick={handlePetInteraction}
          title={`Pet ${desk.petName || 'your companion'} (Click for ❤️ + 🎟️)`}
          className="absolute right-0 bottom-2 cursor-pointer transition-transform duration-200 hover:scale-115 active:scale-95 group z-10"
        >
          {/* Heart float effect */}
          {hearts.map((h) => (
            <span
              key={h.id}
              className="absolute -top-6 left-2 text-rose-400 font-bold text-sm pointer-events-none animate-bounce"
              style={{ transform: `translate(${h.x}px, -${h.y}px)` }}
            >
              ❤️ +1
            </span>
          ))}

          <svg
            viewBox="0 0 60 50"
            className={`w-12 h-10 overflow-visible ${isPetting ? 'animate-bounce' : 'animate-pet'}`}
          >
            {/* Pet: Shiba Inu */}
            {desk.petType === 'shiba' && (
              <g id="shiba-pet">
                {/* Body */}
                <ellipse cx="30" cy="32" rx="16" ry="12" fill={desk.petColor || '#eab308'} />
                {/* Shiba Curled Tail */}
                <path d="M 44 26 Q 50 20 46 16 Q 40 18 42 24" fill={desk.petColor || '#eab308'} />
                {/* Head */}
                <circle cx="20" cy="24" r="10" fill={desk.petColor || '#eab308'} />
                {/* White snout */}
                <ellipse cx="17" cy="27" rx="5" ry="4" fill="#ffffff" />
                <circle cx="15" cy="25" r="1.5" fill="#18181b" />
                {/* Cute sleeping eye */}
                <path d="M 18 21 Q 20 23 22 21" fill="none" stroke="#18181b" strokeWidth="1.5" strokeLinecap="round" />
                {/* Ears */}
                <polygon points="14,16 18,8 21,15" fill={desk.petColor || '#eab308'} />
                <polygon points="15,15 18,10 20,15" fill="#fda4af" />
                <polygon points="21,16 25,8 28,15" fill={desk.petColor || '#eab308'} />
                <polygon points="22,15 25,10 27,15" fill="#fda4af" />
              </g>
            )}

            {/* Pet: Calico Cat */}
            {desk.petType === 'cat' && (
              <g id="cat-pet">
                <ellipse cx="30" cy="32" rx="15" ry="11" fill="#f8fafc" />
                {/* Calico patches */}
                <circle cx="36" cy="28" r="6" fill="#f97316" />
                <circle cx="26" cy="34" r="5" fill="#334155" />
                {/* Tail */}
                <path d="M 44 32 Q 52 30 50 20" fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
                {/* Head */}
                <circle cx="18" cy="24" r="9" fill="#f8fafc" />
                <circle cx="15" cy="20" r="4" fill="#334155" />
                {/* Cat ears */}
                <polygon points="12,17 15,9 18,16" fill="#f8fafc" />
                <polygon points="19,17 22,9 25,16" fill="#f97316" />
                {/* Sleeping Face */}
                <path d="M 14 24 Q 16 26 18 24" fill="none" stroke="#18181b" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="13" cy="25" r="1" fill="#f43f5e" />
              </g>
            )}

            {/* Pet: Floating Ghost */}
            {desk.petType === 'ghost' && (
              <g id="ghost-pet" className="animate-float-gentle">
                <path d="M 20 12 C 20 4, 40 4, 40 12 L 40 32 L 35 28 L 30 32 L 25 28 L 20 32 Z" fill="#e0e7ff" opacity="0.9" />
                <circle cx="26" cy="18" r="2.5" fill="#3730a3" />
                <circle cx="34" cy="18" r="2.5" fill="#3730a3" />
                <circle cx="24" cy="22" r="3" fill="#f472b6" opacity="0.6" />
                <circle cx="36" cy="22" r="3" fill="#f472b6" opacity="0.6" />
              </g>
            )}

            {/* Pet: Baby Capybara */}
            {desk.petType === 'capybara' && (
              <g id="capybara-pet">
                <rect x="16" y="20" width="28" height="18" rx="6" fill="#a16207" />
                <rect x="10" y="16" width="16" height="14" rx="4" fill="#a16207" />
                <circle cx="14" cy="20" r="1.5" fill="#18181b" />
                <circle cx="11" cy="24" r="1" fill="#451a03" />
                {/* Mini Orange on head! */}
                <circle cx="18" cy="12" r="3.5" fill="#ea580c" />
                <circle cx="18" cy="8" r="1" fill="#16a34a" />
              </g>
            )}

            {/* Pet: Yellow Duck */}
            {desk.petType === 'duck' && (
              <g id="duck-pet">
                <ellipse cx="30" cy="30" rx="14" ry="10" fill="#facc15" />
                <circle cx="20" cy="20" r="8" fill="#facc15" />
                <polygon points="14,20 8,22 14,24" fill="#ea580c" />
                <circle cx="18" cy="18" r="1.5" fill="#18181b" />
                {/* Tiny little hat */}
                <polygon points="18,12 21,5 24,12" fill="#3b82f6" />
              </g>
            )}

            {/* Pet: Star Dragon */}
            {desk.petType === 'dragon' && (
              <g id="dragon-pet">
                <ellipse cx="30" cy="30" rx="14" ry="11" fill="#10b981" />
                <circle cx="18" cy="22" r="8" fill="#10b981" />
                <polygon points="16,14 18,7 21,13" fill="#fbbf24" />
                <circle cx="16" cy="20" r="2" fill="#047857" />
                {/* Tiny wings */}
                <path d="M 32 24 Q 40 14 36 26" fill="#34d399" stroke="#059669" strokeWidth="1.5" />
                {/* Little spark */}
                <circle cx="10" cy="22" r="1.5" fill="#f59e0b" className="animate-ping" />
              </g>
            )}
          </svg>
          {desk.petName && (
            <div className="text-[10px] text-center font-cozy font-medium text-purple-200/90 bg-purple-950/80 px-1.5 py-0.5 rounded-full backdrop-blur-xs -mt-1 shadow-xs border border-purple-800/40">
              {desk.petName}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
