import { C, burst, drawFloaters, drawParticles, rect, stepFloaters, stepParticles, text, type Ctx, type Floater, type Particle } from './pixel';
import { ARCADE_H, ARCADE_W, type GameApi, type GameDef, type GameInstance } from './types';

const W = ARCADE_W;
const H = ARCADE_H;
const BH = 8; // block height
const BASE_Y = 126; // top of base pot, in screen px at camera 0
const BASE_W = 64;
const MIN_W = 1;

interface Block {
  x: number;
  w: number;
  color: number;
}

interface Debris {
  x: number;
  y: number; // world y (screen y at camera 0)
  w: number;
  vx: number;
  vy: number;
  color: number;
}

const POTS = [
  { fill: C.terra, hi: '#ec9774', lo: C.terraDark },
  { fill: C.rose, hi: '#eaa0aa', lo: '#ad5864' },
  { fill: C.sky2, hi: '#b4d0ec', lo: C.sky },
  { fill: C.gold, hi: C.gold2, lo: '#b5862f' },
  { fill: C.mint, hi: '#c0f2df', lo: C.teal },
  { fill: C.lilac, hi: '#c9b3dc', lo: C.plum },
  { fill: C.cream, hi: C.white, lo: C.paper4 },
] as const;

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const SKY: { at: number; c: RGB }[] = [
  { at: 0, c: hex('#9cc4e4') },
  { at: 14, c: hex('#bfe0f0') },
  { at: 24, c: hex('#f7c98a') },
  { at: 34, c: hex('#d97a86') },
  { at: 46, c: hex('#6e4a7a') },
  { at: 60, c: hex('#2e3a5e') },
  { at: 80, c: hex('#1d2033') },
];

function skyAt(alt: number) {
  if (alt <= SKY[0].at) return SKY[0].c;
  for (let i = 1; i < SKY.length; i++) {
    const a = SKY[i - 1];
    const b = SKY[i];
    if (alt <= b.at) {
      const k = (alt - a.at) / (b.at - a.at);
      return a.c.map((v, j) => Math.round(v + (b.c[j] - v) * k)) as RGB;
    }
  }
  return SKY[SKY.length - 1].c;
}

/** Stable pseudo-random per (layer, salt). */
function hash(n: number, salt = 0) {
  const s = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function drawPot(ctx: Ctx, b: Block, y: number, layer: number) {
  const pal = POTS[b.color % POTS.length];
  const x = Math.round(b.x);
  const w = Math.round(b.w);
  if (w <= 0) return;
  rect(ctx, x, y, w, BH, C.ink);
  if (w > 2) {
    rect(ctx, x + 1, y + 1, w - 2, BH - 2, pal.fill);
    rect(ctx, x + 1, y + 1, w - 2, 1, pal.hi);
    rect(ctx, x + 1, y + BH - 2, w - 2, 1, pal.lo);
    // decoration band
    const deco = layer % 3;
    if (w > 6) {
      if (deco === 0) for (let i = x + 3; i < x + w - 2; i += 4) rect(ctx, i, y + 3, 2, 2, pal.hi);
      else if (deco === 1) rect(ctx, x + 2, y + 4, w - 4, 1, pal.lo);
      else for (let i = x + 2; i < x + w - 2; i += 3) rect(ctx, i, y + 3 + (i % 2), 1, 1, pal.lo);
    }
  }
  // dangling vines from pot edges
  if (w > 4) {
    const leaves = [C.leaf, C.leaf2, C.leaf3];
    for (const side of [0, 1]) {
      if (hash(layer, side) < 0.45) continue;
      const vx = side ? x + w - 2 : x + 1;
      const len = 2 + Math.floor(hash(layer, side + 4) * 5);
      for (let i = 0; i < len; i++) {
        const lx = vx + (i % 2 ? (side ? 1 : -1) : 0);
        rect(ctx, lx, y + 1 + i, 1, 1, leaves[(i + layer) % 3]);
      }
      rect(ctx, vx + (side ? 1 : -1), y + len, 2, 1, C.leaf2);
    }
  }
}

function drawSprout(ctx: Ctx, cx: number, topY: number, height: number, t: number) {
  const sway = Math.round(Math.sin(t * 2) * 0.8);
  const stem = Math.min(14, 4 + Math.floor(height / 3));
  for (let i = 0; i < stem; i++) rect(ctx, cx + (i > stem / 2 ? sway : 0), topY - i - 1, 1, 1, C.leaf);
  const tx = cx + sway;
  const ty = topY - stem;
  rect(ctx, tx - 3, ty + 2, 3, 2, C.leaf2);
  rect(ctx, tx + 1, ty + 1, 3, 2, C.leaf2);
  rect(ctx, tx - 2, ty + 2, 1, 1, C.leaf3);
  if (height >= 10) {
    // flower!
    const petal = height >= 30 ? C.gold2 : height >= 20 ? C.lilac : C.pink;
    rect(ctx, tx - 1, ty - 3, 3, 1, petal);
    rect(ctx, tx - 2, ty - 2, 5, 1, petal);
    rect(ctx, tx - 1, ty - 1, 3, 1, petal);
    rect(ctx, tx, ty - 2, 1, 1, C.gold);
  }
}

class PlantStack implements GameInstance {
  private stack: Block[] = [{ x: (W - BASE_W) / 2, w: BASE_W, color: 0 }];
  private cur: Block;
  private dir = 1;
  private speed = 55;
  private cam = 0;
  private debris: Debris[] = [];
  private parts: Particle[] = [];
  private floats: Floater[] = [];
  private combo = 0;
  private cooldown = 0;
  private dying = -1;
  private shake = 0;
  private flash = 0;

  constructor(private api: GameApi) {
    this.cur = { x: 0, w: BASE_W, color: 1 };
    this.spawn();
  }

  private get height() {
    return this.stack.length - 1;
  }

  private spawn() {
    const top = this.stack[this.stack.length - 1];
    this.dir = this.stack.length % 2 ? 1 : -1;
    this.cur = { x: this.dir > 0 ? -top.w * 0.5 : W - top.w * 0.5, w: top.w, color: this.stack.length % POTS.length };
    this.speed = Math.min(165, 55 + this.height * 3.8);
  }

  private layerY(i: number) {
    return BASE_Y - i * BH + Math.round(this.cam);
  }

  private drop() {
    if (this.cooldown > 0 || this.dying >= 0) return;
    this.cooldown = 0.12;
    const top = this.stack[this.stack.length - 1];
    const c = this.cur;
    const worldY = BASE_Y - this.stack.length * BH;
    const lo = Math.max(c.x, top.x);
    const hi = Math.min(c.x + c.w, top.x + top.w);
    const overlap = hi - lo;
    if (overlap < MIN_W) {
      this.debris.push({ x: c.x, y: worldY, w: c.w, vx: this.dir * 20, vy: 0, color: c.color });
      this.dying = 0;
      this.shake = 0.35;
      this.flash = 0.25;
      this.api.sfx('error');
      return;
    }
    const cx = lo + overlap / 2;
    if (Math.abs(c.x - top.x) <= 2) {
      // perfect drop
      this.combo++;
      let w = top.w;
      if (this.combo >= 3) w = Math.min(BASE_W, w + 4);
      const x = Math.max(2, Math.min(W - 2 - w, top.x - (w - top.w) / 2));
      this.stack.push({ x, w, color: c.color });
      burst(this.parts, cx, this.layerY(this.stack.length - 1), [C.white, C.gold2, C.leaf3], 12, 45, 30);
      this.floats.push({ x: cx, y: this.layerY(this.stack.length - 1) - 8, text: this.combo >= 3 ? 'PERFECT! GROW' : 'PERFECT!', color: C.gold2, life: 0.8 });
      this.api.sfx('success');
    } else {
      this.combo = 0;
      // trimmed overhang
      if (c.x < top.x) this.debris.push({ x: c.x, y: worldY, w: top.x - c.x, vx: -25, vy: -10, color: c.color });
      if (c.x + c.w > top.x + top.w) this.debris.push({ x: top.x + top.w, y: worldY, w: c.x + c.w - (top.x + top.w), vx: 25, vy: -10, color: c.color });
      this.stack.push({ x: lo, w: overlap, color: c.color });
      burst(this.parts, cx, this.layerY(this.stack.length - 1) + BH, [C.cocoa2, C.leaf2], 5, 25, 60);
      this.api.sfx('pop');
    }
    this.spawn();
  }

  update(dt: number) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt);
    stepParticles(this.parts, dt);
    stepFloaters(this.floats, dt);
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.vy += 260 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y + this.cam > H + 20) this.debris.splice(i, 1);
    }
    const targetCam = Math.max(0, this.stack.length * BH - 72);
    this.cam += (targetCam - this.cam) * Math.min(1, dt * 5);

    if (this.dying >= 0) {
      this.dying += dt;
      if (this.dying > 1.3 && this.dying < 99) {
        this.dying = 99;
        this.api.end(this.height, [`TOWER: ${this.height} POTS`, `TOP WIDTH: ${Math.round(this.stack[this.stack.length - 1].w)}PX`]);
      }
      return;
    }
    const c = this.cur;
    c.x += this.dir * this.speed * dt;
    const minX = -c.w * 0.6;
    const maxX = W - c.w * 0.4;
    if (c.x > maxX) {
      c.x = maxX;
      this.dir = -1;
    } else if (c.x < minX) {
      c.x = minX;
      this.dir = 1;
    }
  }

  draw(ctx: Ctx, t: number) {
    ctx.save();
    if (this.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), 0);
    const cam = Math.round(this.cam);
    // sky in 8px bands by altitude
    for (let y = -8; y < H + 8; y += 4) {
      const alt = (BASE_Y + cam - y) / BH;
      const [r, g, b] = skyAt(alt);
      rect(ctx, 0, y, W, 4, `rgb(${r},${g},${b})`);
    }
    // stars high up
    for (let i = 0; i < 40; i++) {
      const sy = Math.floor(hash(i, 1) * 600);
      const y = BASE_Y - 360 - sy + cam;
      if (y < -2 || y > H) continue;
      const x = Math.floor(hash(i, 2) * W);
      const tw = Math.floor(t * 2 + i) % 5 === 0;
      rect(ctx, x, y, 1, 1, tw ? C.gold2 : C.white);
    }
    // clouds
    for (let i = 0; i < 6; i++) {
      const cy = BASE_Y - 30 - i * 46 + Math.round(cam * 0.6);
      if (cy < -10 || cy > H + 10) continue;
      const cx = Math.round(((hash(i, 3) * W + t * (4 + i)) % (W + 40)) - 20);
      const col = i > 3 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.85)';
      rect(ctx, cx, cy, 18, 4, col);
      rect(ctx, cx + 4, cy - 3, 9, 3, col);
    }
    // ground: café garden
    const gy = BASE_Y + BH + cam;
    if (gy < H) {
      rect(ctx, 0, gy - 10, W, 10, '#b98b6a');
      for (let x = 0; x < W; x += 10) rect(ctx, x, gy - 10, 9, 4, '#c99a78');
      for (let x = 5; x < W; x += 10) rect(ctx, x, gy - 5, 9, 4, '#c99a78');
      rect(ctx, 0, gy, W, H, C.leaf);
      rect(ctx, 0, gy, W, 2, C.leaf2);
      for (let x = 2; x < W; x += 7) rect(ctx, x, gy - 2, 1, 2, C.leaf2);
      rect(ctx, 0, gy + 6, W, H, C.cocoa);
    }

    // tower
    this.stack.forEach((b, i) => {
      const y = this.layerY(i);
      if (y > H || y < -BH) return;
      if (i === 0) {
        // base: big terracotta pot
        rect(ctx, b.x - 2, y - 1, b.w + 4, 4, C.ink);
        rect(ctx, b.x - 1, y, b.w + 2, 2, C.terra);
        rect(ctx, b.x + 2, y + 3, b.w - 4, BH - 1, C.ink);
        rect(ctx, b.x + 3, y + 3, b.w - 6, BH - 2, C.terraDark);
        text(ctx, 'CAFE', b.x + b.w / 2, y + 4, C.paper3, { align: 'center' });
        return;
      }
      drawPot(ctx, b, y, i);
    });
    const top = this.stack[this.stack.length - 1];
    if (this.dying < 0) {
      // sprout lives on the top pot
      drawSprout(ctx, Math.round(top.x + top.w / 2), this.layerY(this.stack.length - 1), this.height, t);
      // moving block + guide shadow
      const cy = this.layerY(this.stack.length);
      drawPot(ctx, this.cur, cy, this.stack.length);
      const gx = Math.round(this.cur.x);
      rect(ctx, gx, cy + BH, Math.round(this.cur.w), 1, 'rgba(42,26,31,0.25)');
    } else {
      drawSprout(ctx, Math.round(top.x + top.w / 2), this.layerY(this.stack.length - 1), this.height, t);
    }
    for (const d of this.debris) drawPot(ctx, { x: d.x, w: d.w, color: d.color }, Math.round(d.y + cam), 0);

    drawParticles(ctx, this.parts);
    drawFloaters(ctx, this.floats);
    ctx.restore();
    if (this.flash > 0) {
      ctx.fillStyle = 'rgba(217,87,63,0.3)';
      ctx.fillRect(0, 0, W, H);
    }

    // HUD
    text(ctx, String(this.height), W / 2, 6, C.white, { align: 'center', scale: 3, shadow: C.ink });
    text(ctx, 'HEIGHT', W / 2, 24, C.cream, { align: 'center', shadow: C.ink });
    text(ctx, `BEST ${Math.max(this.api.best, this.height)}`, W - 4, 4, C.gold2, { align: 'right', shadow: C.ink });
    if (this.combo >= 2) text(ctx, `PERFECT X${this.combo}`, 4, 4, C.gold2, { shadow: C.ink });
  }

  keyDown(key: string) {
    if (key === ' ' || key === 'Enter' || key === 'ArrowDown' || key === 'ArrowUp' || key === 's' || key === 'S') {
      this.drop();
      return true;
    }
    return false;
  }

  pointerDown() {
    this.drop();
  }
}

export const plantStack: GameDef = {
  id: 'stack',
  name: 'Plant Stack',
  tagline: 'Grow the tallest planter tower.',
  howTo: [
    'Drop the sliding planter onto the tower. The overhang gets trimmed!',
    'Perfect drops keep the full width. Three in a row grows it back.',
    'Miss completely and the tower is done. Score = height.',
  ],
  controls: [
    [['Space'], 'drop'],
    [['tap'], 'drop'],
  ],
  scoreLabel: 'Height',
  accent: C.leaf2,
  reward: (s) => (s >= 40 ? 5 : s >= 28 ? 4 : s >= 18 ? 3 : s >= 10 ? 2 : s >= 5 ? 1 : 0),
  create: (api) => new PlantStack(api),
  thumb: (ctx) => {
    rect(ctx, 0, 0, 64, 48, '#bfe0f0');
    rect(ctx, 0, 20, 64, 28, '#f7c98a');
    rect(ctx, 0, 34, 64, 14, '#e7b07c');
    rect(ctx, 6, 8, 12, 3, C.white);
    rect(ctx, 9, 6, 6, 2, C.white);
    rect(ctx, 0, 44, 64, 4, C.leaf);
    const blocks: Block[] = [
      { x: 18, w: 28, color: 0 }, { x: 19, w: 26, color: 1 }, { x: 21, w: 24, color: 2 }, { x: 21, w: 22, color: 3 },
    ];
    blocks.forEach((b, i) => drawPot(ctx, b, 36 - i * 8, i + 1));
    drawPot(ctx, { x: 42, w: 20, color: 4 }, 1, 5);
    drawSprout(ctx, 32, 12, 12, 0);
  },
};
