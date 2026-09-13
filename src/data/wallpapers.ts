export type WallpaperId =
  | 'azure_bliss'
  | 'midnight_ocean'
  | 'sakura_sky'
  | 'cyber_neon'
  | 'ghibli_grass'
  | 'lofi_rain'
  | 'cosmic_nebula'
  | 'retro_grid'
  | 'boba_sunset'
  | 'matcha_garden'
  | 'pastel_clouds'
  | 'starry_camp';

export interface WallpaperItem {
  id: WallpaperId;
  name: string;
  cost: number;
  gradientClass: string;
  pattern: string;
  desc: string;
  imageUrl: string;
  svgFallback: string;
}

// 100% Reliable, zero-latency handcrafted SVG wallpapers that never fail or show blank
const createSvgDataUrl = (svgContent: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
};

const svgAzureBliss = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="45%" stop-color="#38bdf8"/>
      <stop offset="70%" stop-color="#bae6fd"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
    <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#skyGrad)"/>
  <circle cx="960" cy="540" r="180" fill="#fef08a" opacity="0.45" filter="blur(20px)"/>
  <circle cx="960" cy="540" r="120" fill="#ffffff" opacity="0.8"/>
  <path d="M0,720 Q480,680 960,710 T1920,700 L1920,1080 L0,1080 Z" fill="url(#oceanGrad)" opacity="0.6"/>
  <path d="M0,780 Q480,740 960,770 T1920,760 L1920,1080 L0,1080 Z" fill="#0284c7" opacity="0.8"/>
  <path d="M0,860 Q480,820 960,850 T1920,840 L1920,1080 L0,1080 Z" fill="#0369a1"/>
  <ellipse cx="400" cy="340" rx="160" ry="45" fill="#ffffff" opacity="0.35"/>
  <ellipse cx="1400" cy="280" rx="210" ry="55" fill="#ffffff" opacity="0.3"/>
</svg>
`);

const svgMidnightOcean = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="nightSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#030712"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#nightSky)"/>
  <!-- Moon -->
  <circle cx="1450" cy="260" r="90" fill="#fef08a" opacity="0.9"/>
  <circle cx="1480" cy="240" r="85" fill="#0f172a"/>
  <!-- Stars -->
  <circle cx="200" cy="180" r="2.5" fill="#ffffff" opacity="0.8"/>
  <circle cx="340" cy="90" r="1.5" fill="#ffffff" opacity="0.6"/>
  <circle cx="620" cy="240" r="3" fill="#38bdf8" opacity="0.9"/>
  <circle cx="890" cy="120" r="2" fill="#ffffff" opacity="0.7"/>
  <circle cx="1100" cy="310" r="2" fill="#e0f2fe" opacity="0.8"/>
  <circle cx="1700" cy="150" r="2.5" fill="#ffffff" opacity="0.9"/>
  <!-- Waves -->
  <path d="M0,740 Q480,710 960,735 T1920,730 L1920,1080 L0,1080 Z" fill="#172554" opacity="0.7"/>
  <path d="M0,820 Q480,780 960,810 T1920,800 L1920,1080 L0,1080 Z" fill="#0f172a"/>
  <!-- Bioluminescent wave crest -->
  <path d="M0,818 Q480,778 960,808 T1920,798" stroke="#38bdf8" stroke-width="4" fill="none" opacity="0.75"/>
</svg>
`);

const svgSakuraSky = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="sakuraGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#be185d"/>
      <stop offset="35%" stop-color="#f43f5e"/>
      <stop offset="70%" stop-color="#fb7185"/>
      <stop offset="100%" stop-color="#fef08a"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#sakuraGrad)"/>
  <!-- Sun -->
  <circle cx="960" cy="620" r="220" fill="#fff1f2" opacity="0.85"/>
  <!-- Fuji Silhouette -->
  <polygon points="520,1080 960,560 1400,1080" fill="#4c0519" opacity="0.85"/>
  <polygon points="860,680 960,560 1060,680 960,660" fill="#fff1f2" opacity="0.9"/>
  <!-- Floating sakura petals -->
  <path d="M300,400 Q330,370 340,410 Q320,430 300,400 Z" fill="#fbcfe8" opacity="0.8"/>
  <path d="M700,320 Q730,290 740,330 Q720,350 700,320 Z" fill="#f472b6" opacity="0.75"/>
  <path d="M1250,440 Q1280,410 1290,450 Q1270,470 1250,440 Z" fill="#fbcfe8" opacity="0.85"/>
  <path d="M1600,280 Q1630,250 1640,290 Q1620,310 1600,280 Z" fill="#f472b6" opacity="0.9"/>
</svg>
`);

const svgCyberNeon = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="cyberSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#090514"/>
      <stop offset="50%" stop-color="#2e1065"/>
      <stop offset="100%" stop-color="#701a75"/>
    </linearGradient>
    <linearGradient id="sunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="50%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#cyberSky)"/>
  <!-- Synthwave Sun -->
  <circle cx="960" cy="520" r="190" fill="url(#sunGrad)"/>
  <!-- Sun Blinds stripes -->
  <rect x="760" y="470" width="400" height="6" fill="#2e1065"/>
  <rect x="760" y="490" width="400" height="10" fill="#2e1065"/>
  <rect x="760" y="520" width="400" height="14" fill="#2e1065"/>
  <rect x="760" y="560" width="400" height="20" fill="#2e1065"/>
  <rect x="760" y="610" width="400" height="26" fill="#2e1065"/>
  <!-- Grid Horizon Plane -->
  <rect x="0" y="650" width="1920" height="430" fill="#090514"/>
  <!-- Perspective Grid Lines -->
  <line x1="960" y1="650" x2="0" y2="1080" stroke="#06b6d4" stroke-width="2" opacity="0.6"/>
  <line x1="960" y1="650" x2="384" y2="1080" stroke="#06b6d4" stroke-width="2" opacity="0.6"/>
  <line x1="960" y1="650" x2="768" y2="1080" stroke="#06b6d4" stroke-width="2" opacity="0.6"/>
  <line x1="960" y1="650" x2="1152" y2="1080" stroke="#06b6d4" stroke-width="2" opacity="0.6"/>
  <line x1="960" y1="650" x2="1536" y2="1080" stroke="#06b6d4" stroke-width="2" opacity="0.6"/>
  <line x1="960" y1="650" x2="1920" y2="1080" stroke="#06b6d4" stroke-width="2" opacity="0.6"/>
  <line x1="0" y1="680" x2="1920" y2="680" stroke="#d946ef" stroke-width="2" opacity="0.5"/>
  <line x1="0" y1="730" x2="1920" y2="730" stroke="#d946ef" stroke-width="2" opacity="0.6"/>
  <line x1="0" y1="810" x2="1920" y2="810" stroke="#d946ef" stroke-width="2.5" opacity="0.7"/>
  <line x1="0" y1="920" x2="1920" y2="920" stroke="#d946ef" stroke-width="3" opacity="0.85"/>
</svg>
`);

const svgGhibliGrass = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="ghibliSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#38bdf8"/>
      <stop offset="85%" stop-color="#bae6fd"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#ghibliSky)"/>
  <!-- Fluffy anime clouds -->
  <ellipse cx="500" cy="280" rx="200" ry="80" fill="#ffffff" opacity="0.95"/>
  <ellipse cx="600" cy="240" rx="140" ry="90" fill="#ffffff" opacity="0.95"/>
  <ellipse cx="400" cy="270" rx="110" ry="70" fill="#ffffff" opacity="0.95"/>
  <ellipse cx="1400" cy="340" rx="260" ry="90" fill="#ffffff" opacity="0.9"/>
  <ellipse cx="1520" cy="290" rx="170" ry="100" fill="#ffffff" opacity="0.9"/>
  <!-- Rolling green hills -->
  <path d="M0,680 Q400,560 900,640 T1920,600 L1920,1080 L0,1080 Z" fill="#15803d"/>
  <path d="M0,760 Q600,660 1200,720 T1920,680 L1920,1080 L0,1080 Z" fill="#16a34a"/>
  <path d="M0,860 Q500,780 1100,840 T1920,800 L1920,1080 L0,1080 Z" fill="#22c55e"/>
</svg>
`);

const svgLofiRain = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="lofiSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="40%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#lofiSky)"/>
  <!-- Distant warm neon streetlights blurred in rain -->
  <circle cx="450" cy="620" r="140" fill="#f59e0b" opacity="0.25" filter="blur(35px)"/>
  <circle cx="850" cy="580" r="100" fill="#ec4899" opacity="0.2" filter="blur(30px)"/>
  <circle cx="1350" cy="650" r="160" fill="#06b6d4" opacity="0.2" filter="blur(40px)"/>
  <!-- Window frame border -->
  <rect x="60" y="60" width="880" height="960" fill="none" stroke="#0f172a" stroke-width="28" opacity="0.6"/>
  <rect x="980" y="60" width="880" height="960" fill="none" stroke="#0f172a" stroke-width="28" opacity="0.6"/>
  <!-- Rain droplet streaks -->
  <line x1="200" y1="120" x2="190" y2="240" stroke="#93c5fd" stroke-width="3" opacity="0.4" stroke-linecap="round"/>
  <line x1="380" y1="280" x2="370" y2="420" stroke="#93c5fd" stroke-width="2.5" opacity="0.5" stroke-linecap="round"/>
  <line x1="620" y1="160" x2="610" y2="300" stroke="#93c5fd" stroke-width="2.8" opacity="0.45" stroke-linecap="round"/>
  <line x1="1120" y1="220" x2="1110" y2="380" stroke="#93c5fd" stroke-width="3.2" opacity="0.5" stroke-linecap="round"/>
  <line x1="1450" y1="140" x2="1440" y2="280" stroke="#93c5fd" stroke-width="2.4" opacity="0.4" stroke-linecap="round"/>
  <line x1="1680" y1="310" x2="1670" y2="470" stroke="#93c5fd" stroke-width="3" opacity="0.5" stroke-linecap="round"/>
</svg>
`);

const svgCosmicNebula = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <radialGradient id="nebulaCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.65"/>
      <stop offset="40%" stop-color="#a855f7" stop-opacity="0.4"/>
      <stop offset="80%" stop-color="#3b82f6" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="#05020c"/>
  <circle cx="960" cy="540" r="580" fill="url(#nebulaCore)"/>
  <ellipse cx="680" cy="420" rx="350" ry="180" fill="#d946ef" opacity="0.35" transform="rotate(-25 680 420)"/>
  <ellipse cx="1250" cy="620" rx="420" ry="210" fill="#6366f1" opacity="0.3" transform="rotate(30 1250 620)"/>
  <!-- Stars -->
  <circle cx="320" cy="200" r="2" fill="#ffffff" opacity="0.9"/>
  <circle cx="750" cy="380" r="3" fill="#fef08a" opacity="1"/>
  <circle cx="960" cy="540" r="4" fill="#ffffff" opacity="1"/>
  <circle cx="1180" cy="480" r="2.5" fill="#bae6fd" opacity="0.9"/>
  <circle cx="1520" cy="320" r="2" fill="#ffffff" opacity="0.8"/>
  <circle cx="1680" cy="780" r="3" fill="#fbcfe8" opacity="0.9"/>
</svg>
`);

const svgRetroGrid = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="retroSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="60%" stop-color="#831843"/>
      <stop offset="100%" stop-color="#fb7185"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#retroSky)"/>
  <!-- Mountain Wireframe Silhouette -->
  <polygon points="100,680 450,420 800,680" fill="#4c0519" stroke="#ec4899" stroke-width="3"/>
  <polygon points="650,680 1050,340 1450,680" fill="#3b0764" stroke="#d946ef" stroke-width="3"/>
  <polygon points="1300,680 1600,480 1900,680" fill="#4c0519" stroke="#f43f5e" stroke-width="3"/>
  <!-- Horizon Laser Line -->
  <line x1="0" y1="680" x2="1920" y2="680" stroke="#fde047" stroke-width="4"/>
  <!-- Ground Plane Grid -->
  <rect x="0" y="680" width="1920" height="400" fill="#0f051d"/>
  <line x1="960" y1="680" x2="0" y2="1080" stroke="#38bdf8" stroke-width="2"/>
  <line x1="960" y1="680" x2="480" y2="1080" stroke="#38bdf8" stroke-width="2"/>
  <line x1="960" y1="680" x2="1440" y2="1080" stroke="#38bdf8" stroke-width="2"/>
  <line x1="960" y1="680" x2="1920" y2="1080" stroke="#38bdf8" stroke-width="2"/>
  <line x1="0" y1="720" x2="1920" y2="720" stroke="#ec4899" stroke-width="2" opacity="0.6"/>
  <line x1="0" y1="790" x2="1920" y2="790" stroke="#ec4899" stroke-width="2.5" opacity="0.75"/>
  <line x1="0" y1="900" x2="1920" y2="900" stroke="#ec4899" stroke-width="3" opacity="0.9"/>
</svg>
`);

const svgBobaSunset = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="bobaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="50%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#db2777"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bobaGrad)"/>
  <!-- Soft Glowing Peach Sun -->
  <circle cx="960" cy="500" r="220" fill="#fff7ed" opacity="0.8"/>
  <!-- Boba pearls floating in bottom layer -->
  <circle cx="340" cy="850" r="45" fill="#581c87" opacity="0.75"/>
  <circle cx="480" cy="920" r="40" fill="#4c0519" opacity="0.8"/>
  <circle cx="780" cy="870" r="48" fill="#581c87" opacity="0.7"/>
  <circle cx="980" cy="940" r="42" fill="#4c0519" opacity="0.85"/>
  <circle cx="1200" cy="860" r="50" fill="#581c87" opacity="0.75"/>
  <circle cx="1500" cy="900" r="44" fill="#4c0519" opacity="0.8"/>
  <circle cx="1680" cy="840" r="38" fill="#581c87" opacity="0.7"/>
</svg>
`);

const svgMatchaGarden = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="matchaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="50%" stop-color="#047857"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#matchaGrad)"/>
  <!-- Zen Concentric Sand Circles -->
  <circle cx="960" cy="600" r="380" fill="none" stroke="#a7f3d0" stroke-width="4" opacity="0.3"/>
  <circle cx="960" cy="600" r="280" fill="none" stroke="#a7f3d0" stroke-width="4" opacity="0.4"/>
  <circle cx="960" cy="600" r="180" fill="none" stroke="#a7f3d0" stroke-width="4" opacity="0.5"/>
  <!-- Bamboo Stems Silhouette -->
  <rect x="220" y="0" width="28" height="1080" fill="#022c22" opacity="0.7"/>
  <rect x="360" y="0" width="34" height="1080" fill="#022c22" opacity="0.6"/>
  <rect x="1560" y="0" width="30" height="1080" fill="#022c22" opacity="0.65"/>
  <rect x="1720" y="0" width="36" height="1080" fill="#022c22" opacity="0.7"/>
</svg>
`);

const svgPastelClouds = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="pastelSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="40%" stop-color="#c084fc"/>
      <stop offset="75%" stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#pastelSky)"/>
  <ellipse cx="400" cy="480" rx="280" ry="110" fill="#ffffff" opacity="0.75"/>
  <ellipse cx="560" cy="420" rx="200" ry="120" fill="#ffffff" opacity="0.8"/>
  <ellipse cx="1400" cy="540" rx="320" ry="130" fill="#ffffff" opacity="0.7"/>
  <ellipse cx="1550" cy="480" rx="210" ry="140" fill="#ffffff" opacity="0.75"/>
  <circle cx="960" cy="400" r="140" fill="#fef08a" opacity="0.7"/>
</svg>
`);

const svgStarryCamp = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="campNight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#campNight)"/>
  <!-- Milky Way Band -->
  <ellipse cx="960" cy="400" rx="800" ry="240" fill="#6366f1" opacity="0.25" transform="rotate(-25 960 400)"/>
  <!-- Stars -->
  <circle cx="280" cy="180" r="2.5" fill="#ffffff" opacity="0.9"/>
  <circle cx="620" cy="220" r="3" fill="#fde047" opacity="1"/>
  <circle cx="960" cy="160" r="2" fill="#ffffff" opacity="0.8"/>
  <circle cx="1320" cy="280" r="2.5" fill="#ffffff" opacity="0.95"/>
  <circle cx="1680" cy="140" r="3" fill="#38bdf8" opacity="1"/>
  <!-- Pine Tree Silhouettes -->
  <polygon points="120,1080 200,680 280,1080" fill="#022c22"/>
  <polygon points="260,1080 360,620 460,1080" fill="#021c16"/>
  <polygon points="1440,1080 1540,640 1640,1080" fill="#021c16"/>
  <polygon points="1600,1080 1700,700 1800,1080" fill="#022c22"/>
  <!-- Campfire glow -->
  <circle cx="960" cy="980" r="90" fill="#ea580c" opacity="0.8" filter="blur(20px)"/>
  <circle cx="960" cy="970" r="40" fill="#fde047" opacity="0.9"/>
</svg>
`);

export const WALLPAPERS: WallpaperItem[] = [
  {
    id: 'azure_bliss',
    name: 'Classic Azure Bliss',
    cost: 0,
    gradientClass: 'bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500',
    pattern: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)',
    desc: 'Clean, vibrant desktop blue for pure focus',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgAzureBliss,
  },
  {
    id: 'midnight_ocean',
    name: 'Midnight Deep Navy',
    cost: 0,
    gradientClass: 'bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950',
    pattern: 'radial-gradient(circle at 80% 80%, rgba(56, 189, 248, 0.1) 0%, transparent 50%)',
    desc: 'Deep soothing navy for night-owl coding',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgMidnightOcean,
  },
  {
    id: 'sakura_sky',
    name: 'Sakura Sunset Bloom',
    cost: 25,
    gradientClass: 'bg-gradient-to-br from-pink-600 via-rose-500 to-amber-400',
    pattern: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)',
    desc: 'Warm pastel cherry blossom sunset tones',
    imageUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgSakuraSky,
  },
  {
    id: 'cyber_neon',
    name: 'Neo-Tokyo Cyberpunk',
    cost: 25,
    gradientClass: 'bg-gradient-to-br from-purple-950 via-indigo-900 to-cyan-900',
    pattern: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
    desc: 'Electric neon synthwave grid aesthetics',
    imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgCyberNeon,
  },
  {
    id: 'ghibli_grass',
    name: 'Ghibli Meadow Breeze',
    cost: 30,
    gradientClass: 'bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-500',
    pattern: 'radial-gradient(circle at 70% 30%, rgba(250, 204, 21, 0.15) 0%, transparent 50%)',
    desc: 'Cozy countryside green hills and warm sunlight',
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgGhibliGrass,
  },
  {
    id: 'lofi_rain',
    name: 'Cozy Cafe Lofi Rain',
    cost: 30,
    gradientClass: 'bg-gradient-to-br from-slate-900 via-sky-950 to-blue-900',
    pattern: 'radial-gradient(circle at 30% 70%, rgba(56, 189, 248, 0.18) 0%, transparent 45%)',
    desc: 'Moody rainy windowpane atmosphere with soft ambient tones',
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgLofiRain,
  },
  {
    id: 'cosmic_nebula',
    name: 'Deep Cosmic Nebula',
    cost: 35,
    gradientClass: 'bg-gradient-to-br from-purple-950 via-fuchsia-950 to-indigo-950',
    pattern: 'radial-gradient(circle at 40% 40%, rgba(217, 70, 239, 0.2) 0%, transparent 60%)',
    desc: 'Expansive glowing stellar clouds and deep space stars',
    imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgCosmicNebula,
  },
  {
    id: 'retro_grid',
    name: 'Retro 90s Pixel Vapor',
    cost: 35,
    gradientClass: 'bg-gradient-to-br from-violet-900 via-pink-900 to-indigo-900',
    pattern: 'linear-gradient(rgba(244, 114, 182, 0.15) 2px, transparent 2px), linear-gradient(90deg, rgba(244, 114, 182, 0.15) 2px, transparent 2px)',
    desc: 'Vintage vaporwave neon nostalgia grid',
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgRetroGrid,
  },
  {
    id: 'boba_sunset',
    name: 'Kawaii Boba Peach Sunset',
    cost: 20,
    gradientClass: 'bg-gradient-to-br from-orange-400 via-rose-400 to-pink-500',
    pattern: 'radial-gradient(circle at 60% 40%, rgba(255, 255, 255, 0.25) 0%, transparent 50%)',
    desc: 'Warm comforting peach tea and cute tapioca pearls aesthetic',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgBobaSunset,
  },
  {
    id: 'matcha_garden',
    name: 'Matcha Tea Zen Garden',
    cost: 20,
    gradientClass: 'bg-gradient-to-br from-teal-900 via-emerald-800 to-lime-700',
    pattern: 'radial-gradient(circle at 40% 60%, rgba(255, 255, 255, 0.12) 0%, transparent 60%)',
    desc: 'Serene Japanese bamboo forest and frothy green matcha',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgMatchaGarden,
  },
  {
    id: 'pastel_clouds',
    name: 'Sweet Pastel Cloudscape',
    cost: 25,
    gradientClass: 'bg-gradient-to-br from-indigo-400 via-purple-300 to-pink-300',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
    desc: 'Dreamy cotton candy clouds floating in a peaceful lavender sky',
    imageUrl: 'https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgPastelClouds,
  },
  {
    id: 'starry_camp',
    name: 'Starlight Forest Camp',
    cost: 25,
    gradientClass: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-950',
    pattern: 'radial-gradient(circle at 75% 25%, rgba(253, 224, 71, 0.15) 0%, transparent 40%)',
    desc: 'Campfire sparks rising toward the Milky Way above towering pines',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgStarryCamp,
  },
];
