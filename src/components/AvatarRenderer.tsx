import React from 'react';
import { AvatarConfig } from '../types';

interface AvatarRendererProps {
  avatar: AvatarConfig;
  size?: number; // default: 120
  animate?: boolean;
  showActivityProp?: boolean;
  className?: string;
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  avatar,
  size = 120,
  animate = true,
  showActivityProp = true,
  className = '',
}) => {
  const {
    skinColor = '#ffd8b3',
    hairStyle = 'messy',
    hairColor = '#4a2c11',
    eyeStyle = 'sparkle',
    eyeColor = '#3b2f2f',
    mouthStyle = 'smile',
    hat = 'none',
    glasses = 'none',
    clothing = 'hoodie',
    clothingColor = '#8b5cf6',
    backpack = 'none',
    tail = 'none',
    activity = 'typing',
  } = avatar;

  const animationClass = animate ? 'animate-float-gentle' : '';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 160 160"
        className={`w-full h-full overflow-visible ${animationClass}`}
      >
        <defs>
          <radialGradient id="blushGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff7b90" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff7b90" stopOpacity="0" />
          </radialGradient>
          <filter id="cozyShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="2" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* 1. Tail Layer (Behind Body) */}
        {tail === 'fox' && (
          <path
            d="M 100 115 C 135 110, 145 70, 125 60 C 115 55, 110 75, 105 105 Z"
            fill="#e06c28"
            stroke="#b84c12"
            strokeWidth="2.5"
            className={animate ? 'origin-[100px_115px] animate-pulse' : ''}
          />
        )}
        {tail === 'cat' && (
          <path
            d="M 105 118 Q 135 125 130 90 Q 128 75 140 70"
            fill="none"
            stroke="#3a3845"
            strokeWidth="5.5"
            strokeLinecap="round"
            className={animate ? 'origin-[105px_118px] animate-bounce' : ''}
          />
        )}
        {tail === 'puppy' && (
          <path
            d="M 105 115 Q 125 100 128 85"
            fill="none"
            stroke={hairColor}
            strokeWidth="6"
            strokeLinecap="round"
          />
        )}
        {tail === 'bunny' && (
          <circle cx="108" cy="118" r="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
        )}
        {tail === 'dragon' && (
          <path
            d="M 105 118 C 130 125, 140 100, 145 90 C 140 85, 130 95, 112 110 Z"
            fill="#10b981"
            stroke="#047857"
            strokeWidth="2"
          />
        )}

        {/* 2. Backpack (Behind Torso) */}
        {backpack === 'bear' && (
          <g transform="translate(48, 85)">
            <rect x="0" y="0" width="64" height="42" rx="12" fill="#c27803" />
            <circle cx="8" cy="0" r="7" fill="#8c5302" />
            <circle cx="56" cy="0" r="7" fill="#8c5302" />
          </g>
        )}
        {backpack === 'cat' && (
          <g transform="translate(50, 85)">
            <rect x="0" y="0" width="60" height="40" rx="10" fill="#38bdf8" />
            <polygon points="10,0 20,-10 26,0" fill="#0284c7" />
            <polygon points="34,0 40,-10 50,0" fill="#0284c7" />
          </g>
        )}
        {backpack === 'wings' && (
          <g>
            <path d="M 45 95 C 15 80, 10 50, 35 60 C 45 65, 45 85, 52 95 Z" fill="#f8fafc" opacity="0.9" />
            <path d="M 115 95 C 145 80, 150 50, 125 60 C 115 65, 115 85, 108 95 Z" fill="#f8fafc" opacity="0.9" />
          </g>
        )}

        {/* 3. Chibi Body / Torso & Clothing */}
        <g id="body-group">
          {/* Base Torso */}
          <path
            d="M 52 100 Q 80 96 108 100 L 114 140 Q 80 144 46 140 Z"
            fill={clothingColor}
            filter="url(#cozyShadow)"
          />

          {/* Clothing details */}
          {clothing === 'hoodie' && (
            <g>
              {/* Hoodie pocket */}
              <rect x="62" y="118" width="36" height="16" rx="4" fill="rgba(0,0,0,0.12)" />
              {/* Hoodie drawstrings */}
              <line x1="72" y1="102" x2="72" y2="114" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              <line x1="88" y1="102" x2="88" y2="114" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              <circle cx="72" cy="115" r="1.5" fill="#ffffff" />
              <circle cx="88" cy="115" r="1.5" fill="#ffffff" />
            </g>
          )}

          {clothing === 'sweater' && (
            <g>
              {/* Cozy knit lines */}
              <line x1="60" y1="108" x2="100" y2="108" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="58" y1="118" x2="102" y2="118" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="60" y1="128" x2="100" y2="128" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="3,3" />
            </g>
          )}

          {clothing === 'overalls' && (
            <g>
              <rect x="52" y="100" width="56" height="40" rx="6" fill="#f8fafc" />
              <rect x="54" y="112" width="52" height="28" rx="4" fill="#3b82f6" />
              <line x1="62" y1="100" x2="62" y2="114" stroke="#1d4ed8" strokeWidth="4" />
              <line x1="98" y1="100" x2="98" y2="114" stroke="#1d4ed8" strokeWidth="4" />
              <circle cx="62" cy="113" r="2.5" fill="#fbbf24" />
              <circle cx="98" cy="113" r="2.5" fill="#fbbf24" />
            </g>
          )}

          {clothing === 'kimono' && (
            <g>
              <path d="M 64 100 L 80 120 L 96 100" fill="none" stroke="#fcd34d" strokeWidth="3" />
              <rect x="60" y="122" width="40" height="10" fill="#dc2626" />
            </g>
          )}

          {/* Chibi Arms */}
          <ellipse
            cx="48"
            cy="114"
            rx="7"
            ry="14"
            transform="rotate(15 48 114)"
            fill={clothingColor}
          />
          <circle cx="44" cy="126" r="5" fill={skinColor} />

          <ellipse
            cx="112"
            cy="114"
            rx="7"
            ry="14"
            transform="rotate(-15 112 114)"
            fill={clothingColor}
          />
          <circle cx="116" cy="126" r="5" fill={skinColor} />
        </g>

        {/* 3.5 Hair Back Volume (Behind Head) */}
        {hairStyle === 'afro' && (
          <g>
            <circle cx="80" cy="58" r="48" fill={hairColor} filter="url(#cozyShadow)" />
            <circle cx="50" cy="40" r="22" fill={hairColor} />
            <circle cx="110" cy="40" r="22" fill={hairColor} />
            <circle cx="80" cy="26" r="24" fill={hairColor} />
          </g>
        )}
        {hairStyle === 'bob' && (
          <path
            d="M 32 60 C 30 22, 55 14, 80 14 C 105 14, 130 22, 128 60 L 129 88 C 122 92, 116 86, 112 78 L 112 60 C 112 60, 48 60, 48 60 L 48 78 C 44 86, 38 92, 31 88 Z"
            fill={hairColor}
            filter="url(#cozyShadow)"
          />
        )}
        {hairStyle === 'messy' && (
          <path
            d="M 30 65 C 26 22, 54 12, 80 12 C 106 12, 134 22, 130 65 C 134 50, 124 35, 115 32 C 110 20, 95 14, 80 15 C 65 14, 50 20, 45 32 C 36 35, 26 50, 30 65 Z"
            fill={hairColor}
            filter="url(#cozyShadow)"
          />
        )}
        {hairStyle === 'spiky' && (
          <path
            d="M 32 65 C 30 45, 34 32, 42 22 L 54 32 L 66 12 L 80 26 L 94 10 L 106 30 L 118 18 L 126 35 C 132 45, 128 55, 128 65 Z"
            fill={hairColor}
            filter="url(#cozyShadow)"
          />
        )}
        {hairStyle === 'braids' && (
          <g>
            <path
              d="M 32 60 C 30 22, 55 14, 80 14 C 105 14, 130 22, 128 60 Z"
              fill={hairColor}
              filter="url(#cozyShadow)"
            />
            {/* Left Braided Pigtail */}
            <circle cx="34" cy="74" r="6.5" fill={hairColor} />
            <circle cx="32" cy="85" r="6" fill={hairColor} />
            <circle cx="30" cy="96" r="5.5" fill={hairColor} />
            <rect x="27" y="101" width="6" height="3" rx="1.5" fill="#f43f5e" />
            {/* Right Braided Pigtail */}
            <circle cx="126" cy="74" r="6.5" fill={hairColor} />
            <circle cx="128" cy="85" r="6" fill={hairColor} />
            <circle cx="130" cy="96" r="5.5" fill={hairColor} />
            <rect x="127" y="101" width="6" height="3" rx="1.5" fill="#f43f5e" />
          </g>
        )}
        {hairStyle === 'ponytail' && (
          <g>
            <path
              d="M 32 60 C 30 22, 55 14, 80 14 C 105 14, 130 22, 128 60 Z"
              fill={hairColor}
              filter="url(#cozyShadow)"
            />
            {/* High Bouncy Ponytail Bun */}
            <ellipse cx="126" cy="34" rx="16" ry="24" fill={hairColor} transform="rotate(30 126 34)" filter="url(#cozyShadow)" />
            <circle cx="116" cy="44" r="5" fill="#ec4899" />
          </g>
        )}
        {hairStyle === 'short' && (
          <path
            d="M 34 60 C 32 24, 55 16, 80 16 C 105 16, 128 24, 126 60 Z"
            fill={hairColor}
            filter="url(#cozyShadow)"
          />
        )}
        {hairStyle === 'fringe' && (
          <path
            d="M 32 60 C 30 22, 55 14, 80 14 C 105 14, 130 22, 128 60 L 128 75 C 122 78, 116 75, 114 68 L 114 60 C 114 60, 46 60, 46 60 L 46 68 C 44 75, 38 78, 32 75 Z"
            fill={hairColor}
            filter="url(#cozyShadow)"
          />
        )}

        {/* 4. Head & Face */}
        <g id="head-group">
          {/* Chibi Head (Cute Round Shape) */}
          <ellipse cx="80" cy="62" rx="42" ry="38" fill={skinColor} filter="url(#cozyShadow)" />
          
          {/* Ears */}
          <circle cx="38" cy="65" r="7" fill={skinColor} />
          <circle cx="122" cy="65" r="7" fill={skinColor} />

          {/* Soft Blushing Cheeks */}
          <circle cx="56" cy="72" r="9" fill="url(#blushGradient)" />
          <circle cx="104" cy="72" r="9" fill="url(#blushGradient)" />

          {/* 5. Eyes */}
          {eyeStyle === 'sparkle' && (
            <g>
              {/* Left Eye */}
              <circle cx="62" cy="63" r="6" fill={eyeColor} />
              <circle cx="60.5" cy="61" r="2.2" fill="#ffffff" />
              <circle cx="64" cy="65" r="1.2" fill="#ffffff" />
              {/* Right Eye */}
              <circle cx="98" cy="63" r="6" fill={eyeColor} />
              <circle cx="96.5" cy="61" r="2.2" fill="#ffffff" />
              <circle cx="100" cy="65" r="1.2" fill="#ffffff" />
            </g>
          )}

          {eyeStyle === 'happy' && (
            <g>
              <path d="M 56 65 Q 62 57 68 65" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
              <path d="M 92 65 Q 98 57 104 65" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {eyeStyle === 'sleepy' && (
            <g>
              <path d="M 56 63 Q 62 67 68 63" fill="none" stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 92 63 Q 98 67 104 63" fill="none" stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {eyeStyle === 'wink' && (
            <g>
              {/* Sparkly Left Eye */}
              <circle cx="62" cy="63" r="6" fill={eyeColor} />
              <circle cx="60.5" cy="61" r="2" fill="#ffffff" />
              {/* Winking Right Eye */}
              <path d="M 92 63 Q 98 56 104 63" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {eyeStyle === 'focused' && (
            <g>
              <ellipse cx="62" cy="63" rx="5" ry="6" fill={eyeColor} />
              <circle cx="61" cy="62" r="1.8" fill="#ffffff" />
              <ellipse cx="98" cy="63" rx="5" ry="6" fill={eyeColor} />
              <circle cx="97" cy="62" r="1.8" fill="#ffffff" />
              {/* Serious focus eyebrows */}
              <path d="M 56 55 L 68 57" stroke={hairColor} strokeWidth="2" strokeLinecap="round" />
              <path d="M 104 55 L 92 57" stroke={hairColor} strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {/* 6. Mouth */}
          {mouthStyle === 'smile' && (
            <path d="M 76 72 Q 80 77 84 72" fill="none" stroke="#834338" strokeWidth="2.5" strokeLinecap="round" />
          )}
          {mouthStyle === 'cat' && (
            <path d="M 74 72 Q 77 75 80 72 Q 83 75 86 72" fill="none" stroke="#834338" strokeWidth="2.2" strokeLinecap="round" />
          )}
          {mouthStyle === 'dot' && (
            <circle cx="80" cy="73" r="1.8" fill="#834338" />
          )}
          {mouthStyle === 'open' && (
            <path d="M 76 71 Q 80 79 84 71 Z" fill="#e11d48" stroke="#834338" strokeWidth="1.5" />
          )}
          {mouthStyle === 'bubblegum' && (
            <circle cx="80" cy="74" r="8.5" fill="#f472b6" stroke="#db2777" strokeWidth="1.5" className="animate-ping origin-center" />
          )}
          {mouthStyle === 'tea' && (
            <path d="M 77 73 Q 80 75 83 73" fill="none" stroke="#834338" strokeWidth="2" strokeLinecap="round" />
          )}

          {/* 7. Glasses Layer */}
          {glasses === 'round' && (
            <g>
              <circle cx="62" cy="63" r="9" fill="none" stroke="#475569" strokeWidth="2" />
              <circle cx="98" cy="63" r="9" fill="none" stroke="#475569" strokeWidth="2" />
              <line x1="71" y1="63" x2="89" y2="63" stroke="#475569" strokeWidth="2" />
            </g>
          )}
          {glasses === 'square' && (
            <g>
              <rect x="52" y="55" width="18" height="15" rx="3" fill="none" stroke="#1e293b" strokeWidth="2" />
              <rect x="90" y="55" width="18" height="15" rx="3" fill="none" stroke="#1e293b" strokeWidth="2" />
              <line x1="70" y1="62" x2="90" y2="62" stroke="#1e293b" strokeWidth="2" />
            </g>
          )}
          {glasses === 'sunglasses' && (
            <g>
              <polygon points="52,56 72,56 68,70 54,70" fill="#0f172a" />
              <polygon points="88,56 108,56 106,70 92,70" fill="#0f172a" />
              <line x1="72" y1="58" x2="88" y2="58" stroke="#0f172a" strokeWidth="3" />
            </g>
          )}
          {glasses === 'cyber' && (
            <polygon points="50,56 110,56 104,68 56,68" fill="#06b6d4" opacity="0.85" stroke="#22d3ee" strokeWidth="1.5" />
          )}

          {/* 8. Hair Styles (Front Bangs & Framing Locks) */}
          {hairStyle === 'messy' && (
            <g>
              {/* Soft, textured, anime-style wavy bangs */}
              <path
                d="M 36 56 C 36 32, 54 22, 80 22 C 106 22, 124 32, 124 56 C 118 42, 106 38, 96 46 C 88 38, 76 38, 68 46 C 56 38, 44 42, 36 56 Z"
                fill={hairColor}
              />
              <path d="M 64 38 L 68 49 L 74 41" fill={hairColor} />
              <path d="M 88 38 L 92 48 L 98 40" fill={hairColor} />
              {/* Sideburn locks */}
              <path d="M 36 52 Q 38 68 42 74 Q 40 64 44 56" fill={hairColor} />
              <path d="M 124 52 Q 122 68 118 74 Q 120 64 116 56" fill={hairColor} />
            </g>
          )}

          {hairStyle === 'bob' && (
            <g>
              {/* Neat curved chic bangs and sleek side curtains */}
              <path
                d="M 36 56 C 36 32, 54 22, 80 22 C 106 22, 124 32, 124 56 C 118 44, 108 40, 80 41 C 52 40, 42 44, 36 56 Z"
                fill={hairColor}
              />
              {/* Sleek side framing hair */}
              <path d="M 36 50 Q 36 75 42 82 Q 45 68 46 54 Z" fill={hairColor} />
              <path d="M 124 50 Q 124 75 118 82 Q 115 68 114 54 Z" fill={hairColor} />
            </g>
          )}

          {hairStyle === 'spiky' && (
            <g>
              {/* Clean anime spiky tufts framing the forehead */}
              <path
                d="M 36 54 C 38 34, 55 24, 80 24 C 105 24, 122 34, 124 54 C 116 44, 108 42, 98 48 L 88 36 L 82 46 L 72 35 L 64 48 C 54 42, 44 44, 36 54 Z"
                fill={hairColor}
              />
              {/* Soft spike highlights */}
              <polygon points="56,28 64,38 52,36" fill={hairColor} />
              <polygon points="80,24 88,36 78,35" fill={hairColor} />
              <polygon points="104,28 108,36 96,38" fill={hairColor} />
            </g>
          )}

          {hairStyle === 'braids' && (
            <g>
              {/* Soft side-parted bangs */}
              <path
                d="M 36 54 C 36 32, 54 22, 80 22 C 106 22, 124 32, 124 54 C 116 42, 100 40, 88 44 C 74 38, 54 40, 36 54 Z"
                fill={hairColor}
              />
              <path d="M 38 50 Q 40 64 42 70" stroke={hairColor} strokeWidth="4" strokeLinecap="round" />
              <path d="M 122 50 Q 120 64 118 70" stroke={hairColor} strokeWidth="4" strokeLinecap="round" />
            </g>
          )}

          {hairStyle === 'ponytail' && (
            <g>
              {/* Sleek swept bangs */}
              <path
                d="M 36 54 C 36 32, 54 22, 80 22 C 106 22, 124 32, 124 54 C 115 42, 98 40, 80 43 C 62 40, 46 42, 36 54 Z"
                fill={hairColor}
              />
              <path d="M 40 50 Q 44 65 46 72" stroke={hairColor} strokeWidth="3" strokeLinecap="round" />
              <path d="M 120 50 Q 116 65 114 72" stroke={hairColor} strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {hairStyle === 'afro' && (
            <g>
              {/* Cute textured afro edge around forehead */}
              <circle cx="56" cy="42" r="8" fill={hairColor} />
              <circle cx="68" cy="38" r="8" fill={hairColor} />
              <circle cx="80" cy="36" r="8" fill={hairColor} />
              <circle cx="92" cy="38" r="8" fill={hairColor} />
              <circle cx="104" cy="42" r="8" fill={hairColor} />
            </g>
          )}

          {hairStyle === 'fringe' && (
            <g>
              {/* Straight cute fringe bangs across forehead */}
              <path
                d="M 36 54 C 36 32, 54 22, 80 22 C 106 22, 124 32, 124 54 C 120 48, 114 48, 110 52 C 104 48, 96 48, 90 52 C 84 48, 76 48, 70 52 C 64 48, 56 48, 50 52 C 46 48, 40 48, 36 54 Z"
                fill={hairColor}
              />
              {/* Side strands */}
              <path d="M 36 50 L 38 72 L 44 60 Z" fill={hairColor} />
              <path d="M 124 50 L 122 72 L 116 60 Z" fill={hairColor} />
            </g>
          )}

          {hairStyle === 'short' && (
            <g>
              {/* Clean tapered crop */}
              <path
                d="M 38 52 C 38 32, 55 24, 80 24 C 105 24, 122 32, 122 52 C 114 42, 102 40, 90 44 C 78 39, 60 40, 38 52 Z"
                fill={hairColor}
              />
            </g>
          )}

          {/* 9. Hats Layer */}
          {hat === 'frog' && (
            <g>
              <path d="M 40 46 C 42 22, 70 20, 80 20 C 90 20, 118 22, 120 46 Z" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
              {/* Frog Eyes */}
              <circle cx="56" cy="20" r="9" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
              <circle cx="56" cy="19" r="4.5" fill="#ffffff" />
              <circle cx="56" cy="19" r="2.5" fill="#000000" />
              <circle cx="104" cy="20" r="9" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
              <circle cx="104" cy="19" r="4.5" fill="#ffffff" />
              <circle cx="104" cy="19" r="2.5" fill="#000000" />
            </g>
          )}

          {hat === 'beanie' && (
            <g>
              <path d="M 42 45 C 44 18, 65 12, 80 12 C 95 12, 116 18, 118 45 Z" fill="#e11d48" />
              <rect x="40" y="40" width="80" height="9" rx="3" fill="#be123c" />
              <circle cx="80" cy="10" r="6" fill="#fecdd3" />
            </g>
          )}

          {hat === 'catears' && (
            <g>
              <polygon points="48,36 56,12 68,30" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
              <polygon points="52,32 58,16 64,28" fill="#fda4af" />
              <polygon points="112,36 104,12 92,30" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
              <polygon points="108,32 102,16 96,28" fill="#fda4af" />
            </g>
          )}

          {hat === 'straw' && (
            <g>
              <ellipse cx="80" cy="38" rx="46" ry="12" fill="#fde047" stroke="#ca8a04" strokeWidth="2" />
              <path d="M 55 36 C 55 18, 70 14, 80 14 C 90 14, 105 18, 105 36 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
              <rect x="55" y="32" width="50" height="5" fill="#ef4444" />
            </g>
          )}

          {hat === 'wizard' && (
            <g>
              <ellipse cx="80" cy="40" rx="42" ry="10" fill="#6366f1" />
              <polygon points="56,38 80,-4 104,38" fill="#4f46e5" stroke="#3730a3" strokeWidth="1.5" />
              <polygon points="80,12 83,18 90,19 85,24 86,30 80,27 74,30 75,24 70,19 77,18" fill="#fde047" />
            </g>
          )}

          {hat === 'headphones' && (
            <g>
              <path d="M 36 65 A 44 44 0 0 1 124 65" fill="none" stroke="#334155" strokeWidth="5" />
              <rect x="30" y="55" width="10" height="20" rx="4" fill="#06b6d4" />
              <rect x="120" y="55" width="10" height="20" rx="4" fill="#06b6d4" />
            </g>
          )}

          {hat === 'beret' && (
            <g>
              <ellipse cx="86" cy="30" rx="34" ry="14" fill="#78350f" transform="rotate(-8 86 30)" />
              <circle cx="92" cy="18" r="2.5" fill="#451a03" />
            </g>
          )}

          {hat === 'crown' && (
            <g>
              <polygon points="52,36 50,18 64,28 80,14 96,28 110,18 108,36" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
              <circle cx="80" cy="24" r="2" fill="#ef4444" />
            </g>
          )}
        </g>

        {/* 10. Focus Activities & Props (Typing, Tea, Book, Painting) */}
        {showActivityProp && (
          <g transform="translate(0, 5)">
            {activity === 'typing' && (
              <g className={animate ? 'animate-typing origin-bottom' : ''}>
                {/* Laptop Base */}
                <polygon points="54,142 106,142 112,148 48,148" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
                {/* Laptop Screen with glowing code */}
                <rect x="56" y="112" width="48" height="30" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                <rect x="58" y="114" width="44" height="26" fill="#1e1b4b" />
                <line x1="62" y1="120" x2="86" y2="120" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
                <line x1="62" y1="126" x2="96" y2="126" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
                <line x1="62" y1="132" x2="78" y2="132" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
              </g>
            )}

            {activity === 'reading' && (
              <g>
                {/* Open Book */}
                <path d="M 52 135 Q 80 144 80 130 Q 80 144 108 135 L 108 118 Q 80 125 80 114 Q 80 125 52 118 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
                <line x1="60" y1="124" x2="74" y2="126" stroke="#a16207" strokeWidth="1.5" />
                <line x1="60" y1="130" x2="74" y2="132" stroke="#a16207" strokeWidth="1.5" />
                <line x1="86" y1="126" x2="100" y2="124" stroke="#a16207" strokeWidth="1.5" />
                <line x1="86" y1="132" x2="100" y2="130" stroke="#a16207" strokeWidth="1.5" />
              </g>
            )}

            {activity === 'tea' && (
              <g>
                {/* Steaming Tea Cup */}
                <ellipse cx="80" cy="140" rx="14" ry="4" fill="#cbd5e1" />
                <path d="M 70 126 L 73 140 Q 80 142 87 140 L 90 126 Z" fill="#38bdf8" />
                <ellipse cx="80" cy="126" rx="10" ry="3" fill="#0284c7" />
                {/* Steam particles */}
                <path d="M 77 122 Q 79 116 76 110" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" className="animate-steam" />
                <path d="M 83 122 Q 81 114 84 108" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" className="animate-steam" />
              </g>
            )}

            {activity === 'writing' && (
              <g>
                {/* Spiral Notebook & Pen */}
                <rect x="56" y="120" width="46" height="30" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" transform="rotate(-6 80 135)" />
                <line x1="62" y1="128" x2="94" y2="128" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="62" y1="136" x2="90" y2="136" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="96" y1="120" x2="106" y2="140" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}

            {activity === 'drawing' && (
              <g>
                {/* Canvas Easel */}
                <polygon points="58,110 102,110 106,146 54,146" fill="#f8fafc" stroke="#78350f" strokeWidth="2" />
                <circle cx="75" cy="126" r="6" fill="#f59e0b" />
                <path d="M 60 142 Q 74 130 90 142" fill="#10b981" />
              </g>
            )}

            {activity === 'meditating' && (
              <g>
                {/* Glowing sparkles */}
                <circle cx="48" cy="90" r="2.5" fill="#fde047" className="animate-ping" />
                <circle cx="112" cy="85" r="2" fill="#a78bfa" className="animate-ping" />
              </g>
            )}

            {activity === 'sleeping' && (
              <g>
                <text x="106" y="50" fill="#a78bfa" fontSize="14" fontWeight="bold" className="animate-bounce">Z</text>
                <text x="116" y="40" fill="#a78bfa" fontSize="11" fontWeight="bold" className="animate-bounce">z</text>
                <text x="124" y="32" fill="#a78bfa" fontSize="8" fontWeight="bold" className="animate-bounce">z</text>
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
