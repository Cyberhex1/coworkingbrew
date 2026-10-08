// Ambience layers. Each layer is built lazily when it becomes audible and torn
// down (sources stopped, nodes disconnected) shortly after it is turned off.

import type { NoiseBank } from './noise';
import { createCrackle } from './noise';
import { chance, cleanup, noiseShot, percEnv, pick, rand, randInt, smooth } from './util';

export type AmbienceId = 'rain' | 'cafe' | 'fire' | 'birds' | 'crickets' | 'water' | 'vinyl';

export const AMBIENCES: { id: AmbienceId; name: string }[] = [
  { id: 'rain', name: 'Rain' },
  { id: 'cafe', name: 'Café Chatter' },
  { id: 'fire', name: 'Fireplace' },
  { id: 'birds', name: 'Birdsong' },
  { id: 'crickets', name: 'Crickets' },
  { id: 'water', name: 'Brook' },
  { id: 'vinyl', name: 'Vinyl Crackle' },
];

/** Per-layer loudness trim so every layer at 1.0 sits at a similar level. */
const TRIM: Record<AmbienceId, number> = {
  rain: 1.0,
  cafe: 1.0,
  fire: 1.0,
  birds: 0.9,
  crickets: 0.8,
  water: 0.9,
  vinyl: 0.7,
};

interface SharedBuffers {
  bank: NoiseBank;
  crackle(kind: 'vinyl' | 'fire'): AudioBuffer;
}

abstract class Layer {
  readonly out: GainNode;
  protected ctx: AudioContext;
  protected buf: SharedBuffers;
  private sources: AudioScheduledSourceNode[] = [];
  private nodes: AudioNode[] = [];

  constructor(ctx: AudioContext, buf: SharedBuffers, dest: AudioNode) {
    this.ctx = ctx;
    this.buf = buf;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(dest);
  }

  /** Called from the engine scheduler with a lookahead window. */
  abstract tick(now: number, until: number): void;

  protected track<T extends AudioNode>(n: T): T {
    this.nodes.push(n);
    return n;
  }

  protected loop(buf: AudioBuffer, dest: AudioNode, rate = 1): AudioBufferSourceNode {
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.playbackRate.value = rate;
    s.connect(dest);
    s.start(this.ctx.currentTime, Math.random() * buf.duration);
    this.sources.push(s);
    this.nodes.push(s);
    return s;
  }

  protected filter(type: BiquadFilterType, freq: number, q = 0.707, dest?: AudioNode): BiquadFilterNode {
    const f = this.track(this.ctx.createBiquadFilter());
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    if (dest) f.connect(dest);
    return f;
  }

  protected gain(v: number, dest?: AudioNode): GainNode {
    const g = this.track(this.ctx.createGain());
    g.gain.value = v;
    if (dest) g.connect(dest);
    return g;
  }

  protected panner(p: number, dest?: AudioNode): StereoPannerNode {
    const s = this.track(this.ctx.createStereoPanner());
    s.pan.value = p;
    if (dest) s.connect(dest);
    return s;
  }

  /** Persistent LFO added onto an AudioParam. */
  protected lfo(freq: number, depth: number, param: AudioParam): void {
    const o = this.ctx.createOscillator();
    o.frequency.value = freq;
    const g = this.gain(depth);
    o.connect(g);
    g.connect(param);
    o.start(this.ctx.currentTime);
    this.sources.push(o);
    this.nodes.push(o);
  }

  /** Normalise an event clock after a stall so we never burst-schedule. */
  protected catchUp(next: number, now: number, gap: number): number {
    return next < now - 0.5 ? now + rand(0.05, gap) : next;
  }

  /** One-shot panned voice output that disconnects itself after `src` ends. */
  protected oneShotOut(pan: number): [GainNode, StereoPannerNode] {
    const g = this.ctx.createGain();
    const p = this.ctx.createStereoPanner();
    p.pan.value = pan;
    g.connect(p);
    p.connect(this.out);
    return [g, p];
  }

  dispose(): void {
    const t = this.ctx.currentTime;
    for (const s of this.sources) {
      try {
        s.stop(t);
      } catch {
        /* */
      }
    }
    for (const n of this.nodes) {
      try {
        n.disconnect();
      } catch {
        /* */
      }
    }
    try {
      this.out.disconnect();
    } catch {
      /* */
    }
    this.sources = [];
    this.nodes = [];
  }
}

// ---------------------------------------------------------------- rain

class RainLayer extends Layer {
  private nextDrop = 0;
  private nextDrip = 0;
  private dripPan = rand(-0.6, 0.6);

  constructor(ctx: AudioContext, buf: SharedBuffers, dest: AudioNode) {
    super(ctx, buf, dest);
    const { pink, white, brown } = buf.bank;
    // wide stereo bed
    for (const p of [-0.55, 0.55]) {
      const pan = this.panner(p, this.out);
      const g = this.gain(0.55, pan);
      const lp = this.filter('lowpass', 1100, 0.5, g);
      this.loop(pink, lp);
      this.lfo(rand(0.05, 0.09), 0.08, g.gain);
    }
    // high hiss of rain on glass
    const hg = this.gain(0.05, this.out);
    const hl = this.filter('lowpass', 9000, 0.5, hg);
    const hh = this.filter('highpass', 2500, 0.5, hl);
    this.loop(white, hh);
    // distant rumble
    const rg = this.gain(0.35, this.out);
    const rl = this.filter('lowpass', 260, 0.6, rg);
    this.loop(brown, rl);
    const now = ctx.currentTime;
    this.nextDrop = now + 0.1;
    this.nextDrip = now + rand(0.5, 2);
  }

  tick(now: number, until: number): void {
    this.nextDrop = this.catchUp(this.nextDrop, now, 0.2);
    while (this.nextDrop < until) {
      this.droplet(this.nextDrop, rand(1800, 4200), rand(0.02, 0.07), rand(-0.9, 0.9), 0.012);
      this.nextDrop += -Math.log(1 - Math.random()) / 9; // ~9 drops/s
    }
    this.nextDrip = this.catchUp(this.nextDrip, now, 1);
    while (this.nextDrip < until) {
      // gutter drip: steady-ish rhythm from one spot
      this.droplet(this.nextDrip, rand(900, 1300), rand(0.05, 0.08), this.dripPan, 0.03);
      this.nextDrip += rand(0.9, 2.6);
      if (chance(0.05)) this.dripPan = rand(-0.6, 0.6);
    }
  }

  private droplet(t: number, f: number, amp: number, pan: number, tau: number): void {
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.03);
    const [g, p] = this.oneShotOut(pan);
    percEnv(g.gain, t, amp, 0.001, tau);
    o.connect(g);
    o.start(t);
    o.stop(t + tau * 8 + 0.02);
    cleanup(o, [o, g, p]);
  }
}

// ---------------------------------------------------------------- cafe

interface Talker {
  bp: BiquadFilterNode;
  g: GainNode;
  center: number;
  next: number;
}

class CafeLayer extends Layer {
  private talkers: Talker[] = [];
  private nextClink = 0;

  constructor(ctx: AudioContext, buf: SharedBuffers, dest: AudioNode) {
    super(ctx, buf, dest);
    const { pink, brown } = buf.bank;
    const room = this.filter('lowpass', 1600, 0.5, this.out);
    // two decorrelated pink sources feed the talker formant bands
    const srcBus = [this.gain(1), this.gain(1)];
    this.loop(pink, srcBus[0]);
    this.loop(pink, srcBus[1], 0.97);
    const centers = [380, 520, 680, 860, 1050];
    const now = ctx.currentTime;
    centers.forEach((center, i) => {
      const pan = this.panner(rand(-0.7, 0.7), room);
      const g = this.gain(0, pan);
      const bp = this.filter('bandpass', center, rand(2.2, 3.2), g);
      srcBus[i % 2].connect(bp);
      this.talkers.push({ bp, g, center, next: now + rand(0, 0.5) });
    });
    // crowd bed + room tone
    const bed = this.gain(0.25, room);
    const bbp = this.filter('bandpass', 500, 0.7, bed);
    srcBus[1].connect(bbp);
    const rt = this.gain(0.18, this.out);
    const rtl = this.filter('lowpass', 320, 0.6, rt);
    this.loop(brown, rtl);
    this.nextClink = now + rand(1, 4);
  }

  tick(now: number, until: number): void {
    for (const tk of this.talkers) {
      tk.next = this.catchUp(tk.next, now, 0.3);
      while (tk.next < until) {
        const t = tk.next;
        if (chance(0.07)) {
          // end of a sentence: pause
          tk.g.gain.setTargetAtTime(0, t, 0.08);
          tk.next = t + rand(0.8, 2.6);
        } else if (chance(0.25)) {
          tk.g.gain.setTargetAtTime(rand(0, 0.25), t, 0.05);
          tk.next = t + rand(0.08, 0.2);
        } else {
          // syllable
          tk.g.gain.setTargetAtTime(rand(0.7, 1.8), t, rand(0.03, 0.07));
          tk.bp.frequency.setTargetAtTime(tk.center * rand(0.78, 1.3), t, 0.06);
          tk.next = t + rand(0.1, 0.28);
        }
      }
    }
    this.nextClink = this.catchUp(this.nextClink, now, 3);
    while (this.nextClink < until) {
      const t = this.nextClink;
      const pan = rand(-0.8, 0.8);
      if (chance(0.6)) this.clink(t, rand(2100, 3200), [1, 2.61, 4.2], [1, 0.45, 0.2], rand(0.02, 0.04), rand(0.08, 0.16), pan);
      else {
        const n = randInt(2, 4);
        const f = rand(4200, 5600);
        for (let i = 0; i < n; i++) this.clink(t + i * rand(0.1, 0.14), f * rand(0.98, 1.02), [1, 2.4], [1, 0.3], rand(0.008, 0.015), 0.05, pan);
      }
      this.nextClink += rand(2.5, 9);
    }
  }

  private clink(t: number, f0: number, ratios: number[], amps: number[], amp: number, tau: number, pan: number): void {
    const [g, p] = this.oneShotOut(pan);
    percEnv(g.gain, t, amp, 0.001, tau);
    const oscs: OscillatorNode[] = [];
    const nodes: AudioNode[] = [g, p];
    ratios.forEach((r, i) => {
      const o = this.ctx.createOscillator();
      o.frequency.value = f0 * r;
      const og = this.ctx.createGain();
      og.gain.value = amps[i];
      o.connect(og);
      og.connect(g);
      o.start(t);
      o.stop(t + tau * 8 + 0.05);
      oscs.push(o);
      nodes.push(o, og);
    });
    cleanup(oscs[0], nodes);
  }
}

// ---------------------------------------------------------------- fire

class FireLayer extends Layer {
  private flick: GainNode;
  private nextFlicker = 0;
  private nextPop = 0;

  constructor(ctx: AudioContext, buf: SharedBuffers, dest: AudioNode) {
    super(ctx, buf, dest);
    const { brown, pink } = buf.bank;
    this.flick = this.gain(0.8, this.out);
    const rl = this.filter('lowpass', 180, 0.7, this.gain(0.75, this.flick));
    this.loop(brown, rl);
    const roar = this.filter('bandpass', 900, 0.6, this.gain(0.3, this.flick));
    this.loop(pink, roar);
    // crackle texture
    const cg = this.gain(0.38, this.out);
    const chp = this.filter('highpass', 1100, 0.6, cg);
    this.loop(buf.crackle('fire'), chp, rand(0.95, 1.05));
    const cg2 = this.gain(0.2, this.panner(0.4, this.out));
    const chp2 = this.filter('highpass', 1500, 0.6, cg2);
    this.loop(buf.crackle('fire'), chp2, 0.83);
    const now = ctx.currentTime;
    this.nextFlicker = now;
    this.nextPop = now + rand(0.5, 2);
  }

  tick(now: number, until: number): void {
    this.nextFlicker = this.catchUp(this.nextFlicker, now, 0.2);
    while (this.nextFlicker < until) {
      this.flick.gain.setTargetAtTime(rand(0.55, 1), this.nextFlicker, 0.12);
      this.nextFlicker += rand(0.15, 0.4);
    }
    this.nextPop = this.catchUp(this.nextPop, now, 1.5);
    while (this.nextPop < until) {
      this.pop(this.nextPop);
      this.nextPop += rand(0.4, 3.5);
    }
  }

  private pop(t: number): void {
    const [g, p] = this.oneShotOut(rand(-0.5, 0.5));
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = rand(1500, 3000);
    percEnv(g.gain, t, rand(0.08, 0.22), 0.0005, rand(0.003, 0.012));
    hp.connect(g);
    const ns = noiseShot(this.ctx, this.buf.bank.white, hp, t, 0.12);
    cleanup(ns, [ns, hp, g, p]);
  }
}

// ---------------------------------------------------------------- birds

class BirdsLayer extends Layer {
  private nextPhrase = 0;

  constructor(ctx: AudioContext, buf: SharedBuffers, dest: AudioNode) {
    super(ctx, buf, dest);
    // faint outdoor air
    const air = this.filter('lowpass', 700, 0.5, this.gain(0.05, this.out));
    this.loop(buf.bank.pink, air);
    this.nextPhrase = ctx.currentTime + rand(0.3, 1.5);
  }

  tick(now: number, until: number): void {
    this.nextPhrase = this.catchUp(this.nextPhrase, now, 2);
    while (this.nextPhrase < until) {
      let t = this.nextPhrase;
      const pan = rand(-0.85, 0.85);
      t = this.phrase(t, pan);
      if (chance(0.35)) this.phrase(t + rand(0.3, 0.9), -pan * rand(0.5, 1)); // a reply
      this.nextPhrase = t + rand(1.5, 6);
    }
  }

  /** Returns the time the phrase ends. */
  private phrase(t: number, pan: number): number {
    const kind = pick(['tweet', 'trill', 'whistle'] as const);
    const amp = rand(0.04, 0.08);
    if (kind === 'tweet') {
      const n = randInt(3, 6);
      const f = rand(3000, 4300);
      for (let i = 0; i < n; i++) {
        const d = rand(0.06, 0.09);
        this.chirp(t, d, f * rand(0.97, 1.03), f * 1.35, f * 0.9, amp * rand(0.8, 1), pan);
        t += d + rand(0.05, 0.09);
      }
    } else if (kind === 'trill') {
      const n = randInt(8, 14);
      const f = rand(4500, 5600);
      for (let i = 0; i < n; i++) {
        const ff = f * (1 - i * 0.012);
        this.chirp(t, 0.025, ff, ff * 1.15, ff * 0.95, amp * 0.8, pan);
        t += 0.045;
      }
    } else {
      const f = rand(3400, 4100);
      this.chirp(t, 0.24, f, f * 1.02, f, amp, pan);
      t += 0.3;
      this.chirp(t, 0.24, f * 0.84, f * 0.85, f * 0.82, amp * 0.9, pan);
      t += 0.24;
    }
    return t;
  }

  private chirp(t: number, d: number, f0: number, fPeak: number, fEnd: number, amp: number, pan: number): void {
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(fPeak, t + d * 0.4);
    o.frequency.exponentialRampToValueAtTime(fEnd, t + d);
    const [g, p] = this.oneShotOut(pan);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(amp, t + Math.min(0.012, d * 0.3));
    g.gain.setTargetAtTime(0, t + d * 0.65, d * 0.15);
    o.connect(g);
    o.start(t);
    o.stop(t + d + 0.08);
    cleanup(o, [o, g, p]);
  }
}

// ---------------------------------------------------------------- crickets

interface Cricket {
  f: number;
  period: number;
  pulses: number;
  amp: number;
  pan: number;
  next: number;
}

class CricketsLayer extends Layer {
  private crickets: Cricket[] = [];

  constructor(ctx: AudioContext, buf: SharedBuffers, dest: AudioNode) {
    super(ctx, buf, dest);
    const night = this.filter('lowpass', 300, 0.6, this.gain(0.12, this.out));
    this.loop(buf.bank.brown, night);
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      this.crickets.push({
        f: rand(4200, 5200),
        period: rand(0.55, 0.95),
        pulses: randInt(3, 4),
        amp: i === 2 ? rand(0.008, 0.012) : rand(0.016, 0.03),
        pan: rand(-0.8, 0.8),
        next: now + rand(0, 1),
      });
    }
  }

  tick(now: number, until: number): void {
    for (const c of this.crickets) {
      c.next = this.catchUp(c.next, now, c.period);
      while (c.next < until) {
        this.chirp(c, c.next);
        c.next += c.period * rand(0.96, 1.04);
        if (chance(0.03)) c.next += rand(1.5, 5); // rest
      }
    }
  }

  private chirp(c: Cricket, t: number): void {
    const o = this.ctx.createOscillator();
    o.frequency.value = c.f;
    const [g, p] = this.oneShotOut(c.pan);
    const len = 0.014;
    const gap = 0.034;
    g.gain.setValueAtTime(0, t);
    for (let k = 0; k < c.pulses; k++) {
      const t0 = t + k * gap;
      const a = c.amp * (k === 0 ? 0.8 : 1);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(a, t0 + 0.003);
      g.gain.linearRampToValueAtTime(a * 0.8, t0 + len - 0.003);
      g.gain.linearRampToValueAtTime(0, t0 + len);
    }
    o.connect(g);
    o.start(t);
    o.stop(t + c.pulses * gap + 0.02);
    cleanup(o, [o, g, p]);
  }
}

// ---------------------------------------------------------------- water

class WaterLayer extends Layer {
  private bands: { bp: BiquadFilterNode; g: GainNode; center: number }[] = [];
  private nextMove = 0;
  private nextBubble = 0;

  constructor(ctx: AudioContext, buf: SharedBuffers, dest: AudioNode) {
    super(ctx, buf, dest);
    const { white, brown } = buf.bank;
    const src = this.gain(1);
    this.loop(white, src);
    [700, 1400, 2600].forEach((center, i) => {
      const pan = this.panner([-0.4, 0.3, 0][i], this.out);
      const g = this.gain(0.3, pan);
      const bp = this.filter('bandpass', center, 1.1, g);
      src.connect(bp);
      this.bands.push({ bp, g, center });
    });
    const body = this.filter('lowpass', 500, 0.6, this.gain(0.3, this.out));
    this.loop(brown, body);
    this.nextMove = ctx.currentTime;
    this.nextBubble = ctx.currentTime + 0.2;
  }

  tick(now: number, until: number): void {
    this.nextMove = this.catchUp(this.nextMove, now, 0.15);
    while (this.nextMove < until) {
      const t = this.nextMove;
      for (const b of this.bands) {
        b.bp.frequency.setTargetAtTime(b.center * rand(0.8, 1.25), t, rand(0.08, 0.25));
        b.g.gain.setTargetAtTime(rand(0.15, 0.55), t, rand(0.08, 0.25));
      }
      this.nextMove += rand(0.12, 0.3);
    }
    this.nextBubble = this.catchUp(this.nextBubble, now, 0.3);
    while (this.nextBubble < until) {
      this.bubble(this.nextBubble);
      this.nextBubble += -Math.log(1 - Math.random()) / 4;
    }
  }

  private bubble(t: number): void {
    const o = this.ctx.createOscillator();
    const f = rand(300, 900);
    const d = rand(0.03, 0.08);
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * rand(1.6, 2.5), t + d);
    const [g, p] = this.oneShotOut(rand(-0.6, 0.6));
    percEnv(g.gain, t, rand(0.015, 0.04), 0.002, d * 0.45);
    o.connect(g);
    o.start(t);
    o.stop(t + d + 0.1);
    cleanup(o, [o, g, p]);
  }
}

// ---------------------------------------------------------------- vinyl

class VinylLayer extends Layer {
  private nextPop = 0;

  constructor(ctx: AudioContext, buf: SharedBuffers, dest: AudioNode) {
    super(ctx, buf, dest);
    const { white, brown } = buf.bank;
    const cr = this.filter('highpass', 700, 0.6, this.gain(0.32, this.out));
    this.loop(buf.crackle('vinyl'), cr);
    const hiss = this.filter('lowpass', 10000, 0.5, this.gain(0.025, this.out));
    const hhp = this.filter('highpass', 3500, 0.5, hiss);
    this.loop(white, hhp);
    const rum = this.filter('lowpass', 70, 0.7, this.gain(0.12, this.out));
    this.loop(brown, rum);
    this.nextPop = ctx.currentTime + rand(1, 3);
  }

  tick(now: number, until: number): void {
    this.nextPop = this.catchUp(this.nextPop, now, 2);
    while (this.nextPop < until) {
      const t = this.nextPop;
      const [g, p] = this.oneShotOut(rand(-0.2, 0.2));
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = rand(800, 2500);
      bp.Q.value = 0.8;
      percEnv(g.gain, t, rand(0.06, 0.14), 0.0005, 0.004);
      bp.connect(g);
      const ns = noiseShot(this.ctx, this.buf.bank.white, bp, t, 0.06);
      cleanup(ns, [ns, bp, g, p]);
      this.nextPop += rand(1, 5);
    }
  }
}

const BUILDERS: Record<AmbienceId, new (ctx: AudioContext, buf: SharedBuffers, dest: AudioNode) => Layer> = {
  rain: RainLayer,
  cafe: CafeLayer,
  fire: FireLayer,
  birds: BirdsLayer,
  crickets: CricketsLayer,
  water: WaterLayer,
  vinyl: VinylLayer,
};

interface Entry {
  layer: Layer;
  level: number;
  teardown: number | null;
}

/** Owns all live ambience layers and their lazy build/teardown. */
export class AmbienceMixer {
  private ctx: AudioContext;
  private dest: AudioNode;
  private shared: SharedBuffers;
  private entries = new Map<AmbienceId, Entry>();
  private crackles: Partial<Record<'vinyl' | 'fire', AudioBuffer>> = {};

  constructor(ctx: AudioContext, bank: NoiseBank, dest: AudioNode) {
    this.ctx = ctx;
    this.dest = dest;
    this.shared = {
      bank,
      crackle: (kind) => {
        let b = this.crackles[kind];
        if (!b) {
          b = createCrackle(ctx, kind);
          this.crackles[kind] = b;
        }
        return b;
      },
    };
  }

  /**
   * level: final 0..1 gain for the layer. active: whether the layer should exist at all
   * (false => fade out, then free nodes).
   */
  set(id: AmbienceId, level: number, active: boolean, tau = 0.2): void {
    const now = this.ctx.currentTime;
    let e = this.entries.get(id);
    if (active) {
      if (!e) {
        const layer = new BUILDERS[id](this.ctx, this.shared, this.dest);
        e = { layer, level: -1, teardown: null };
        this.entries.set(id, e);
      }
      if (e.teardown !== null) {
        clearTimeout(e.teardown);
        e.teardown = null;
        e.level = -1;
      }
      if (Math.abs(e.level - level) > 0.0015) {
        smooth(e.layer.out.gain, level * TRIM[id], now, tau);
        e.level = level;
      }
    } else if (e && e.teardown === null) {
      smooth(e.layer.out.gain, 0, now, 0.15);
      e.level = 0;
      const entry = e;
      entry.teardown = window.setTimeout(() => {
        entry.layer.dispose();
        if (this.entries.get(id) === entry) this.entries.delete(id);
      }, 1200);
    }
  }

  tick(now: number, horizon: number): void {
    const until = now + horizon;
    this.entries.forEach((e) => e.layer.tick(now, until));
  }

  dispose(): void {
    this.entries.forEach((e) => {
      if (e.teardown !== null) clearTimeout(e.teardown);
      e.layer.dispose();
    });
    this.entries.clear();
  }
}
