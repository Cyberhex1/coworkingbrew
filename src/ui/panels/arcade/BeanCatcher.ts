import {
  C, blit, burst, clamp, drawFloaters, drawParticles, heartEmptySprite, heartSprite, lazySprite, rand, rect, stepFloaters,
  stepParticles, text, type Ctx, type Floater, type Particle,
} from './pixel';
import { ARCADE_H, ARCADE_W, type GameApi, type GameDef, type GameInstance } from './types';

const W = ARCADE_W;
const H = ARCADE_H;
const FLOOR_Y = 130;
const CUP_W = 22;
const CUP_H = 15;
const CUP_Y = FLOOR_Y - CUP_H + 1;

type Kind = 'bean' | 'sugar' | 'gold' | 'burnt' | 'heart';

interface Drop {
  kind: Kind;
  x: number;
  y: number;
  vy: number;
  wobble: number;
}

const beanSprite = lazySprite([
  '.kkk.',
  'kbbbk',
  'kbBbk',
  'kbbBk',
  'kbBbk',
  'kbbbk',
  '.kkk.',
]);
const goldSprite = lazySprite([
  '.kkk.',
  'kYYyk',
  'kYyYk',
  'kyYyk',
  'kYyyk',
  'kyyyk',
  '.kkk.',
]);
const burntSprite = lazySprite([
  '.kkk.',
  'kKKKk',
  'kKxKk',
  'kKKxk',
  'kKxKk',
  'kKKKk',
  '.kkk.',
]);
const sugarSprite = lazySprite([
  'kkkkkk',
  'kwwwck',
  'kwwcck',
  'kwcwck',
  'kcccpk',
  'kkkkkk',
]);

const INFO: Record<Kind, { w: number; h: number; points: number }> = {
  bean: { w: 5, h: 7, points: 1 },
  sugar: { w: 6, h: 6, points: 2 },
  gold: { w: 5, h: 7, points: 5 },
  burnt: { w: 5, h: 7, points: 0 },
  heart: { w: 7, h: 7, points: 0 },
};

function spriteFor(k: Kind) {
  switch (k) {
    case 'bean': return beanSprite();
    case 'sugar': return sugarSprite();
    case 'gold': return goldSprite();
    case 'burnt': return burntSprite();
    case 'heart': return heartSprite();
  }
}

export function drawCafeBackdrop(ctx: Ctx, t: number, w = W, h = H, floorY = FLOOR_Y) {
  // wall
  rect(ctx, 0, 0, w, floorY, '#e9cfa3');
  for (let x = 0; x < w; x += 12) rect(ctx, x, 0, 6, floorY, '#e3c697');
  // wainscot
  rect(ctx, 0, floorY - 22, w, 22, C.cocoa2);
  rect(ctx, 0, floorY - 22, w, 2, C.cocoa);
  for (let x = 4; x < w; x += 16) rect(ctx, x, floorY - 18, 10, 14, '#6b3d28');
  // window
  const wx = Math.round(w * 0.62);
  rect(ctx, wx - 1, 17, 46, 38, C.cocoa);
  rect(ctx, wx + 1, 19, 42, 34, C.sky2);
  rect(ctx, wx + 1, 41, 42, 12, C.sky3);
  const cloud = Math.round((t * 3) % 60) - 10;
  rect(ctx, wx + 1 + clamp(cloud, 0, 34), 26, 8, 3, C.white);
  rect(ctx, wx + 3 + clamp(cloud, 0, 34), 24, 4, 2, C.white);
  rect(ctx, wx + 21, 19, 2, 34, C.cocoa);
  rect(ctx, wx + 1, 35, 42, 2, C.cocoa);
  // shelf + jars
  const sx = Math.round(w * 0.08);
  rect(ctx, sx, 40, 50, 3, C.cocoa);
  rect(ctx, sx + 2, 31, 8, 9, C.sky2);
  rect(ctx, sx + 3, 34, 6, 6, C.bean);
  rect(ctx, sx + 2, 30, 8, 2, C.cocoa);
  rect(ctx, sx + 14, 33, 7, 7, C.cream);
  rect(ctx, sx + 15, 35, 5, 4, C.rose);
  rect(ctx, sx + 26, 28, 6, 12, C.leaf);
  rect(ctx, sx + 25, 36, 8, 4, C.terra);
  rect(ctx, sx + 36, 32, 9, 8, C.gold);
  rect(ctx, sx + 38, 30, 5, 2, C.cocoa);
  // floor / counter
  rect(ctx, 0, floorY, w, h - floorY, C.cocoa);
  rect(ctx, 0, floorY, w, 2, C.espresso);
  for (let x = 0; x < w; x += 8) rect(ctx, x, floorY + 4, 4, 1, C.cocoa2);
}

function drawCup(ctx: Ctx, x: number, y: number, squash: number) {
  const top = y + squash;
  const h = CUP_H - squash;
  // handle
  rect(ctx, x + CUP_W - 1, top + 3, 4, 7, C.ink);
  rect(ctx, x + CUP_W, top + 5, 2, 3, '#e3d6c3');
  // body
  rect(ctx, x, top, CUP_W, h, C.ink);
  rect(ctx, x + 1, top + 1, CUP_W - 2, h - 2, C.cream);
  rect(ctx, x + 1, top + h - 4, CUP_W - 2, 3, C.paper3);
  rect(ctx, x + 3, top + 4, 2, h - 8, C.white);
  // coffee surface
  rect(ctx, x + 1, top + 1, CUP_W - 2, 2, C.cocoa);
  rect(ctx, x + 6, top + 1, 6, 1, C.bean);
  // stripe
  rect(ctx, x + 1, top + 6, CUP_W - 2, 2, C.terra);
}

class BeanCatcher implements GameInstance {
  private x = W / 2 - CUP_W / 2;
  private vx = 0;
  private left = false;
  private right = false;
  private target: number | null = null;
  private drops: Drop[] = [];
  private parts: Particle[] = [];
  private floats: Floater[] = [];
  private score = 0;
  private lives = 3;
  private caught = 0;
  private combo = 0;
  private time = 0;
  private spawnIn = 0.6;
  private shake = 0;
  private flash = 0;
  private squash = 0;
  private dying = -1;
  private steam = 0;

  constructor(private api: GameApi) {}

  private get level() {
    return Math.min(10, Math.floor(this.time / 12));
  }

  private spawn() {
    const lvl = this.level;
    const r = Math.random();
    const burntChance = 0.14 + lvl * 0.025;
    let kind: Kind = 'bean';
    if (r < burntChance) kind = 'burnt';
    else if (r < burntChance + 0.12) kind = 'sugar';
    else if (r < burntChance + 0.15) kind = 'gold';
    else if (r < burntChance + 0.165 && this.lives < 3) kind = 'heart';
    const info = INFO[kind];
    const speed = 32 + lvl * 7 + rand(-4, 8) + (kind === 'gold' ? 12 : 0);
    this.drops.push({ kind, x: Math.round(rand(4, W - 4 - info.w)), y: 8 - info.h, vy: speed, wobble: rand(0, Math.PI * 2) });
    this.spawnIn = Math.max(0.3, 0.85 - lvl * 0.055) * rand(0.75, 1.2);
  }

  update(dt: number) {
    this.time += dt;
    stepParticles(this.parts, dt);
    stepFloaters(this.floats, dt);
    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.squash = Math.max(0, this.squash - dt * 30);
    this.steam += dt;

    if (this.dying >= 0) {
      this.dying += dt;
      for (const d of this.drops) d.y += d.vy * dt * 0.3;
      if (this.dying > 1.1) {
        this.dying = -2;
        this.api.end(this.score, [`BEANS CAUGHT: ${this.caught}`, `SURVIVED: ${Math.floor(this.time)}S`]);
      }
      return;
    }
    if (this.dying === -2) return;

    // movement
    const maxV = 150;
    if (this.left || this.right) {
      this.target = null;
      const dir = (this.right ? 1 : 0) - (this.left ? 1 : 0);
      this.vx = clamp(this.vx + dir * 900 * dt, -maxV, maxV);
      if (!dir) this.vx *= 0.7;
    } else if (this.target !== null) {
      const dx = this.target - (this.x + CUP_W / 2);
      this.vx = clamp(dx * 14, -maxV * 1.4, maxV * 1.4);
    } else {
      this.vx *= Math.pow(0.0005, dt);
    }
    this.x = clamp(this.x + this.vx * dt, 0, W - CUP_W - 3);

    // spawning
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) this.spawn();

    // drops
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      const info = INFO[d.kind];
      d.y += d.vy * dt;
      d.wobble += dt * 6;
      const cx = d.x + info.w / 2;
      const bottom = d.y + info.h;
      if (bottom >= CUP_Y + 1 && bottom <= CUP_Y + 7 && cx >= this.x - 1 && cx <= this.x + CUP_W + 1) {
        this.drops.splice(i, 1);
        this.catchDrop(d, cx);
        continue;
      }
      if (d.y > FLOOR_Y - info.h + 2) {
        this.drops.splice(i, 1);
        if (d.kind !== 'burnt' && d.kind !== 'heart') {
          if (this.combo >= 5) this.floats.push({ x: cx, y: FLOOR_Y - 10, text: 'COMBO LOST', color: C.pink, life: 0.8 });
          this.combo = 0;
          burst(this.parts, cx, FLOOR_Y, [C.bean, C.cocoa2], 4, 25, 120);
        } else if (d.kind === 'burnt') {
          burst(this.parts, cx, FLOOR_Y, [C.grey, C.grey2], 5, 20, -10);
        }
      }
    }
  }

  private catchDrop(d: Drop, cx: number) {
    this.squash = 3;
    if (d.kind === 'burnt') {
      this.lives--;
      this.combo = 0;
      this.shake = 0.3;
      this.flash = 0.2;
      burst(this.parts, cx, CUP_Y, [C.char, C.grey, C.grey2], 14, 50, 20);
      this.floats.push({ x: cx, y: CUP_Y - 8, text: 'BURNT!', color: C.tomato, life: 0.8 });
      this.api.sfx('error');
      if (this.lives <= 0) {
        this.dying = 0;
        this.drops.length = 0;
      }
      return;
    }
    if (d.kind === 'heart') {
      this.lives = Math.min(3, this.lives + 1);
      burst(this.parts, cx, CUP_Y, [C.tomato, C.pink, C.white], 12, 45);
      this.floats.push({ x: cx, y: CUP_Y - 8, text: '+LIFE', color: C.pink, life: 0.8 });
      this.api.sfx('success');
      return;
    }
    this.combo++;
    this.caught++;
    const mult = this.combo >= 20 ? 4 : this.combo >= 12 ? 3 : this.combo >= 5 ? 2 : 1;
    const pts = INFO[d.kind].points * mult;
    this.score += pts;
    const cols = d.kind === 'gold' ? [C.gold2, C.gold, C.white] : d.kind === 'sugar' ? [C.white, C.cream] : [C.bean, C.gold2, C.cream];
    burst(this.parts, cx, CUP_Y, cols, d.kind === 'gold' ? 14 : 7, 40);
    this.floats.push({ x: cx, y: CUP_Y - 8, text: `+${pts}`, color: d.kind === 'gold' ? C.gold2 : C.white, life: 0.6 });
    this.api.sfx(d.kind === 'gold' ? 'coin' : 'pop');
    if (mult > 1 && (this.combo === 5 || this.combo === 12 || this.combo === 20)) {
      this.floats.push({ x: W / 2, y: 50, text: `COMBO X${mult}!`, color: C.gold2, life: 1 });
      this.api.sfx('success');
    }
  }

  draw(ctx: Ctx, t: number) {
    ctx.save();
    if (this.shake > 0) ctx.translate(Math.round(rand(-2, 2)), Math.round(rand(-1, 1)));
    drawCafeBackdrop(ctx, t);

    for (const d of this.drops) {
      const s = spriteFor(d.kind);
      const wob = d.kind === 'heart' ? 0 : Math.round(Math.sin(d.wobble) * 0.6);
      blit(ctx, s, d.x + wob, d.y);
      if (d.kind === 'burnt') {
        const puff = Math.floor(t * 6 + d.x) % 3;
        rect(ctx, d.x + 1 + puff, d.y - 3 - puff, 2, 2, C.grey2);
        rect(ctx, d.x + 3 - puff, d.y - 6 - puff, 1, 1, C.grey);
      }
      if (d.kind === 'gold' && Math.floor(t * 8) % 2) rect(ctx, d.x + 5, d.y - 1, 1, 1, C.white);
    }

    // cup + shadow
    if (this.dying < 0 || Math.floor(this.dying * 10) % 2 === 0) {
      rect(ctx, this.x + 2, FLOOR_Y, CUP_W - 2, 1, C.espresso);
      drawCup(ctx, this.x, CUP_Y, Math.round(this.squash));
      const st = Math.floor(this.steam * 4) % 4;
      rect(ctx, this.x + 6 + (st % 2), CUP_Y - 4 - st, 1, 2, '#ffffffaa');
      rect(ctx, this.x + 13 - (st % 2), CUP_Y - 6 - ((st + 2) % 4), 1, 2, '#ffffff88');
    }

    drawParticles(ctx, this.parts);
    drawFloaters(ctx, this.floats);
    ctx.restore();

    if (this.flash > 0) {
      ctx.fillStyle = 'rgba(217,87,63,0.35)';
      ctx.fillRect(0, 0, W, H);
    }

    // HUD
    rect(ctx, 0, 0, W, 11, 'rgba(42,26,31,0.82)');
    text(ctx, `SCORE ${this.score}`, 4, 3, C.cream);
    if (this.combo >= 5) {
      const mult = this.combo >= 20 ? 4 : this.combo >= 12 ? 3 : 2;
      text(ctx, `X${mult}`, 74, 3, C.gold2);
    }
    text(ctx, `LV${this.level + 1}`, 96, 3, C.mint);
    for (let i = 0; i < 3; i++) blit(ctx, i < this.lives ? heartSprite() : heartEmptySprite(), W - 26 + i * 8, 2);
  }

  keyDown(key: string) {
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this.left = true;
      return true;
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      this.right = true;
      return true;
    }
    return false;
  }

  keyUp(key: string) {
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.left = false;
    if (key === 'ArrowRight' || key === 'd' || key === 'D') this.right = false;
  }

  pointerDown(x: number) {
    this.target = x;
  }

  pointerMove(x: number, _y: number, down: boolean) {
    if (down || this.target !== null) this.target = x;
  }
}

export const beanCatcher: GameDef = {
  id: 'beans',
  name: 'Bean Catcher',
  tagline: 'Catch the beans, dodge the burnt ones.',
  howTo: [
    'Slide your cup to catch falling coffee beans and sugar cubes.',
    'Golden beans are worth 5. Burnt beans cost a life!',
    'Chain catches for a combo multiplier. It speeds up over time.',
  ],
  controls: [
    [['←', '→'], 'move'],
    [['A', 'D'], 'move'],
    [['drag'], 'mouse / touch'],
  ],
  scoreLabel: 'Score',
  accent: C.terra,
  reward: (s) => (s >= 300 ? 5 : s >= 190 ? 4 : s >= 110 ? 3 : s >= 55 ? 2 : s >= 20 ? 1 : 0),
  create: (api) => new BeanCatcher(api),
  thumb: (ctx) => {
    rect(ctx, 0, 0, 64, 48, '#e9cfa3');
    for (let x = 0; x < 64; x += 8) rect(ctx, x, 0, 4, 40, '#e3c697');
    rect(ctx, 0, 40, 64, 8, C.cocoa);
    blit(ctx, beanSprite(), 12, 8);
    blit(ctx, goldSprite(), 40, 4);
    blit(ctx, sugarSprite(), 50, 16);
    blit(ctx, burntSprite(), 26, 18);
    rect(ctx, 27, 15, 2, 2, C.grey2);
    blit(ctx, beanSprite(), 30, 24);
    drawCup(ctx, 22, 26, 0);
  },
};
