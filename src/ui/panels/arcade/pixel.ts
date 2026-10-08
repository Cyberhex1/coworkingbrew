// Tiny procedural pixel-art toolkit shared by every arcade game:
// a café palette, a 3x5 bitmap font, string-art sprites and a few
// primitives that always land on integer coordinates.

export type Ctx = CanvasRenderingContext2D;

/** Cozy café palette (matches the CSS design tokens). */
export const C = {
  ink: '#2a1a1f',
  ink2: '#3d2830',
  night: '#1d2033',
  night2: '#2e3a5e',
  plumDark: '#2a1f2a',
  cream: '#fbf1dc',
  paper2: '#f4e4c1',
  paper3: '#e6cf9f',
  paper4: '#c9b28c',
  white: '#ffffff',
  bean: '#8a5234',
  cocoa: '#5e3626',
  cocoa2: '#7a4830',
  espresso: '#3b2218',
  tomato: '#d9573f',
  terra: '#d9734e',
  terraDark: '#a8502f',
  gold: '#e2b04a',
  gold2: '#f7d97a',
  leaf: '#3f7d4a',
  leaf2: '#62a356',
  leaf3: '#9bd27a',
  mint: '#8fe3c4',
  teal: '#4a9a8f',
  sky: '#5b85b8',
  sky2: '#8cb4dc',
  sky3: '#c6dcef',
  plum: '#6e4a7a',
  lilac: '#a98ac4',
  rose: '#d97a86',
  pink: '#f0a8a8',
  grey: '#8a8a94',
  grey2: '#c9ccd2',
  char: '#241c1c',
} as const;

/** Palette for string-art sprites ('.' = transparent). */
export const SPRITE_PAL: Record<string, string> = {
  k: C.ink, K: C.char, w: C.white, c: C.cream, p: C.paper3, P: C.paper4,
  b: C.bean, B: C.cocoa, e: C.espresso, r: C.tomato, R: '#a83a2a', o: C.terra, O: C.terraDark,
  y: C.gold, Y: C.gold2, g: C.leaf2, G: C.leaf, h: C.leaf3, m: C.mint, s: C.sky, S: C.sky2,
  l: C.lilac, L: C.plum, n: C.pink, N: C.rose, x: C.grey, X: C.grey2, t: C.teal,
};

// ---------------------------------------------------------------- font
// 3x5 glyphs; each row is a 3-bit mask (4 = left, 2 = middle, 1 = right).
const GLYPHS: Record<string, number[]> = {
  '0': [7, 5, 5, 5, 7], '1': [2, 6, 2, 2, 7], '2': [7, 1, 7, 4, 7], '3': [7, 1, 3, 1, 7],
  '4': [5, 5, 7, 1, 1], '5': [7, 4, 7, 1, 7], '6': [7, 4, 7, 5, 7], '7': [7, 1, 1, 2, 2],
  '8': [7, 5, 7, 5, 7], '9': [7, 5, 7, 1, 7],
  A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6],
  E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4], G: [3, 4, 5, 5, 3], H: [5, 5, 7, 5, 5],
  I: [7, 2, 2, 2, 7], J: [1, 1, 1, 5, 2], K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7],
  M: [5, 7, 7, 5, 5], N: [6, 5, 5, 5, 5], O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4],
  Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5], S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2],
  U: [5, 5, 5, 5, 7], V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5],
  Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7],
  ' ': [0, 0, 0, 0, 0], ':': [0, 2, 0, 2, 0], '.': [0, 0, 0, 0, 2], ',': [0, 0, 0, 2, 4],
  '!': [2, 2, 2, 0, 2], '?': [6, 1, 2, 0, 2], '-': [0, 0, 7, 0, 0], '+': [0, 2, 7, 2, 0],
  '/': [1, 1, 2, 4, 4], '*': [5, 2, 7, 2, 5], '=': [0, 7, 0, 7, 0], "'": [2, 2, 0, 0, 0],
  '(': [1, 2, 2, 2, 1], ')': [4, 2, 2, 2, 4], '<': [1, 2, 4, 2, 1], '>': [4, 2, 1, 2, 4],
  '%': [5, 1, 2, 4, 5], '#': [5, 7, 5, 7, 5], x: [0, 5, 2, 5, 0],
};

export function textWidth(s: string, scale = 1) {
  return s.length ? (s.length * 4 - 1) * scale : 0;
}

export interface TextOpts {
  scale?: number;
  align?: 'left' | 'center' | 'right';
  shadow?: string;
}

/** Draw text with the built-in 3x5 bitmap font. Unknown chars render as blanks. */
export function text(ctx: Ctx, s: string, x: number, y: number, color: string, opts: TextOpts = {}) {
  const scale = opts.scale ?? 1;
  const str = s.toUpperCase().replace(/X(?=\d)/g, 'x');
  let ox = Math.round(x);
  const w = textWidth(str, scale);
  if (opts.align === 'center') ox = Math.round(x - w / 2);
  else if (opts.align === 'right') ox = Math.round(x - w);
  const oy = Math.round(y);
  if (opts.shadow) {
    const off = Math.max(1, Math.floor(scale / 2));
    drawGlyphs(ctx, str, ox + off, oy + off, opts.shadow, scale);
  }
  drawGlyphs(ctx, str, ox, oy, color, scale);
}

function drawGlyphs(ctx: Ctx, s: string, x: number, y: number, color: string, scale: number) {
  ctx.fillStyle = color;
  for (let i = 0; i < s.length; i++) {
    const g = GLYPHS[s[i]] ?? GLYPHS[s[i].toUpperCase()];
    if (!g) continue;
    const gx = x + i * 4 * scale;
    for (let r = 0; r < 5; r++) {
      const row = g[r];
      if (!row) continue;
      if (row & 4) ctx.fillRect(gx, y + r * scale, scale, scale);
      if (row & 2) ctx.fillRect(gx + scale, y + r * scale, scale, scale);
      if (row & 1) ctx.fillRect(gx + 2 * scale, y + r * scale, scale, scale);
    }
  }
}

// ---------------------------------------------------------------- sprites
export interface Sprite {
  w: number;
  h: number;
  img: HTMLCanvasElement;
}

/** Bake a string-art sprite once into an offscreen canvas. */
export function makeSprite(rows: string[], pal: Record<string, string> = SPRITE_PAL): Sprite {
  const h = rows.length;
  const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const img = document.createElement('canvas');
  img.width = Math.max(1, w);
  img.height = Math.max(1, h);
  const c = img.getContext('2d');
  if (c) {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = pal[row[x]];
        if (!col) continue;
        c.fillStyle = col;
        c.fillRect(x, y, 1, 1);
      }
    });
  }
  return { w, h, img };
}

/** Lazily baked sprite (canvas creation deferred until first draw). */
export function lazySprite(rows: string[], pal?: Record<string, string>) {
  let s: Sprite | null = null;
  return () => (s ??= makeSprite(rows, pal));
}

export function blit(ctx: Ctx, s: Sprite, x: number, y: number, flipX = false) {
  const rx = Math.round(x);
  const ry = Math.round(y);
  if (!flipX) {
    ctx.drawImage(s.img, rx, ry);
    return;
  }
  ctx.save();
  ctx.translate(rx + s.w, ry);
  ctx.scale(-1, 1);
  ctx.drawImage(s.img, 0, 0);
  ctx.restore();
}

// ---------------------------------------------------------------- primitives
export function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** 1px outlined box. */
export function box(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, line: string = C.ink) {
  rect(ctx, x, y, w, h, line);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, fill);
}

/** Box with notched (pixel-rounded) corners. */
export function notchBox(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, line: string = C.ink) {
  rect(ctx, x + 1, y, w - 2, h, line);
  rect(ctx, x, y + 1, w, h - 2, line);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, fill);
}

/** Filled pixel disc (midpoint-free: just tests distance per row). */
export function disc(ctx: Ctx, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35);
    ctx.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2 + 1, 1);
  }
}

export function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function rand(lo: number, hi: number) {
  return lo + Math.random() * (hi - lo);
}

export function randInt(lo: number, hi: number) {
  return Math.floor(rand(lo, hi + 1));
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------- particles
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  gravity: number;
}

export function burst(list: Particle[], x: number, y: number, colors: readonly string[], n = 8, speed = 40, gravity = 60) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.4 + Math.random() * 0.8);
    const life = 0.35 + Math.random() * 0.4;
    list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.3, life, max: life, color: pick(colors), size: Math.random() < 0.3 ? 2 : 1, gravity });
  }
}

export function stepParticles(list: Particle[], dt: number) {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.life -= dt;
    if (p.life <= 0) {
      list.splice(i, 1);
      continue;
    }
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

export function drawParticles(ctx: Ctx, list: Particle[]) {
  for (const p of list) rect(ctx, p.x, p.y, p.size, p.size, p.color);
}

/** Floating "+1" style labels. */
export interface Floater {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export function stepFloaters(list: Floater[], dt: number) {
  for (let i = list.length - 1; i >= 0; i--) {
    const f = list[i];
    f.life -= dt;
    f.y -= 14 * dt;
    if (f.life <= 0) list.splice(i, 1);
  }
}

export function drawFloaters(ctx: Ctx, list: Floater[]) {
  for (const f of list) {
    if (f.life < 0.15 && Math.floor(f.life * 40) % 2) continue;
    text(ctx, f.text, f.x, f.y, f.color, { align: 'center', shadow: C.ink });
  }
}

// ---------------------------------------------------------------- shared art
export const heartSprite = lazySprite([
  '.kk.kk.',
  'krrkrrk',
  'krYrrrk',
  'krrrrrk',
  '.krrrk.',
  '..krk..',
  '...k...',
]);

export const heartEmptySprite = lazySprite([
  '.kk.kk.',
  'kxxkxxk',
  'kxxxxxk',
  'kxxxxxk',
  '.kxxxk.',
  '..kxk..',
  '...k...',
]);
