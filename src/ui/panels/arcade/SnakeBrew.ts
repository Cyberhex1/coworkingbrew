import { C, burst, disc, drawFloaters, drawParticles, rect, stepFloaters, stepParticles, text, type Ctx, type Floater, type Particle } from './pixel';
import { ARCADE_H, ARCADE_W, type GameApi, type GameDef, type GameInstance, type SwipeDir } from './types';

const W = ARCADE_W;
const H = ARCADE_H;
const COLS = 16;
const ROWS = 12;
const CELL = 10;
const BX = Math.round((W - COLS * CELL) / 2);
const BY = 17;

interface Pt {
  x: number;
  y: number;
}

const DIRS: Record<SwipeDir, Pt> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const BODY = [C.gold, '#e9c27a', C.paper3, C.cream] as const;

function drawCherry(ctx: Ctx, px: number, py: number, bob: number) {
  const cx = px + 5;
  const cy = py + 6 + bob;
  rect(ctx, cx - 3, py + 9, 7, 1, 'rgba(0,0,0,0.15)');
  rect(ctx, cx, cy - 6, 1, 3, C.leaf);
  rect(ctx, cx + 1, cy - 6, 2, 1, C.leaf2);
  rect(ctx, cx + 2, cy - 7, 2, 1, C.leaf2);
  disc(ctx, cx, cy, 3, C.ink);
  disc(ctx, cx, cy, 2, C.tomato);
  rect(ctx, cx - 1, cy - 1, 1, 1, C.pink);
  rect(ctx, cx + 1, cy + 1, 1, 1, '#a83a2a');
}

function drawGoldBean(ctx: Ctx, px: number, py: number, t: number) {
  const x = px + 2;
  const y = py + 1;
  rect(ctx, x + 1, y, 4, 8, C.ink);
  rect(ctx, x, y + 1, 6, 6, C.ink);
  rect(ctx, x + 1, y + 1, 4, 6, C.gold);
  rect(ctx, x + 2, y + 1, 2, 1, C.gold2);
  rect(ctx, x + 3, y + 2, 1, 2, C.cocoa2);
  rect(ctx, x + 2, y + 4, 1, 2, C.cocoa2);
  if (Math.floor(t * 6) % 2) rect(ctx, x + 6, y - 1, 1, 1, C.white);
}

class SnakeBrew implements GameInstance {
  private snake: Pt[];
  private dir: Pt = { x: 1, y: 0 };
  private queue: Pt[] = [];
  private food: Pt;
  private bonus: (Pt & { ttl: number }) | null = null;
  private step = 0;
  private interval = 0.17;
  private score = 0;
  private eaten = 0;
  private dying = -1;
  private parts: Particle[] = [];
  private floats: Floater[] = [];
  private grow = 0;
  private time = 0;
  private bonusIn = 6;

  constructor(private api: GameApi) {
    const y = Math.floor(ROWS / 2);
    this.snake = [{ x: 5, y }, { x: 4, y }, { x: 3, y }];
    this.food = this.freeCell() ?? { x: 10, y };
  }

  private occupied(p: Pt) {
    return this.snake.some((s) => s.x === p.x && s.y === p.y);
  }

  private freeCell(): Pt | null {
    const free: Pt[] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const p = { x, y };
        if (this.occupied(p)) continue;
        if (this.food && this.food.x === x && this.food.y === y) continue;
        if (this.bonus && this.bonus.x === x && this.bonus.y === y) continue;
        free.push(p);
      }
    }
    return free.length ? free[Math.floor(Math.random() * free.length)] : null;
  }

  private turn(d: Pt) {
    const last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    if (last.x === d.x && last.y === d.y) return;
    if (last.x === -d.x && last.y === -d.y) return;
    if (this.queue.length < 3) this.queue.push(d);
  }

  private die() {
    this.dying = 0;
    this.api.sfx('error');
    const h = this.snake[0];
    burst(this.parts, BX + h.x * CELL + 5, BY + h.y * CELL + 5, [C.cocoa, C.gold, C.cream], 16, 50, 40);
  }

  update(dt: number) {
    this.time += dt;
    stepParticles(this.parts, dt);
    stepFloaters(this.floats, dt);
    if (this.dying >= 0) {
      this.dying += dt;
      if (this.dying > 1 && this.dying < 99) {
        this.dying = 99;
        this.api.end(this.score, [`CHERRIES: ${this.eaten}`, `LENGTH: ${this.snake.length}`]);
      }
      return;
    }

    if (this.bonus) {
      this.bonus.ttl -= dt;
      if (this.bonus.ttl <= 0) this.bonus = null;
    } else {
      this.bonusIn -= dt;
      if (this.bonusIn <= 0 && this.eaten >= 3) {
        const p = this.freeCell();
        if (p) this.bonus = { ...p, ttl: 6 };
        this.bonusIn = 14 + Math.random() * 8;
      }
    }

    this.step += dt;
    while (this.step >= this.interval && this.dying < 0) {
      this.step -= this.interval;
      this.advance();
    }
  }

  private advance() {
    const next = this.queue.shift();
    if (next) this.dir = next;
    const head = this.snake[0];
    const nh = { x: head.x + this.dir.x, y: head.y + this.dir.y };
    if (nh.x < 0 || nh.y < 0 || nh.x >= COLS || nh.y >= ROWS) {
      this.die();
      return;
    }
    const tailMoves = this.grow === 0;
    const body = tailMoves ? this.snake.slice(0, -1) : this.snake;
    if (body.some((s) => s.x === nh.x && s.y === nh.y)) {
      this.die();
      return;
    }
    this.snake.unshift(nh);
    if (this.grow > 0) this.grow--;
    else this.snake.pop();

    const cx = BX + nh.x * CELL + 5;
    const cy = BY + nh.y * CELL + 5;
    if (nh.x === this.food.x && nh.y === this.food.y) {
      this.eaten++;
      this.score += 10;
      this.grow += 1;
      this.interval = Math.max(0.075, this.interval - 0.0045);
      burst(this.parts, cx, cy, [C.tomato, C.pink, C.leaf2], 9, 40);
      this.floats.push({ x: cx, y: cy - 8, text: '+10', color: C.white, life: 0.6 });
      this.api.sfx('pop');
      const f = this.freeCell();
      if (!f) {
        this.dying = 0;
        return;
      }
      this.food = f;
    }
    if (this.bonus && nh.x === this.bonus.x && nh.y === this.bonus.y) {
      this.score += 50;
      this.grow += 2;
      this.bonus = null;
      burst(this.parts, cx, cy, [C.gold, C.gold2, C.white], 14, 55);
      this.floats.push({ x: cx, y: cy - 8, text: '+50', color: C.gold2, life: 0.9 });
      this.api.sfx('coin');
    }
  }

  draw(ctx: Ctx, t: number) {
    rect(ctx, 0, 0, W, H, C.cocoa);
    for (let x = 0; x < W; x += 6) rect(ctx, x, 0, 3, H, '#6a3d2a');
    // board
    rect(ctx, BX - 3, BY - 3, COLS * CELL + 6, ROWS * CELL + 6, C.ink);
    rect(ctx, BX - 2, BY - 2, COLS * CELL + 4, ROWS * CELL + 4, C.cocoa2);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        rect(ctx, BX + x * CELL, BY + y * CELL, CELL, CELL, (x + y) % 2 ? '#d7ecd9' : '#cbe5cf');
      }
    }

    // food
    const bob = Math.floor(t * 3) % 2;
    drawCherry(ctx, BX + this.food.x * CELL, BY + this.food.y * CELL, bob);
    if (this.bonus && (this.bonus.ttl > 2 || Math.floor(t * 8) % 2)) {
      drawGoldBean(ctx, BX + this.bonus.x * CELL, BY + this.bonus.y * CELL, t);
    }

    // snake
    const flash = this.dying >= 0 && Math.floor(this.dying * 10) % 2 === 1;
    const colorOf = (i: number) => (flash ? C.white : i === 0 ? C.cocoa2 : BODY[Math.min(BODY.length - 1, Math.floor((i - 1) / 3))]);
    // pass 1: outlines (cells + joints), pass 2: fills, so joints are seamless
    for (let pass = 0; pass < 2; pass++) {
      for (let i = this.snake.length - 1; i >= 0; i--) {
        const s = this.snake[i];
        const px = BX + s.x * CELL;
        const py = BY + s.y * CELL;
        const prev = this.snake[i - 1];
        const dx = prev ? prev.x - s.x : 0;
        const dy = prev ? prev.y - s.y : 0;
        if (pass === 0) {
          rect(ctx, px + 1, py + 2, CELL - 2, CELL - 4, C.ink);
          rect(ctx, px + 2, py + 1, CELL - 4, CELL - 2, C.ink);
          if (dx) rect(ctx, px + (dx > 0 ? 5 : -5), py + 1, CELL, CELL - 2, C.ink);
          if (dy) rect(ctx, px + 1, py + (dy > 0 ? 5 : -5), CELL - 2, CELL, C.ink);
        } else {
          const col = colorOf(i);
          rect(ctx, px + 2, py + 2, CELL - 4, CELL - 4, col);
          if (dx) rect(ctx, px + (dx > 0 ? 2 : -3), py + 2, CELL + 1, CELL - 4, col);
          if (dy) rect(ctx, px + 2, py + (dy > 0 ? 2 : -3), CELL - 4, CELL + 1, col);
          if (i > 0 && i % 2 === 0 && !flash) rect(ctx, px + 4, py + 4, CELL - 8, CELL - 8, C.cream);
        }
      }
    }

    // head details
    const h = this.snake[0];
    const hx = BX + h.x * CELL;
    const hy = BY + h.y * CELL;
    if (!flash) {
      rect(ctx, hx + 2, hy + 2, 6, 2, C.cream); // foam cap
      const blink = Math.floor(t * 2.3) % 7 === 0;
      const ex = this.dir.x;
      const ey = this.dir.y;
      const eyes: Pt[] = ex !== 0 ? [{ x: 5 + ex * 1, y: 3 }, { x: 5 + ex * 1, y: 6 }] : [{ x: 3, y: 5 + ey }, { x: 6, y: 5 + ey }];
      for (const e of eyes) {
        if (this.dying >= 0) {
          rect(ctx, hx + e.x - 1, hy + e.y - 1, 1, 1, C.ink);
          rect(ctx, hx + e.x, hy + e.y, 1, 1, C.ink);
        } else rect(ctx, hx + e.x, hy + e.y, 1, blink ? 1 : 2, C.ink);
      }
      rect(ctx, hx + 2, hy + 7, 1, 1, C.pink);
      rect(ctx, hx + 7, hy + 7, 1, 1, C.pink);
    }

    drawParticles(ctx, this.parts);
    drawFloaters(ctx, this.floats);

    // HUD
    rect(ctx, 0, 0, W, 11, 'rgba(42,26,31,0.9)');
    text(ctx, `SCORE ${this.score}`, 4, 3, C.cream);
    text(ctx, `LEN ${this.snake.length}`, W / 2 + 6, 3, C.mint, { align: 'center' });
    text(ctx, `BEST ${Math.max(this.api.best, this.score)}`, W - 4, 3, C.gold2, { align: 'right' });
  }

  keyDown(key: string) {
    const map: Record<string, SwipeDir> = {
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right',
    };
    const d = map[key];
    if (!d) return false;
    this.turn(DIRS[d]);
    return true;
  }

  swipe(dir: SwipeDir) {
    this.turn(DIRS[dir]);
  }

  /** Tap/click: turn toward the tapped point (perpendicular to travel). */
  tap(x: number, y: number) {
    const last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    const h = this.snake[0];
    const hx = BX + h.x * CELL + 5;
    const hy = BY + h.y * CELL + 5;
    if (last.x !== 0) this.turn(DIRS[y < hy ? 'up' : 'down']);
    else this.turn(DIRS[x < hx ? 'left' : 'right']);
  }
}

export const snakeBrew: GameDef = {
  id: 'snake',
  name: 'Snake Brew',
  tagline: 'A latte snake hungry for coffee cherries.',
  howTo: [
    'Steer the latte snake to slurp up coffee cherries (+10).',
    'Golden beans pop up now and then: +50, but they vanish fast!',
    'Don\'t hit the walls or your own tail. It speeds up slowly.',
  ],
  controls: [
    [['←', '↑', '↓', '→'], 'steer'],
    [['W', 'A', 'S', 'D'], 'steer'],
    [['swipe'], 'touch'],
  ],
  scoreLabel: 'Score',
  accent: C.leaf2,
  reward: (s) => (s >= 400 ? 5 : s >= 260 ? 4 : s >= 160 ? 3 : s >= 90 ? 2 : s >= 30 ? 1 : 0),
  create: (api) => new SnakeBrew(api),
  thumb: (ctx) => {
    for (let y = 0; y < 48; y += 6) for (let x = 0; x < 64; x += 6) rect(ctx, x, y, 6, 6, (x + y) % 12 ? '#d7ecd9' : '#cbe5cf');
    const segs: [number, number, string][] = [
      [8, 30, C.cream], [14, 30, C.paper3], [20, 30, C.cream], [26, 30, '#e9c27a'], [32, 30, C.gold], [32, 24, '#e9c27a'], [32, 18, C.gold],
    ];
    for (const [x, y, c] of segs) {
      rect(ctx, x, y, 7, 7, C.ink);
      rect(ctx, x + 1, y + 1, 5, 5, c);
    }
    rect(ctx, 32, 12, 7, 7, C.ink);
    rect(ctx, 33, 13, 5, 5, C.cocoa2);
    rect(ctx, 33, 13, 5, 1, C.cream);
    rect(ctx, 34, 14, 1, 1, C.ink);
    rect(ctx, 36, 14, 1, 1, C.ink);
    drawCherry(ctx, 44, 6, 0);
    drawCherry(ctx, 10, 8, 0);
  },
};
