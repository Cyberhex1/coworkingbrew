export type WallpaperId =
  | 'azure_bliss'
  | 'midnight_ocean'
  | 'pastel_clouds'
  | 'starry_camp'
  | 'boba_sunset'
  | 'cute_ramen_cat'
  | 'fluffy_pancake'
  | 'sushi_party_cute'
  | 'strawberry_bakery'
  | 'matcha_parfait'
  | 'galaxy_donut'
  | 'corgi_bakery'
  | 'shiba_space'
  | 'capybara_onsen'
  | 'cat_cafe_afternoon'
  | 'bunny_garden'
  | 'sleepy_hamster'
  | 'duck_raincoat'
  | 'sakura_sky'
  | 'cyber_neon'
  | 'ghibli_grass'
  | 'lofi_rain'
  | 'cosmic_nebula'
  | 'retro_grid'
  | 'matcha_garden';

export type WallpaperTier = 'basic' | 'premium';
export type WallpaperCategory = 'basic' | 'food' | 'pet' | 'anime' | 'scenery';

export interface WallpaperItem {
  id: WallpaperId;
  name: string;
  cost: number;
  tier: WallpaperTier;
  category: WallpaperCategory;
  gradientClass: string;
  pattern: string;
  desc: string;
  imageUrl: string;
  svgFallback: string;
}

const createSvgDataUrl = (svgContent: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
};

// BASIC WALLPAPERS
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
  <circle cx="960" cy="540" r="180" fill="#fef08a" opacity="0.45"/>
  <circle cx="960" cy="540" r="120" fill="#ffffff" opacity="0.8"/>
  <path d="M0,720 Q480,680 960,710 T1920,700 L1920,1080 L0,1080 Z" fill="url(#oceanGrad)" opacity="0.6"/>
  <path d="M0,780 Q480,740 960,770 T1920,760 L1920,1080 L0,1080 Z" fill="#0284c7" opacity="0.8"/>
  <path d="M0,860 Q480,820 960,850 T1920,840 L1920,1080 L0,1080 Z" fill="#0369a1"/>
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
  <circle cx="1450" cy="260" r="90" fill="#fef08a" opacity="0.9"/>
  <circle cx="1480" cy="240" r="85" fill="#0f172a"/>
  <circle cx="200" cy="180" r="3" fill="#ffffff" opacity="0.8"/>
  <circle cx="620" cy="240" r="3" fill="#38bdf8" opacity="0.9"/>
  <circle cx="1100" cy="310" r="3" fill="#e0f2fe" opacity="0.8"/>
  <path d="M0,740 Q480,710 960,735 T1920,730 L1920,1080 L0,1080 Z" fill="#172554" opacity="0.7"/>
  <path d="M0,820 Q480,780 960,810 T1920,800 L1920,1080 L0,1080 Z" fill="#0f172a"/>
</svg>
`);

const svgPastelClouds = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="cloudSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="50%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#f472b6"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#cloudSky)"/>
  <circle cx="450" cy="520" r="140" fill="#ffffff" opacity="0.45"/>
  <circle cx="600" cy="480" r="180" fill="#ffffff" opacity="0.5"/>
  <circle cx="750" cy="520" r="140" fill="#ffffff" opacity="0.45"/>
  <circle cx="1250" cy="460" r="150" fill="#ffffff" opacity="0.45"/>
  <circle cx="1400" cy="420" r="190" fill="#ffffff" opacity="0.5"/>
  <circle cx="1550" cy="460" r="150" fill="#ffffff" opacity="0.45"/>
</svg>
`);

const svgStarryCamp = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="campNight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#14532d"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#campNight)"/>
  <polygon points="300,1080 400,680 500,1080" fill="#052e16"/>
  <polygon points="450,1080 580,620 710,1080" fill="#022c22"/>
  <polygon points="1200,1080 1350,600 1500,1080" fill="#052e16"/>
  <circle cx="960" cy="850" r="60" fill="#f97316" opacity="0.8"/>
  <circle cx="960" cy="850" r="35" fill="#facc15"/>
</svg>
`);

// CUTE CARTOON FOODS (SVG)
const svgCuteRamenCat = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="ramenBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="50%" stop-color="#fbcfe8"/>
      <stop offset="100%" stop-color="#f472b6"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#ramenBg)"/>
  <!-- Floating Kawaii Food Motifs -->
  <circle cx="300" cy="250" r="40" fill="#fb7185" opacity="0.3"/>
  <circle cx="1600" cy="220" r="50" fill="#facc15" opacity="0.3"/>
  <circle cx="1650" cy="850" r="35" fill="#38bdf8" opacity="0.3"/>
  <circle cx="250" cy="800" r="45" fill="#4ade80" opacity="0.3"/>
  
  <!-- Big Ceramic Ramen Bowl -->
  <ellipse cx="960" cy="650" rx="360" ry="200" fill="#be123c"/>
  <ellipse cx="960" cy="620" rx="340" ry="170" fill="#fef08a"/>
  <!-- Broth & Noodles -->
  <ellipse cx="960" cy="620" rx="310" ry="145" fill="#f59e0b"/>
  <!-- Naruto Fishcake -->
  <circle cx="850" cy="580" r="48" fill="#ffffff"/>
  <path d="M850,555 A25,25 0 0,1 865,580 A15,15 0 0,1 850,590 A8,8 0 0,1 845,580" stroke="#f43f5e" stroke-width="8" fill="none" stroke-linecap="round"/>
  <!-- Soft Boiled Egg -->
  <ellipse cx="1060" cy="590" rx="42" ry="50" fill="#ffffff" transform="rotate(-20 1060 590)"/>
  <ellipse cx="1060" cy="590" rx="24" ry="28" fill="#ea580c" transform="rotate(-20 1060 590)"/>
  <!-- Nori Sheet -->
  <rect x="720" y="470" width="80" height="120" rx="10" fill="#064e3b" transform="rotate(-15 720 470)"/>
  <!-- Green Onion Scallions -->
  <circle cx="940" cy="640" r="14" fill="#22c55e"/>
  <circle cx="970" cy="610" r="12" fill="#16a34a"/>
  <circle cx="1000" cy="650" r="15" fill="#22c55e"/>
  <!-- Cute Peeking Kitty Face -->
  <circle cx="960" cy="430" r="110" fill="#ffffff"/>
  <polygon points="870,360 890,260 950,340" fill="#ffffff"/>
  <polygon points="885,350 895,280 940,335" fill="#f472b6"/>
  <polygon points="1050,360 1030,260 970,340" fill="#ffffff"/>
  <polygon points="1035,350 1025,280 980,335" fill="#f472b6"/>
  <!-- Kitty Eyes & Blush -->
  <circle cx="915" cy="425" r="10" fill="#1e293b"/>
  <circle cx="1005" cy="425" r="10" fill="#1e293b"/>
  <ellipse cx="885" cy="445" rx="18" ry="10" fill="#fda4af"/>
  <ellipse cx="1035" cy="445" rx="18" ry="10" fill="#fda4af"/>
  <path d="M960,438 L952,450 L968,450 Z" fill="#f43f5e"/>
  <path d="M945,455 Q960,465 960,455 Q960,465 975,455" stroke="#1e293b" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- Chopsticks -->
  <line x1="680" y1="420" x2="1240" y2="520" stroke="#78350f" stroke-width="12" stroke-linecap="round"/>
  <line x1="680" y1="400" x2="1240" y2="500" stroke="#9a3412" stroke-width="12" stroke-linecap="round"/>
</svg>
`);

const svgFluffyPancake = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="pancakeBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="50%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fbcfe8"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#pancakeBg)"/>
  <!-- Cute Strawberry & Star sparkles -->
  <circle cx="400" cy="300" r="15" fill="#f43f5e"/>
  <circle cx="1520" cy="320" r="15" fill="#f43f5e"/>
  <circle cx="320" cy="780" r="20" fill="#fbbf24"/>
  <circle cx="1600" cy="740" r="20" fill="#fbbf24"/>

  <!-- Plate -->
  <ellipse cx="960" cy="760" rx="420" ry="160" fill="#ffffff" opacity="0.9"/>
  <ellipse cx="960" cy="750" rx="380" ry="130" fill="#bae6fd"/>

  <!-- Pancake 3 (Bottom) -->
  <ellipse cx="960" cy="690" rx="300" ry="100" fill="#d97706"/>
  <ellipse cx="960" cy="660" rx="300" ry="100" fill="#fde68a"/>
  <!-- Pancake 2 (Middle) -->
  <ellipse cx="960" cy="590" rx="270" ry="90" fill="#d97706"/>
  <ellipse cx="960" cy="560" rx="270" ry="90" fill="#fde68a"/>
  <!-- Pancake 1 (Top) -->
  <ellipse cx="960" cy="490" rx="240" ry="80" fill="#d97706"/>
  <ellipse cx="960" cy="460" rx="240" ry="80" fill="#fef08a"/>

  <!-- Dripping Maple Syrup -->
  <path d="M780,470 Q800,560 820,530 Q840,620 860,540 Q900,640 920,530 Q960,660 980,520 Q1020,630 1060,510 Q1100,590 1140,470" stroke="#b45309" stroke-width="18" fill="none" stroke-linecap="round"/>
  <!-- Melting Butter Cube -->
  <rect x="910" y="380" width="100" height="70" rx="14" fill="#fde047" stroke="#f59e0b" stroke-width="6"/>
  <!-- Bunny Face on Butter -->
  <circle cx="940" cy="410" r="6" fill="#78350f"/>
  <circle cx="980" cy="410" r="6" fill="#78350f"/>
  <path d="M955,420 Q960,425 965,420" stroke="#78350f" stroke-width="3" fill="none"/>
  <!-- Strawberries & Blueberries -->
  <circle cx="830" cy="430" r="32" fill="#ef4444"/>
  <circle cx="1090" cy="440" r="32" fill="#ef4444"/>
  <circle cx="1040" cy="430" r="18" fill="#4338ca"/>
  <circle cx="880" cy="440" r="18" fill="#4338ca"/>
</svg>
`);

const svgBobaSunset = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="bobaSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="50%" stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bobaSky)"/>
  <!-- Boba Cup -->
  <path d="M760,340 L800,860 Q960,910 1120,860 L1160,340 Z" fill="#ffffff" opacity="0.3"/>
  <path d="M780,390 L810,840 Q960,885 1110,840 L1140,390 Z" fill="#fed7aa"/>
  <!-- Cream Foam Cap -->
  <ellipse cx="960" cy="390" rx="180" ry="40" fill="#ffffff"/>
  <ellipse cx="960" cy="360" rx="160" ry="30" fill="#fef08a" opacity="0.5"/>
  <!-- Straw with Bear Ears -->
  <rect x="940" y="160" width="40" height="340" rx="20" fill="#f43f5e" transform="rotate(12 960 300)"/>
  <!-- Tapioca Pearls with Cute Faces -->
  <circle cx="860" cy="800" r="32" fill="#1e1b4b"/>
  <circle cx="930" cy="820" r="34" fill="#0f172a"/>
  <circle cx="1000" cy="810" r="33" fill="#1e1b4b"/>
  <circle cx="1060" cy="790" r="30" fill="#0f172a"/>
  <circle cx="890" cy="740" r="30" fill="#1e1b4b"/>
  <circle cx="960" cy="750" r="32" fill="#0f172a"/>
  <circle cx="1030" cy="740" r="31" fill="#1e1b4b"/>
  <!-- Kawaii Smile on Cup -->
  <circle cx="910" cy="560" r="10" fill="#78350f"/>
  <circle cx="1010" cy="560" r="10" fill="#78350f"/>
  <ellipse cx="880" cy="580" rx="18" ry="10" fill="#fda4af"/>
  <ellipse cx="1040" cy="580" rx="18" ry="10" fill="#fda4af"/>
  <path d="M940,580 Q960,605 980,580" stroke="#78350f" stroke-width="6" fill="none" stroke-linecap="round"/>
</svg>
`);

const svgSushiParty = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="sushiBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#dcfce7"/>
      <stop offset="50%" stop-color="#bae6fd"/>
      <stop offset="100%" stop-color="#ddd6fe"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#sushiBg)"/>
  <!-- Bamboo Mat Board -->
  <rect x="420" y="440" width="1080" height="380" rx="28" fill="#d97706" opacity="0.85"/>
  <rect x="440" y="460" width="1040" height="340" rx="20" fill="#fef3c7"/>
  
  <!-- Onigiri (Left) -->
  <polygon points="620,490 530,680 710,680" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
  <rect x="580" y="610" width="80" height="70" rx="8" fill="#0f172a"/>
  <circle cx="590" cy="580" r="7" fill="#1e293b"/>
  <circle cx="650" cy="580" r="7" fill="#1e293b"/>
  <ellipse cx="570" cy="600" rx="12" ry="7" fill="#fda4af"/>
  <ellipse cx="670" cy="600" rx="12" ry="7" fill="#fda4af"/>
  <path d="M610,595 Q620,608 630,595" stroke="#1e293b" stroke-width="4" fill="none"/>

  <!-- Salmon Nigiri (Center) -->
  <rect x="800" y="580" width="220" height="90" rx="30" fill="#ffffff"/>
  <rect x="780" y="520" width="260" height="75" rx="32" fill="#fb923c"/>
  <line x1="820" y1="535" x2="880" y2="575" stroke="#ffffff" stroke-width="6" opacity="0.7"/>
  <line x1="900" y1="535" x2="960" y2="575" stroke="#ffffff" stroke-width="6" opacity="0.7"/>
  <rect x="880" y="515" width="40" height="160" rx="6" fill="#022c22"/>
  <circle cx="840" cy="565" r="7" fill="#431407"/>
  <circle cx="980" cy="565" r="7" fill="#431407"/>

  <!-- Tamago Nigiri (Right) -->
  <rect x="1140" y="580" width="220" height="90" rx="30" fill="#ffffff"/>
  <rect x="1120" y="520" width="260" height="75" rx="30" fill="#facc15"/>
  <rect x="1220" y="515" width="40" height="160" rx="6" fill="#022c22"/>
  <circle cx="1180" cy="565" r="7" fill="#713f12"/>
  <circle cx="1280" cy="565" r="7" fill="#713f12"/>
</svg>
`);

const svgStrawberryBakery = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="strawBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffe4e6"/>
      <stop offset="50%" stop-color="#fecdd3"/>
      <stop offset="100%" stop-color="#fda4af"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#strawBg)"/>
  <!-- Cake Slice -->
  <polygon points="700,680 1220,680 1020,440" fill="#ffffff"/>
  <polygon points="700,680 1220,680 1220,720 700,720" fill="#fde047"/>
  <rect x="740" y="580" width="440" height="24" fill="#f43f5e"/>
  <rect x="780" y="630" width="360" height="24" fill="#f43f5e"/>
  <!-- Whipped Cream Frosting Swirls -->
  <circle cx="780" cy="460" r="36" fill="#ffffff"/>
  <circle cx="860" cy="440" r="42" fill="#ffffff"/>
  <circle cx="950" cy="430" r="46" fill="#ffffff"/>
  <circle cx="1040" cy="440" r="42" fill="#ffffff"/>
  <!-- Glossy Ruby Strawberries -->
  <circle cx="860" cy="400" r="30" fill="#e11d48"/>
  <circle cx="950" cy="380" r="34" fill="#e11d48"/>
  <circle cx="1040" cy="400" r="30" fill="#e11d48"/>
  <polygon points="950,340 940,355 960,355" fill="#22c55e"/>
</svg>
`);

// CUTE CARTOON PETS (SVG)
const svgCorgiBakery = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="corgiBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="50%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#corgiBg)"/>
  <!-- Baker Hat -->
  <ellipse cx="960" cy="310" rx="140" ry="90" fill="#ffffff"/>
  <rect x="880" y="340" width="160" height="45" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
  
  <!-- Corgi Big Pointy Ears -->
  <polygon points="760,490 700,290 850,390" fill="#f59e0b"/>
  <polygon points="770,470 725,320 830,400" fill="#fecdd3"/>
  <polygon points="1160,490 1220,290 1070,390" fill="#f59e0b"/>
  <polygon points="1150,470 1195,320 1090,400" fill="#fecdd3"/>

  <!-- Corgi Head & Cheeks -->
  <ellipse cx="960" cy="510" rx="180" ry="150" fill="#f59e0b"/>
  <!-- White Fur Blaze -->
  <ellipse cx="960" cy="540" rx="100" ry="120" fill="#ffffff"/>
  <polygon points="960,400 930,500 990,500" fill="#ffffff"/>

  <!-- Corgi Sparkling Eyes -->
  <circle cx="890" cy="490" r="18" fill="#292524"/>
  <circle cx="896" cy="484" r="6" fill="#ffffff"/>
  <circle cx="1030" cy="490" r="18" fill="#292524"/>
  <circle cx="1036" cy="484" r="6" fill="#ffffff"/>

  <!-- Pink Cheek Blush -->
  <ellipse cx="830" cy="535" rx="25" ry="15" fill="#fda4af"/>
  <ellipse cx="1090" cy="535" rx="25" ry="15" fill="#fda4af"/>

  <!-- Heart Nose & Happy Open Smile -->
  <path d="M960,530 L942,512 A12,12 0 0,1 960,498 A12,12 0 0,1 978,512 Z" fill="#1e293b"/>
  <path d="M935,540 Q960,560 960,540 Q960,560 985,540" stroke="#1e293b" stroke-width="6" fill="none" stroke-linecap="round"/>
  <!-- Tongue -->
  <ellipse cx="960" cy="565" rx="18" ry="25" fill="#f43f5e"/>

  <!-- Fresh Loaf of Baguette in Paws -->
  <ellipse cx="960" cy="740" rx="240" ry="60" fill="#d97706" transform="rotate(-10 960 740)"/>
  <ellipse cx="960" cy="740" rx="220" ry="45" fill="#fef08a" transform="rotate(-10 960 740)"/>
</svg>
`);

const svgShibaSpace = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="spaceBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#311042"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#spaceBg)"/>
  <!-- Stars & Planet with Rings -->
  <circle cx="340" cy="240" r="70" fill="#ec4899"/>
  <ellipse cx="340" cy="240" rx="120" ry="20" fill="none" stroke="#f472b6" stroke-width="8" transform="rotate(-25 340 240)"/>
  <circle cx="1550" cy="300" r="4" fill="#fef08a"/>
  <circle cx="1620" cy="450" r="3" fill="#38bdf8"/>
  <circle cx="280" cy="800" r="5" fill="#ffffff"/>

  <!-- Astronaut Helmet Glass Bubble -->
  <circle cx="960" cy="510" r="240" fill="#38bdf8" opacity="0.3"/>
  <circle cx="960" cy="510" r="230" fill="none" stroke="#67e8f9" stroke-width="14"/>

  <!-- Shiba Face inside Helmet -->
  <circle cx="960" cy="520" r="160" fill="#ea580c"/>
  <ellipse cx="960" cy="560" rx="110" ry="90" fill="#ffffff"/>
  <!-- Eyebrows -->
  <circle cx="895" cy="455" r="14" fill="#ffffff"/>
  <circle cx="1025" cy="455" r="14" fill="#ffffff"/>
  <!-- Eyes -->
  <circle cx="900" cy="495" r="14" fill="#18181b"/>
  <circle cx="1020" cy="495" r="14" fill="#18181b"/>
  <!-- Snout & Nose -->
  <ellipse cx="960" cy="535" rx="16" ry="12" fill="#18181b"/>
  <path d="M940,550 Q960,570 980,550" stroke="#18181b" stroke-width="6" fill="none" stroke-linecap="round"/>

  <!-- Spacesuit Collar & Chestpack -->
  <rect x="800" y="720" width="320" height="180" rx="40" fill="#f1f5f9"/>
  <circle cx="960" cy="800" r="30" fill="#0284c7"/>
</svg>
`);

const svgCapybaraOnsen = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="onsenBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3b0764"/>
      <stop offset="50%" stop-color="#4c1d95"/>
      <stop offset="100%" stop-color="#14532d"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#onsenBg)"/>
  <!-- Onsen Hot Spring Rocks -->
  <ellipse cx="960" cy="740" rx="520" ry="240" fill="#334155"/>
  <ellipse cx="960" cy="720" rx="480" ry="200" fill="#065f46"/>
  <!-- Water Surface & Steam Rings -->
  <ellipse cx="960" cy="710" rx="450" ry="170" fill="#0d9488" opacity="0.8"/>
  <path d="M840,480 Q860,420 840,360 M960,450 Q980,390 960,330 M1080,480 Q1100,420 1080,360" stroke="#ffffff" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.4"/>

  <!-- Capybara Head & Zen Expression -->
  <rect x="820" y="440" width="280" height="230" rx="70" fill="#a16207"/>
  <!-- Small Round Ears -->
  <circle cx="830" cy="460" r="24" fill="#713f12"/>
  <circle cx="1090" cy="460" r="24" fill="#713f12"/>
  <!-- Zen Closed Eyes -->
  <line x1="860" y1="520" x2="910" y2="520" stroke="#451a03" stroke-width="8" stroke-linecap="round"/>
  <line x1="1010" y1="520" x2="1060" y2="520" stroke="#451a03" stroke-width="8" stroke-linecap="round"/>
  <!-- Snout -->
  <ellipse cx="960" cy="600" rx="45" ry="35" fill="#713f12"/>
  <ellipse cx="945" cy="595" rx="8" ry="12" fill="#1c1917"/>
  <ellipse cx="975" cy="595" rx="8" ry="12" fill="#1c1917"/>

  <!-- Floating Yuzu Fruit on Capybara's Head -->
  <circle cx="960" cy="400" r="42" fill="#facc15"/>
  <circle cx="960" cy="365" r="8" fill="#15803d"/>
  <ellipse cx="975" cy="365" rx="14" ry="6" fill="#22c55e"/>
</svg>
`);

const svgCatCafe = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="cafeBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="50%" stop-color="#fecdd3"/>
      <stop offset="100%" stop-color="#fda4af"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#cafeBg)"/>
  <!-- Pastel Floor Cushion -->
  <ellipse cx="960" cy="720" rx="360" ry="140" fill="#f43f5e" opacity="0.3"/>
  <ellipse cx="960" cy="700" rx="340" ry="120" fill="#c084fc"/>

  <!-- Sleeping Curled Calico Kitty -->
  <ellipse cx="960" cy="620" rx="220" ry="150" fill="#ffffff"/>
  <ellipse cx="880" cy="580" rx="80" ry="70" fill="#ea580c"/>
  <ellipse cx="1050" cy="610" rx="70" ry="60" fill="#1e293b"/>
  <!-- Kitty Ears -->
  <polygon points="820,530 840,440 900,510" fill="#ea580c"/>
  <polygon points="840,515 850,460 885,500" fill="#fbcfe8"/>
  <polygon points="980,510 1040,440 1060,530" fill="#1e293b"/>
  <polygon points="1000,500 1035,460 1045,515" fill="#fbcfe8"/>
  <!-- Sleeping Happy Eyes -->
  <path d="M870,550 Q890,565 910,550" stroke="#1e293b" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M970,550 Q990,565 1010,550" stroke="#1e293b" stroke-width="6" fill="none" stroke-linecap="round"/>
  <ellipse cx="850" cy="565" rx="16" ry="10" fill="#fda4af"/>
  <ellipse cx="1030" cy="565" rx="16" ry="10" fill="#fda4af"/>
  <!-- Tail wrapped around -->
  <path d="M1160,630 Q1220,700 1140,740 Q1040,760 980,720" stroke="#ea580c" stroke-width="32" fill="none" stroke-linecap="round"/>
</svg>
`);

const svgBunnyGarden = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="bunnyBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bae6fd"/>
      <stop offset="50%" stop-color="#bbf7d0"/>
      <stop offset="100%" stop-color="#86efac"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bunnyBg)"/>
  <!-- Green Grassy Hills -->
  <ellipse cx="400" cy="980" rx="700" ry="300" fill="#22c55e"/>
  <ellipse cx="1500" cy="950" rx="800" ry="320" fill="#16a34a"/>
  
  <!-- Bunny Body & Long Floppy Ears -->
  <ellipse cx="960" cy="650" rx="190" ry="160" fill="#ffffff"/>
  <!-- Ears -->
  <ellipse cx="880" cy="380" rx="45" ry="140" fill="#ffffff" transform="rotate(-15 880 380)"/>
  <ellipse cx="880" cy="380" rx="25" ry="110" fill="#fbcfe8" transform="rotate(-15 880 380)"/>
  <ellipse cx="1040" cy="380" rx="45" ry="140" fill="#ffffff" transform="rotate(15 1040 380)"/>
  <ellipse cx="1040" cy="380" rx="25" ry="110" fill="#fbcfe8" transform="rotate(15 1040 380)"/>
  <!-- Bunny Face -->
  <circle cx="910" cy="570" r="14" fill="#db2777"/>
  <circle cx="1010" cy="570" r="14" fill="#db2777"/>
  <ellipse cx="860" cy="600" rx="22" ry="14" fill="#fda4af"/>
  <ellipse cx="1060" cy="600" rx="22" ry="14" fill="#fda4af"/>
  <polygon points="960,600 950,588 970,588" fill="#f43f5e"/>
  <path d="M940,610 Q960,625 980,610" stroke="#475569" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- Giant Carrot -->
  <polygon points="960,760 900,660 1020,660" fill="#f97316"/>
  <polygon points="930,660 910,610 950,640" fill="#22c55e"/>
  <polygon points="960,660 960,600 975,640" fill="#22c55e"/>
</svg>
`);

const svgDuckRaincoat = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="duckBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#64748b"/>
      <stop offset="50%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#duckBg)"/>
  <!-- Raindrops & Puddle -->
  <ellipse cx="960" cy="880" rx="420" ry="100" fill="#0369a1"/>
  <ellipse cx="960" cy="870" rx="380" ry="80" fill="#38bdf8" opacity="0.6"/>

  <!-- Baby Duck in Yellow Raincoat -->
  <circle cx="960" cy="440" r="130" fill="#fde047"/>
  <ellipse cx="960" cy="660" rx="170" ry="160" fill="#eab308"/>
  <!-- Duck Bill -->
  <ellipse cx="960" cy="470" rx="55" ry="25" fill="#f97316"/>
  <!-- Eyes -->
  <circle cx="915" cy="425" r="14" fill="#0f172a"/>
  <circle cx="919" cy="420" r="5" fill="#ffffff"/>
  <circle cx="1005" cy="425" r="14" fill="#0f172a"/>
  <circle cx="1009" cy="420" r="5" fill="#ffffff"/>

  <!-- Yellow Raincoat Hood & Buttons -->
  <path d="M820,440 Q960,260 1100,440 L1120,680 Q960,760 800,680 Z" fill="#facc15" opacity="0.95"/>
  <circle cx="960" cy="550" r="12" fill="#b45309"/>
  <circle cx="960" cy="610" r="12" fill="#b45309"/>

  <!-- Red Rainboots -->
  <rect x="880" y="780" width="60" height="90" rx="20" fill="#dc2626"/>
  <rect x="980" y="780" width="60" height="90" rx="20" fill="#dc2626"/>
</svg>
`);

// SCENERY & AESTHETIC SVG
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
  <circle cx="960" cy="620" r="220" fill="#fff1f2" opacity="0.85"/>
  <polygon points="520,1080 960,560 1400,1080" fill="#4c0519" opacity="0.85"/>
  <polygon points="860,680 960,560 1060,680 960,660" fill="#fff1f2" opacity="0.9"/>
</svg>
`);

const svgCyberNeon = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="cyberSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#050515"/>
      <stop offset="60%" stop-color="#180b30"/>
      <stop offset="100%" stop-color="#3b0764"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#cyberSky)"/>
  <line x1="0" y1="700" x2="1920" y2="700" stroke="#f43f5e" stroke-width="4"/>
  <line x1="0" y1="760" x2="1920" y2="760" stroke="#06b6d4" stroke-width="3"/>
  <line x1="0" y1="840" x2="1920" y2="840" stroke="#06b6d4" stroke-width="3"/>
  <line x1="0" y1="940" x2="1920" y2="940" stroke="#06b6d4" stroke-width="4"/>
  <line x1="960" y1="700" x2="150" y2="1080" stroke="#06b6d4" stroke-width="2"/>
  <line x1="960" y1="700" x2="550" y2="1080" stroke="#06b6d4" stroke-width="2"/>
  <line x1="960" y1="700" x2="960" y2="1080" stroke="#06b6d4" stroke-width="2"/>
  <line x1="960" y1="700" x2="1370" y2="1080" stroke="#06b6d4" stroke-width="2"/>
  <line x1="960" y1="700" x2="1770" y2="1080" stroke="#06b6d4" stroke-width="2"/>
</svg>
`);

const svgGhibliGrass = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="ghibliSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="60%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#ghibliSky)"/>
  <path d="M0,640 Q480,540 960,620 T1920,580 L1920,1080 L0,1080 Z" fill="#15803d"/>
  <path d="M0,720 Q480,640 960,700 T1920,660 L1920,1080 L0,1080 Z" fill="#22c55e"/>
</svg>
`);

const svgLofiRain = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="lofiSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="50%" stop-color="#172554"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#lofiSky)"/>
  <circle cx="600" cy="500" r="140" fill="#fef08a" opacity="0.3"/>
  <circle cx="1300" cy="450" r="160" fill="#f472b6" opacity="0.25"/>
</svg>
`);

const svgCosmicNebula = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="cosmicSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#050014"/>
      <stop offset="50%" stop-color="#2e0854"/>
      <stop offset="100%" stop-color="#581c87"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#cosmicSky)"/>
  <circle cx="700" cy="400" r="280" fill="#c026d3" opacity="0.35"/>
  <circle cx="1200" cy="600" r="320" fill="#3b82f6" opacity="0.3"/>
</svg>
`);

const svgRetroGrid = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="retroSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="50%" stop-color="#4c0519"/>
      <stop offset="100%" stop-color="#831843"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#retroSky)"/>
  <circle cx="960" cy="480" r="180" fill="#fbbf24"/>
</svg>
`);

const svgMatchaGarden = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="matchaSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="50%" stop-color="#047857"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#matchaSky)"/>
  <circle cx="960" cy="540" r="160" fill="#a7f3d0" opacity="0.3"/>
</svg>
`);

export const WALLPAPERS: WallpaperItem[] = [
  // ==================== BASIC DEFAULT WALLPAPERS ====================
  {
    id: 'azure_bliss',
    name: 'Azure Sky Bliss',
    cost: 0,
    tier: 'basic',
    category: 'basic',
    gradientClass: 'bg-gradient-to-br from-sky-600 via-sky-400 to-blue-200',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.25) 0%, transparent 60%)',
    desc: 'Crisp morning daylight over deep blue ocean and calm horizon',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgAzureBliss,
  },
  {
    id: 'midnight_ocean',
    name: 'Midnight Ocean Moon',
    cost: 0,
    tier: 'basic',
    category: 'basic',
    gradientClass: 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950',
    pattern: 'radial-gradient(circle at 80% 20%, rgba(254, 240, 138, 0.15) 0%, transparent 50%)',
    desc: 'Quiet deep blue waves reflecting golden moonlight and soft stars',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgMidnightOcean,
  },
  {
    id: 'pastel_clouds',
    name: 'Sweet Pastel Cloudscape',
    cost: 15,
    tier: 'basic',
    category: 'basic',
    gradientClass: 'bg-gradient-to-br from-indigo-400 via-purple-300 to-pink-300',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
    desc: 'Dreamy cotton candy clouds floating in a peaceful lavender sky',
    imageUrl: 'https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgPastelClouds,
  },
  {
    id: 'starry_camp',
    name: 'Starlight Forest Camp',
    cost: 20,
    tier: 'basic',
    category: 'basic',
    gradientClass: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-950',
    pattern: 'radial-gradient(circle at 75% 25%, rgba(253, 224, 71, 0.15) 0%, transparent 40%)',
    desc: 'Campfire sparks rising toward the Milky Way above towering pines',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgStarryCamp,
  },

  // ==================== PREMIUM CUTE CARTOON FOODS ====================
  {
    id: 'cute_ramen_cat',
    name: 'Steaming Neko Ramen',
    cost: 25,
    tier: 'premium',
    category: 'food',
    gradientClass: 'bg-gradient-to-br from-orange-300 via-pink-300 to-rose-400',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(254, 240, 138, 0.25) 0%, transparent 60%)',
    desc: 'Steaming delicious ramen bowl with cute cat chef, egg & naruto swirls',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgCuteRamenCat,
  },
  {
    id: 'fluffy_pancake',
    name: 'Fluffy Bunny Pancakes',
    cost: 25,
    tier: 'premium',
    category: 'food',
    gradientClass: 'bg-gradient-to-br from-amber-200 via-orange-200 to-pink-200',
    pattern: 'radial-gradient(circle at 50% 40%, rgba(253, 230, 138, 0.3) 0%, transparent 60%)',
    desc: 'Triple-stacked golden pancakes with melting bunny butter and honey syrup',
    imageUrl: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgFluffyPancake,
  },
  {
    id: 'boba_sunset',
    name: 'Kawaii Peach Boba Tea',
    cost: 20,
    tier: 'premium',
    category: 'food',
    gradientClass: 'bg-gradient-to-br from-orange-400 via-rose-400 to-pink-500',
    pattern: 'radial-gradient(circle at 60% 40%, rgba(255, 255, 255, 0.25) 0%, transparent 50%)',
    desc: 'Warm peach milk tea with sweet smiling tapioca pearls and bear straw',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgBobaSunset,
  },
  {
    id: 'sushi_party_cute',
    name: 'Kawaii Sushi Bento Party',
    cost: 25,
    tier: 'premium',
    category: 'food',
    gradientClass: 'bg-gradient-to-br from-emerald-200 via-sky-200 to-indigo-200',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 55%)',
    desc: 'Smiling onigiri rice ball, salmon nigiri, and tamago bento board',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgSushiParty,
  },
  {
    id: 'strawberry_bakery',
    name: 'Strawberry Shortcake Sweet',
    cost: 25,
    tier: 'premium',
    category: 'food',
    gradientClass: 'bg-gradient-to-br from-rose-200 via-pink-200 to-red-300',
    pattern: 'radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.35) 0%, transparent 60%)',
    desc: 'Pastel French bakery slice loaded with fresh glazed strawberries & cream',
    imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgStrawberryBakery,
  },

  // ==================== PREMIUM CUTE CARTOON PETS ====================
  {
    id: 'corgi_bakery',
    name: 'Corgi Fresh Bakery',
    cost: 25,
    tier: 'premium',
    category: 'pet',
    gradientClass: 'bg-gradient-to-br from-amber-200 via-orange-300 to-amber-400',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.4) 0%, transparent 60%)',
    desc: 'Happy smiling fluffy corgi chef serving fresh warm baguettes',
    imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgCorgiBakery,
  },
  {
    id: 'shiba_space',
    name: 'Shiba Astronaut Orbit',
    cost: 25,
    tier: 'premium',
    category: 'pet',
    gradientClass: 'bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900',
    pattern: 'radial-gradient(circle at 30% 30%, rgba(56, 189, 248, 0.2) 0%, transparent 50%)',
    desc: 'Cute Shiba Inu wearing bubble astronaut helmet floating through pink stars',
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgShibaSpace,
  },
  {
    id: 'capybara_onsen',
    name: 'Capybara Yuzu Hot Spring',
    cost: 25,
    tier: 'premium',
    category: 'pet',
    gradientClass: 'bg-gradient-to-br from-teal-900 via-emerald-800 to-amber-900',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(250, 204, 21, 0.2) 0%, transparent 50%)',
    desc: 'Ultra zen capybara soaking in warm outdoor onsen with floating yellow yuzu',
    imageUrl: 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgCapybaraOnsen,
  },
  {
    id: 'cat_cafe_afternoon',
    name: 'Sunlit Neko Cat Lounge',
    cost: 25,
    tier: 'premium',
    category: 'pet',
    gradientClass: 'bg-gradient-to-br from-pink-100 via-rose-200 to-purple-200',
    pattern: 'radial-gradient(circle at 50% 60%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)',
    desc: 'Sleeping calico kitten curled up on a soft lavender floor pillow',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgCatCafe,
  },
  {
    id: 'bunny_garden',
    name: 'Bunny Carrot Patch Garden',
    cost: 20,
    tier: 'premium',
    category: 'pet',
    gradientClass: 'bg-gradient-to-br from-sky-200 via-emerald-200 to-green-300',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.35) 0%, transparent 60%)',
    desc: 'Cute floppy-eared white rabbit munching crunchy carrots in a spring meadow',
    imageUrl: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgBunnyGarden,
  },
  {
    id: 'duck_raincoat',
    name: 'Yellow Raincoat Duckling',
    cost: 20,
    tier: 'premium',
    category: 'pet',
    gradientClass: 'bg-gradient-to-br from-slate-700 via-sky-600 to-blue-700',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(254, 240, 138, 0.25) 0%, transparent 50%)',
    desc: 'Adorable baby duckling wearing bright yellow rain jacket and red puddle boots',
    imageUrl: 'https://images.unsplash.com/photo-1555859316-26477d612e4f?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgDuckRaincoat,
  },

  // ==================== PREMIUM ANIME & SCENERY ====================
  {
    id: 'sakura_sky',
    name: 'Sakura Blossom Fuji',
    cost: 25,
    tier: 'premium',
    category: 'anime',
    gradientClass: 'bg-gradient-to-br from-pink-500 via-rose-400 to-amber-300',
    pattern: 'radial-gradient(circle at 50% 60%, rgba(255, 241, 242, 0.3) 0%, transparent 60%)',
    desc: 'Springtime Mt. Fuji silhouette under floating pink sakura blossom petals',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgSakuraSky,
  },
  {
    id: 'cyber_neon',
    name: 'Retro Cyberpunk City',
    cost: 30,
    tier: 'premium',
    category: 'anime',
    gradientClass: 'bg-gradient-to-br from-slate-950 via-purple-950 to-pink-950',
    pattern: 'linear-gradient(rgba(6, 182, 212, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.15) 1px, transparent 1px)',
    desc: 'Luminous neon skyline and glowing grid horizon',
    imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgCyberNeon,
  },
  {
    id: 'ghibli_grass',
    name: 'Ghibli Meadow Breeze',
    cost: 30,
    tier: 'premium',
    category: 'scenery',
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
    tier: 'premium',
    category: 'scenery',
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
    tier: 'premium',
    category: 'scenery',
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
    tier: 'premium',
    category: 'anime',
    gradientClass: 'bg-gradient-to-br from-violet-900 via-pink-900 to-indigo-900',
    pattern: 'linear-gradient(rgba(244, 114, 182, 0.15) 2px, transparent 2px), linear-gradient(90deg, rgba(244, 114, 182, 0.15) 2px, transparent 2px)',
    desc: 'Vintage vaporwave neon nostalgia grid',
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgRetroGrid,
  },
  {
    id: 'matcha_garden',
    name: 'Matcha Tea Zen Garden',
    cost: 20,
    tier: 'premium',
    category: 'scenery',
    gradientClass: 'bg-gradient-to-br from-teal-900 via-emerald-800 to-lime-700',
    pattern: 'radial-gradient(circle at 40% 60%, rgba(255, 255, 255, 0.12) 0%, transparent 60%)',
    desc: 'Serene Japanese bamboo forest and frothy green matcha',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1400&q=80',
    svgFallback: svgMatchaGarden,
  },
];
