// CoworkingBrew master palette — warm 16-bit café. Every sprite pulls from here so
// the whole world reads as one piece of art.
export const P = {
  ink: '#2a1a1f',
  inkSoft: '#3d2830',
  shadow: 'rgba(42,26,31,0.28)',

  // woods
  wood0: '#4a2a1e',
  wood1: '#6b3c28',
  wood2: '#8a5234',
  wood3: '#a86a42',
  wood4: '#c98b5a',

  // floor planks (lighter honey oak)
  plank0: '#7d4f33',
  plank1: '#946042',
  plank2: '#a8714d',
  plank3: '#b9825a',

  // walls
  wall0: '#b89a7c',
  wall1: '#d9c2a0',
  wall2: '#efdcbc',
  wall3: '#f8ecd4',
  wallTop: '#5c3a2c',
  wainscot0: '#5e3626',
  wainscot1: '#7a4830',

  // cream / paper
  cream: '#fbf1dc',
  paper: '#f4e4c1',
  paper2: '#e6cf9f',

  // brass + amber
  brass0: '#8a5a1e',
  brass1: '#c08a2e',
  brass2: '#e2b04a',
  brass3: '#f7d97a',
  amber: '#ffcf7a',
  amberHot: '#fff0b8',

  // greens
  leaf0: '#24402e',
  leaf1: '#2f5c3c',
  leaf2: '#3f7d4a',
  leaf3: '#62a356',
  leaf4: '#9cc96a',

  // reds / terracotta
  red0: '#5c1f24',
  red1: '#8a2f2f',
  red2: '#b5463b',
  red3: '#d9734e',
  pink1: '#d97a86',
  pink2: '#f0a8a8',
  pink3: '#ffd3cc',

  // blues / teals
  navy0: '#1d2440',
  navy1: '#2e3a5e',
  blue1: '#3f5f8f',
  blue2: '#5b85b8',
  blue3: '#8cb4dc',
  sky: '#a8d8f0',
  teal1: '#2f6b6b',
  teal2: '#4a9a8f',
  teal3: '#7cc8b4',
  crt: '#8fe3c4',
  crtDim: '#3c8a78',

  // purples
  plum1: '#4a2e52',
  plum2: '#6e4a7a',
  lilac: '#a98ac4',

  // neutrals
  gray0: '#3a3a44',
  gray1: '#5a5a66',
  gray2: '#8a8a94',
  gray3: '#b8b8be',
  gray4: '#e2e2e2',
  white: '#ffffff',

  // carpets
  carpet0: '#55606e',
  carpet1: '#5f6b7a',
  carpet2: '#6b7888',
  sage0: '#6a7a58',
  sage1: '#76875f',
  sage2: '#86976c',

  // checker tile
  tileA: '#ece0c8',
  tileB: '#c9b28c',

  glass: 'rgba(190,228,236,0.35)',
  glassEdge: '#9fd0dc',
} as const;

export const SKIN_TONES = ['#ffe0c4', '#f5c9a0', '#e0a878', '#c08458', '#8d5a3b', '#5e3a26'];
export const SKIN_SHADE: Record<string, string> = {
  '#ffe0c4': '#f2bfa0',
  '#f5c9a0': '#e0a878',
  '#e0a878': '#c08458',
  '#c08458': '#9a6440',
  '#8d5a3b': '#6e432a',
  '#5e3a26': '#45291a',
};

export const HAIR_COLORS = [
  '#2a1a1f', '#4a2e22', '#7a4a2a', '#b07a3a', '#e8c46a', '#f0e6d0',
  '#c0463b', '#e88aa8', '#8a6ac4', '#4a8ac4', '#4a9a6a', '#9a9aa8',
];

export const CLOTH_COLORS = [
  '#b5463b', '#d9734e', '#e2b04a', '#62a356', '#4a9a8f', '#5b85b8',
  '#2e3a5e', '#6e4a7a', '#d97a86', '#fbf1dc', '#5a5a66', '#2a1a1f',
];

/** Darken/lighten a hex color by amount (-1..1). */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  const h = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
