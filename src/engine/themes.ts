// Room themes. Every room shares one layout (8 desks, coffee area, vending
// machine, library, whiteboard, copier, water cooler, lounge) and changes its
// materials, palette, light and window view.

export type ThemeId =
  | 'office' | 'loft_office' | 'tech_hub' | 'tea_loft' | 'cafe'
  | 'treehouse' | 'greenhouse' | 'lilypad' | 'arcade';

export type TimeOfDay = 'day' | 'sunset' | 'night' | 'rainy';
export type FloorStyle = 'planks' | 'carpet' | 'parquet' | 'tatami' | 'stone' | 'grid' | 'timber';
export type WallStyle = 'plaster' | 'brick' | 'tile' | 'shoji' | 'bistro' | 'logs' | 'glass' | 'panel' | 'neon';
export type SkyStyle = 'city' | 'sunset' | 'cityDay' | 'bamboo' | 'rain' | 'forest' | 'garden' | 'pond' | 'synth';

export interface RoomTheme {
  id: ThemeId;
  title: string;
  short: string;
  description: string;
  category: 'office' | 'cafe' | 'nature' | 'night';
  door: string;
  ambiance: string;
  timeOfDay: TimeOfDay;
  floor: FloorStyle;
  floorColors: [string, string, string, string]; // dark, mid, light, seam
  wall: WallStyle;
  wallColors: { base: string; alt: string; wainscot: string; trim: string };
  wood: { dark: string; mid: string; light: string };
  fabric: string; // sofa / armchairs
  fabric2: string;
  rug: [string, string, string];
  sky: SkyStyle;
  hemi: { sky: string; ground: string; intensity: number };
  sun: { color: string; intensity: number };
  lamp: string; // warm light colour
  lampIntensity: number;
  bg: string; // void colour around the room
  neon?: [string, string];
  /** default ambience mix suggestion */
  ambience: Partial<Record<'rain' | 'cafe' | 'fire' | 'birds' | 'crickets' | 'vinyl' | 'water', number>>;
  bot: { name: string; status: string };
}

export const THEMES: RoomTheme[] = [
  {
    id: 'office',
    title: 'Open-Plan Studio Office',
    short: 'Studio Office',
    description: 'Bright Scandinavian ash hardwood, acoustic slate carpet, panoramic high-rise skyline.',
    category: 'office',
    door: 'Door #10',
    ambiance: 'Lofi beats & subtle typing',
    timeOfDay: 'day',
    floor: 'carpet',
    floorColors: ['#4f5866', '#5c6676', '#687384', '#454d59'],
    wall: 'plaster',
    wallColors: { base: '#e9e4da', alt: '#dcd5c8', wainscot: '#c9bba5', trim: '#a9967c' },
    wood: { dark: '#8a6a4a', mid: '#c9a77c', light: '#e2c9a0' },
    fabric: '#5b85b8',
    fabric2: '#e2b04a',
    rug: ['#d9734e', '#f4e4c1', '#8a2f2f'],
    sky: 'cityDay',
    hemi: { sky: '#fff6e6', ground: '#6b5a4a', intensity: 1.15 },
    sun: { color: '#fff1d6', intensity: 1.5 },
    lamp: '#ffd9a0',
    lampIntensity: 0.6,
    bg: '#1d2033',
    ambience: { cafe: 0.25, vinyl: 0.15 },
    bot: { name: 'Alex', status: 'Refactoring the design system' },
  },
  {
    id: 'loft_office',
    title: 'Sunset Tech Hub Office',
    short: 'Sunset Loft',
    description: 'Exposed terracotta brick accent walls, dark walnut hardwood, warm sunset window.',
    category: 'office',
    door: 'Door #20',
    ambiance: 'Sunset glow & terminal focus',
    timeOfDay: 'sunset',
    floor: 'planks',
    floorColors: ['#3e2418', '#55321f', '#6b4128', '#2a1810'],
    wall: 'brick',
    wallColors: { base: '#a8553a', alt: '#8a4430', wainscot: '#4a2a1e', trim: '#2f1a12' },
    wood: { dark: '#3e2418', mid: '#6b4128', light: '#94603c' },
    fabric: '#c08a2e',
    fabric2: '#2e3a5e',
    rug: ['#2e3a5e', '#e2b04a', '#b5463b'],
    sky: 'sunset',
    hemi: { sky: '#ffb894', ground: '#4a2a3a', intensity: 0.95 },
    sun: { color: '#ff9a5c', intensity: 1.7 },
    lamp: '#ffc070',
    lampIntensity: 1.1,
    bg: '#2a1626',
    ambience: { vinyl: 0.3, cafe: 0.1 },
    bot: { name: 'Ren', status: 'Shipping the release notes' },
  },
  {
    id: 'tech_hub',
    title: 'Corner Office & Coffee Bar',
    short: 'Coffee Bar',
    description: 'Oak herringbone flooring, illuminated neon sign, specialty espresso counter.',
    category: 'cafe',
    door: 'Door #30',
    ambiance: 'Espresso steam & morning light',
    timeOfDay: 'day',
    floor: 'parquet',
    floorColors: ['#8a5a36', '#a8714a', '#c48d5e', '#6b4128'],
    wall: 'tile',
    wallColors: { base: '#f4efe4', alt: '#e2dccd', wainscot: '#2f5c4a', trim: '#1f3d32' },
    wood: { dark: '#5a3424', mid: '#8a5234', light: '#c98b5a' },
    fabric: '#3f7d4a',
    fabric2: '#d9734e',
    rug: ['#3f7d4a', '#f4e4c1', '#c08a2e'],
    sky: 'city',
    hemi: { sky: '#fff3dc', ground: '#5a4030', intensity: 1.1 },
    sun: { color: '#ffe9c4', intensity: 1.55 },
    lamp: '#ffcf8a',
    lampIntensity: 0.7,
    bg: '#1f2a26',
    neon: ['#ff6fa8', '#ffd1e4'],
    ambience: { cafe: 0.45, vinyl: 0.15 },
    bot: { name: 'Mei', status: 'Writing a grant proposal' },
  },
  {
    id: 'tea_loft',
    title: 'Kyoto Tea Loft',
    short: 'Tea Loft',
    description: 'Woven tatami mats, shoji paper screens, indoor rock garden & bonsai.',
    category: 'cafe',
    door: 'Door #40',
    ambiance: 'Bamboo breeze & tea steeping',
    timeOfDay: 'day',
    floor: 'tatami',
    floorColors: ['#a8a060', '#bdb574', '#cfc788', '#3d4a2a'],
    wall: 'shoji',
    wallColors: { base: '#f6f0dc', alt: '#e8dfc4', wainscot: '#5a3c26', trim: '#3d2818' },
    wood: { dark: '#3d2818', mid: '#6b4a30', light: '#9a7048' },
    fabric: '#8a2f2f',
    fabric2: '#3f5f8f',
    rug: ['#2f5c3c', '#e6cf9f', '#8a2f2f'],
    sky: 'bamboo',
    hemi: { sky: '#f4f6e4', ground: '#5a5030', intensity: 1.1 },
    sun: { color: '#fff8e0', intensity: 1.4 },
    lamp: '#ffd8a0',
    lampIntensity: 0.6,
    bg: '#1f2a1e',
    ambience: { water: 0.3, birds: 0.25 },
    bot: { name: 'Aoi', status: 'Translating a haiku anthology' },
  },
  {
    id: 'cafe',
    title: 'Rainy Window Espresso Café',
    short: 'Rainy Café',
    description: 'Mahogany floor, Parisian bistro walls, rainy blue window & glowing fireplace.',
    category: 'cafe',
    door: 'Door #50',
    ambiance: 'Window raindrops & warm mocha',
    timeOfDay: 'rainy',
    floor: 'planks',
    floorColors: ['#4a2420', '#5e2e26', '#74392e', '#2f1614'],
    wall: 'bistro',
    wallColors: { base: '#2f4a44', alt: '#294039', wainscot: '#5e2e26', trim: '#c08a2e' },
    wood: { dark: '#3a1c18', mid: '#5e2e26', light: '#8a4a3a' },
    fabric: '#8a2f2f',
    fabric2: '#c08a2e',
    rug: ['#8a2f2f', '#e2b04a', '#2e3a5e'],
    sky: 'rain',
    hemi: { sky: '#9fb4c8', ground: '#3a2420', intensity: 0.75 },
    sun: { color: '#b8c8e0', intensity: 0.7 },
    lamp: '#ffb860',
    lampIntensity: 1.5,
    bg: '#161c26',
    ambience: { rain: 0.55, cafe: 0.3, fire: 0.25 },
    bot: { name: 'Elena', status: 'Editing chapter 7' },
  },
  {
    id: 'treehouse',
    title: 'Forest Canopy Treehouse',
    short: 'Treehouse',
    description: 'Rustic timber planks, moss rug, tree trunk pillars & open balcony.',
    category: 'nature',
    door: 'Door #60',
    ambiance: 'Rustling leaves & birdsong',
    timeOfDay: 'sunset',
    floor: 'timber',
    floorColors: ['#5a3a22', '#74502e', '#8e6638', '#3a2414'],
    wall: 'logs',
    wallColors: { base: '#7a5230', alt: '#5e3e22', wainscot: '#4a3018', trim: '#3a2414' },
    wood: { dark: '#4a3018', mid: '#74502e', light: '#a07440' },
    fabric: '#4a7a3a',
    fabric2: '#c06a3a',
    rug: ['#4a7a3a', '#8cb45a', '#2f5a2a'],
    sky: 'forest',
    hemi: { sky: '#ffd8a8', ground: '#2f3a20', intensity: 0.95 },
    sun: { color: '#ffb070', intensity: 1.5 },
    lamp: '#ffc070',
    lampIntensity: 1.0,
    bg: '#1a2418',
    ambience: { birds: 0.45, fire: 0.15 },
    bot: { name: 'Kaito', status: 'Sketching field notes' },
  },
  {
    id: 'greenhouse',
    title: 'Botanical Conservatory',
    short: 'Conservatory',
    description: 'Flagstone path, Victorian arched glass walls & lush tropical monstera.',
    category: 'nature',
    door: 'Door #70',
    ambiance: 'Lush tropical greenhouse air',
    timeOfDay: 'day',
    floor: 'stone',
    floorColors: ['#7a8070', '#8e9484', '#a4a896', '#4a5040'],
    wall: 'glass',
    wallColors: { base: '#e8f0e4', alt: '#d4e2d0', wainscot: '#5a6a4a', trim: '#f4f4ee' },
    wood: { dark: '#5a4a34', mid: '#8a7050', light: '#b8996c' },
    fabric: '#e2b04a',
    fabric2: '#d97a86',
    rug: ['#d97a86', '#fbf1dc', '#3f7d4a'],
    sky: 'garden',
    hemi: { sky: '#f0fff0', ground: '#3a5030', intensity: 1.25 },
    sun: { color: '#fffbe8', intensity: 1.6 },
    lamp: '#ffe0a8',
    lampIntensity: 0.5,
    bg: '#1c2a20',
    ambience: { birds: 0.35, water: 0.2 },
    bot: { name: 'Hana', status: 'Cataloguing seed samples' },
  },
  {
    id: 'lilypad',
    title: 'Starlight Lotus Pond',
    short: 'Lotus Pond',
    description: 'Dark timber dock over crystal water, blooming lotus & a glowing moon.',
    category: 'night',
    door: 'Door #80',
    ambiance: 'Fireflies & nocturnal crickets',
    timeOfDay: 'night',
    floor: 'planks',
    floorColors: ['#2a2430', '#3a3040', '#4a3e50', '#18141e'],
    wall: 'panel',
    wallColors: { base: '#2e3a5e', alt: '#263050', wainscot: '#1d2440', trim: '#8cb4dc' },
    wood: { dark: '#2a2430', mid: '#4a3e50', light: '#6e5e74' },
    fabric: '#6e4a7a',
    fabric2: '#8cb4dc',
    rug: ['#3f5f8f', '#f0a8a8', '#1d2440'],
    sky: 'pond',
    hemi: { sky: '#5a6aa8', ground: '#1a1a2a', intensity: 0.55 },
    sun: { color: '#a8c0ff', intensity: 0.55 },
    lamp: '#ffc890',
    lampIntensity: 1.6,
    bg: '#0c1020',
    ambience: { crickets: 0.4, water: 0.3 },
    bot: { name: 'Luna', status: 'Studying for finals' },
  },
  {
    id: 'arcade',
    title: 'Retro Pixel Study Den',
    short: 'Pixel Den',
    description: 'Obsidian synthwave floor with cyan & magenta neon grid and arcade cabinets.',
    category: 'night',
    door: 'Door #90',
    ambiance: '8-bit hum & synth beats',
    timeOfDay: 'night',
    floor: 'grid',
    floorColors: ['#14121e', '#1c1a2a', '#26223a', '#00e5ff'],
    wall: 'neon',
    wallColors: { base: '#1c1a2a', alt: '#241f36', wainscot: '#120f1c', trim: '#ff3fb4' },
    wood: { dark: '#1c1a2a', mid: '#2e2a44', light: '#4a4468' },
    fabric: '#6e4a7a',
    fabric2: '#00a8c0',
    rug: ['#2e2a44', '#00e5ff', '#ff3fb4'],
    sky: 'synth',
    hemi: { sky: '#6a5aa8', ground: '#140f20', intensity: 0.6 },
    sun: { color: '#c08aff', intensity: 0.5 },
    lamp: '#ff7ad0',
    lampIntensity: 1.5,
    bg: '#0a0814',
    neon: ['#00e5ff', '#ff3fb4'],
    ambience: { vinyl: 0.2 },
    bot: { name: 'Pixel', status: 'Speedrunning a problem set' },
  },
];

export const THEME_BY_ID: Record<ThemeId, RoomTheme> = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<
  ThemeId,
  RoomTheme
>;

export const SERVERS = [
  { id: 'silicon', name: 'Silicon' },
  { id: 'haven', name: 'Haven' },
  { id: 'sakura', name: 'Sakura' },
] as const;
export type ServerId = (typeof SERVERS)[number]['id'];

export function roomKey(theme: ThemeId, server: ServerId) {
  return `${theme}-${server}`;
}
