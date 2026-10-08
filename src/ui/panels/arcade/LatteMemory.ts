import { C, burst, disc, drawParticles, makeSprite, notchBox, rect, shuffle, stepParticles, text, type Ctx, type Particle, type Sprite } from './pixel';
import { ARCADE_H, ARCADE_W, type GameApi, type GameDef, type GameInstance } from './types';

const W = ARCADE_W;
const H = ARCADE_H;
const CW = 26;
const CH = 28;
const GAP = 4;
const COLS = 4;
const ROWS = 4;
const GX = Math.round((W - (COLS * CW + (COLS - 1) * GAP)) / 2);
const GY = 15;

// 11x11 latte-art patterns, poured in milk foam ('c') over crema.
const ART: Record<string, string[]> = {
  heart: [
    '...........',
    '..cc...cc..',
    '.cccc.cccc.',
    '.ccccccccc.',
    '.ccccccccc.',
    '..ccccccc..',
    '...ccccc...',
    '....ccc....',
    '.....c.....',
    '.....c.....',
    '...........',
  ],
  leaf: [
    '.....c.....',
    '....ccc....',
    '...cc.cc...',
    '..c..c..c..',
    '.cc..c..cc.',
    '.c..ccc..c.',
    '.cc..c..cc.',
    '..cc.c.cc..',
    '...ccccc...',
    '.....c.....',
    '.....c.....',
  ],
  swan: [
    '..ccc......',
    '.cc.c......',
    '....c......',
    '....c......',
    '...c....c..',
    '...c...cc..',
    '...c.cccc..',
    '...ccccccc.',
    '....cccccc.',
    '.....cccc..',
    '...........',
  ],
  star: [
    '.....c.....',
    '....ccc....',
    '....ccc....',
    'ccccccccccc',
    '.ccccccccc.',
    '..ccccccc..',
    '..ccccccc..',
    '.cccc.cccc.',
    '.ccc...ccc.',
    '.cc.....cc.',
    '...........',
  ],
  bear: [
    '...........',
    '.cc.....cc.',
    'ccccccccccc',
    '.ccccccccc.',
    'cc.ccccc.cc',
    'ccccccccccc',
    'cccpppppccc',
    'cccppBppccc',
    '.ccpppppcc.',
    '..ccccccc..',
    '...........',
  ],
  cat: [
    'c.........c',
    'cc.......cc',
    'ccccccccccc',
    'ccccccccccc',
    'cc.ccccc.cc',
    'ccccccccccc',
    'ccccc.ccccc',
    '.ccc.c.ccc.',
    '..ccccccc..',
    '...........',
    '...........',
  ],
  tulip: [
    '..c..c..c..',
    '..cc.c.cc..',
    '...ccccc...',
    '..ccccccc..',
    '...ccccc...',
    '....ccc....',
    '.....c.....',
    '..c..c..c..',
    '...c.c.c...',
    '....ccc....',
    '.....c.....',
  ],
  moon: [
    '...cccc....',
    '.cccc......',
    '.ccc....c..',
    'ccc....ccc.',
    'ccc.....c..',
    'ccc........',
    'ccc........',
    '.ccc....cc.',
    '.cccccccc..',
    '...cccc....',
    '...........',
  ],
};

const KINDS = Object.keys(ART);
const ART_PAL: Record<string, string> = { c: C.cream, p: C.paper3, B: C.cocoa };

interface Card {
  kind: number;
  up: boolean;
  matched: boolean;
  flip: number; // 0 = back, 1 = face
  glow: number;
}

interface Faces {
  back: Sprite;
  faces: Sprite[];
  matched: Sprite[];
}

let facesCache: Faces | null = null;

function bakeCard(draw: (c: Ctx) => void): Sprite {
  const img = document.createElement('canvas');
  img.width = CW;
  img.height = CH;
  const c = img.getContext('2d');
  if (c) {
    c.imageSmoothingEnabled = false;
    draw(c);
  }
  return { w: CW, h: CH, img };
}

function drawFace(c: Ctx, kind: number, matched: boolean) {
  notchBox(c, 0, 0, CW, CH, matched ? '#e8f4dc' : C.cream, matched ? C.leaf : C.ink);
  rect(c, 2, CH - 3, CW - 4, 1, matched ? '#cfe6bf' : C.paper3);
  const cx = Math.floor(CW / 2);
  const cy = 13;
  disc(c, cx, cy + 1, 11, C.paper4); // saucer shadow
  disc(c, cx, cy, 11, C.white);
  disc(c, cx, cy, 9, C.paper2);
  disc(c, cx, cy, 8, C.cocoa2);
  disc(c, cx, cy, 7, C.bean);
  const art = makeSprite(ART[KINDS[kind]], ART_PAL);
  c.drawImage(art.img, cx - 5, cy - 5);
}

function drawBack(c: Ctx) {
  notchBox(c, 0, 0, CW, CH, C.cocoa2, C.ink);
  rect(c, 2, 2, CW - 4, CH - 4, C.cocoa);
  rect(c, 3, 3, CW - 6, CH - 6, C.cocoa2);
  for (let y = 5; y < CH - 4; y += 4) for (let x = 5 + ((y / 4) % 2) * 2; x < CW - 4; x += 4) rect(c, x, y, 1, 1, '#8d5838');
  // bean emblem
  const cx = 13;
  const cy = 14;
  rect(c, cx - 3, cy - 5, 6, 10, C.ink);
  rect(c, cx - 4, cy - 4, 8, 8, C.ink);
  rect(c, cx - 3, cy - 4, 6, 8, C.gold);
  rect(c, cx - 2, cy - 5 + 1, 4, 8, C.gold);
  rect(c, cx, cy - 3, 1, 2, C.cocoa);
  rect(c, cx - 1, cy - 1, 1, 2, C.cocoa);
  rect(c, cx, cy + 1, 1, 2, C.cocoa);
  rect(c, cx - 2, cy - 3, 1, 2, C.gold2);
  rect(c, 2, CH - 3, CW - 4, 1, C.espresso);
}

function faces(): Faces {
  if (facesCache) return facesCache;
  facesCache = {
    back: bakeCard(drawBack),
    faces: KINDS.map((_, i) => bakeCard((c) => drawFace(c, i, false))),
    matched: KINDS.map((_, i) => bakeCard((c) => drawFace(c, i, true))),
  };
  return facesCache;
}

function cardPos(i: number) {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return { x: GX + col * (CW + GAP), y: GY + row * (CH + GAP) };
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

export function memoryScore(moves: number, seconds: number) {
  return Math.max(50, Math.round(1200 - Math.max(0, moves - 8) * 35 - Math.floor(seconds) * 4));
}

class LatteMemory implements GameInstance {
  private cards: Card[];
  private open: number[] = [];
  private hideIn = 0;
  private moves = 0;
  private pairs = 0;
  private time = 0;
  private started = false;
  private done = -1;
  private cursor = 0;
  private showCursor = false;
  private hover = -1;
  private parts: Particle[] = [];

  constructor(private api: GameApi) {
    const deck = shuffle([...KINDS.keys(), ...KINDS.keys()]);
    this.cards = deck.map((kind) => ({ kind, up: false, matched: false, flip: 0, glow: 0 }));
  }

  private hideOpen() {
    for (const i of this.open) this.cards[i].up = false;
    this.open = [];
    this.hideIn = 0;
  }

  private choose(i: number) {
    if (this.done >= 0 || i < 0 || i >= this.cards.length) return;
    if (this.open.length === 2) {
      this.hideOpen();
      this.api.sfx('whoosh');
    }
    const card = this.cards[i];
    if (card.matched || card.up) return;
    this.started = true;
    card.up = true;
    this.open.push(i);
    this.api.sfx('click');
    if (this.open.length < 2) return;
    this.moves++;
    const [a, b] = this.open;
    if (this.cards[a].kind === this.cards[b].kind) {
      for (const j of this.open) {
        this.cards[j].matched = true;
        this.cards[j].glow = 1;
        const p = cardPos(j);
        burst(this.parts, p.x + CW / 2, p.y + CH / 2, [C.gold2, C.white, C.mint, C.pink], 10, 50, 40);
      }
      this.open = [];
      this.pairs++;
      if (this.pairs === KINDS.length) {
        this.done = 0;
        this.api.sfx('coin');
      } else {
        this.api.sfx('success');
      }
    } else {
      this.hideIn = 0.8;
    }
  }

  update(dt: number) {
    if (this.started && this.done < 0) this.time += dt;
    stepParticles(this.parts, dt);
    for (const c of this.cards) {
      const target = c.up || c.matched ? 1 : 0;
      if (c.flip < target) c.flip = Math.min(1, c.flip + dt * 6);
      else if (c.flip > target) c.flip = Math.max(0, c.flip - dt * 6);
      c.glow = Math.max(0, c.glow - dt * 1.5);
    }
    if (this.hideIn > 0) {
      this.hideIn -= dt;
      if (this.hideIn <= 0) {
        this.hideOpen();
        this.api.sfx('whoosh');
      }
    }
    if (this.done >= 0) {
      this.done += dt;
      if (this.done > 0.6 && this.done - dt <= 0.6) {
        for (let i = 0; i < 4; i++) burst(this.parts, 30 + i * 44, 60, [C.gold2, C.pink, C.mint, C.sky2, C.white], 12, 60, 50);
      }
      if (this.done > 1.4 && this.done < 99) {
        this.done = 99;
        const score = memoryScore(this.moves, this.time);
        this.api.end(score, [`MOVES: ${this.moves}`, `TIME: ${fmtTime(this.time)}`]);
      }
    }
  }

  draw(ctx: Ctx, t: number) {
    // table cloth
    rect(ctx, 0, 0, W, H, '#7a4a3a');
    for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 ? 0 : 8; x < W; x += 16) rect(ctx, x, y, 8, 8, '#84523f');
    // side deco: menu boards
    this.drawSide(ctx, 4, t, ['LATTE', 'ART'], C.gold2);
    this.drawSide(ctx, W - 34, t, ['FIND', 'PAIRS'], C.mint);

    const f = faces();
    this.cards.forEach((c, i) => {
      const p = cardPos(i);
      const lift = i === this.hover && !c.matched && !c.up && this.done < 0 ? 1 : 0;
      const showFace = c.flip >= 0.5;
      const k = Math.abs(Math.cos(c.flip * Math.PI));
      const w = Math.max(2, Math.round(CW * k / 2) * 2);
      const x = p.x + (CW - w) / 2;
      rect(ctx, p.x + 1, p.y + CH, CW - 2, 1, 'rgba(0,0,0,0.25)');
      const s = showFace ? (c.matched && c.flip >= 1 ? f.matched[c.kind] : f.faces[c.kind]) : f.back;
      ctx.drawImage(s.img, 0, 0, CW, CH, Math.round(x), p.y - lift, w, CH);
      if (c.glow > 0 && Math.floor(c.glow * 12) % 2) {
        rect(ctx, p.x - 1, p.y - 1, CW + 2, 1, C.gold2);
        rect(ctx, p.x - 1, p.y + CH, CW + 2, 1, C.gold2);
        rect(ctx, p.x - 1, p.y - 1, 1, CH + 2, C.gold2);
        rect(ctx, p.x + CW, p.y - 1, 1, CH + 2, C.gold2);
      }
      if (this.showCursor && i === this.cursor && this.done < 0) {
        const blink = Math.floor(t * 4) % 2 ? C.gold2 : C.white;
        rect(ctx, p.x - 2, p.y - 2, CW + 4, 1, blink);
        rect(ctx, p.x - 2, p.y + CH + 1, CW + 4, 1, blink);
        rect(ctx, p.x - 2, p.y - 2, 1, CH + 4, blink);
        rect(ctx, p.x + CW + 1, p.y - 2, 1, CH + 4, blink);
      }
    });
    drawParticles(ctx, this.parts);

    // HUD
    rect(ctx, 0, 0, W, 11, 'rgba(42,26,31,0.85)');
    text(ctx, `MOVES ${this.moves}`, 4, 3, C.cream);
    text(ctx, `PAIRS ${this.pairs}/${KINDS.length}`, W / 2, 3, C.gold2, { align: 'center' });
    text(ctx, fmtTime(this.time), W - 4, 3, C.mint, { align: 'right' });

    if (this.done >= 0) {
      const y = 62;
      rect(ctx, 30, y - 6, W - 60, 17, C.ink);
      rect(ctx, 31, y - 5, W - 62, 15, C.leaf);
      text(ctx, 'ALL MATCHED!', W / 2, y, C.cream, { align: 'center', shadow: C.ink });
    }
  }

  private drawSide(ctx: Ctx, x: number, t: number, lines: string[], color: string) {
    rect(ctx, x, 30, 30, 28, C.ink);
    rect(ctx, x + 1, 31, 28, 26, '#2f3b33');
    lines.forEach((l, i) => text(ctx, l, x + 15, 36 + i * 8, color, { align: 'center' }));
    rect(ctx, x + 4, 58, 2, 6, C.cocoa);
    rect(ctx, x + 24, 58, 2, 6, C.cocoa);
    // little cup with steam
    const cy = 100;
    rect(ctx, x + 8, cy, 14, 10, C.ink);
    rect(ctx, x + 9, cy + 1, 12, 8, C.cream);
    rect(ctx, x + 9, cy + 1, 12, 2, C.bean);
    rect(ctx, x + 21, cy + 3, 3, 4, C.ink);
    rect(ctx, x + 6, cy + 10, 18, 2, C.ink);
    const s = Math.floor(t * 3) % 3;
    rect(ctx, x + 12, cy - 4 - s, 1, 2, 'rgba(255,255,255,0.6)');
    rect(ctx, x + 17, cy - 6 + s, 1, 2, 'rgba(255,255,255,0.5)');
  }

  private indexAt(x: number, y: number) {
    for (let i = 0; i < this.cards.length; i++) {
      const p = cardPos(i);
      if (x >= p.x - 1 && x < p.x + CW + 1 && y >= p.y - 1 && y < p.y + CH + 1) return i;
    }
    return -1;
  }

  keyDown(key: string) {
    const col = this.cursor % COLS;
    const row = Math.floor(this.cursor / COLS);
    let handled = true;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.cursor = row * COLS + ((col + COLS - 1) % COLS);
    else if (key === 'ArrowRight' || key === 'd' || key === 'D') this.cursor = row * COLS + ((col + 1) % COLS);
    else if (key === 'ArrowUp' || key === 'w' || key === 'W') this.cursor = ((row + ROWS - 1) % ROWS) * COLS + col;
    else if (key === 'ArrowDown' || key === 's' || key === 'S') this.cursor = ((row + 1) % ROWS) * COLS + col;
    else if (key === ' ' || key === 'Enter') {
      if (this.showCursor) this.choose(this.cursor);
    } else handled = false;
    if (handled) this.showCursor = true;
    return handled;
  }

  pointerDown(x: number, y: number) {
    const i = this.indexAt(x, y);
    this.showCursor = false;
    if (i >= 0) {
      this.cursor = i;
      this.choose(i);
    }
  }

  pointerMove(x: number, y: number) {
    this.hover = this.indexAt(x, y);
  }
}

export const latteMemory: GameDef = {
  id: 'memory',
  name: 'Latte Art Memory',
  tagline: 'Match the latte art pairs.',
  howTo: [
    'Flip two cups at a time to find matching latte art.',
    'Clear all 8 pairs. Fewer moves and a faster time score higher.',
  ],
  controls: [
    [['click'], 'flip a cup'],
    [['←', '↑', '↓', '→'], 'move cursor'],
    [['Space'], 'flip'],
  ],
  scoreLabel: 'Score',
  accent: C.gold,
  reward: (s) => (s >= 1000 ? 5 : s >= 820 ? 4 : s >= 620 ? 3 : s >= 400 ? 2 : 1),
  create: (api) => new LatteMemory(api),
  thumb: (ctx) => {
    rect(ctx, 0, 0, 64, 48, '#7a4a3a');
    const f = faces();
    for (let y = 0; y < 48; y += 8) for (let x = (y / 8) % 2 ? 0 : 8; x < 64; x += 16) rect(ctx, x, y, 8, 8, '#84523f');
    ctx.drawImage(f.back.img, 2, 13);
    ctx.drawImage(f.faces[5].img, 36, 13);
    ctx.drawImage(f.faces[0].img, 19, 6);
  },
};
