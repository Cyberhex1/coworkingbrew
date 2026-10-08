// Generative lo-fi music: station definitions + a per-station player that is driven
// by the engine's lookahead scheduler (all timing in AudioContext time).

import type { NoiseBank } from './noise';
import { createPulseWave } from './noise';
import { chance, cleanup, mtof, noiseShot, percEnv, pick, rand, randInt, smooth, weighted } from './util';

export type StationId = 'rainy-cafe' | 'late-night' | 'sunny-bossa' | 'deep-focus' | 'chiptune-study';

interface ChordDef {
  /** root, semitones above the key tonic */
  r: number;
  /** chord intervals (incl. 0 = root) */
  q: readonly number[];
}

type KeysType = 'rhodes' | 'pad' | 'chip';
type DrumStyle = 'boombap' | 'lazy' | 'bossa' | 'sparse' | 'chip';
type BassStyle = 'round' | 'bossa' | 'drone' | 'chip';
type MelodyVoice = 'bell' | 'flute' | 'kalimba' | 'chip';

export interface StationDef {
  id: StationId;
  name: string;
  description: string;
  bpm: number;
  key: number; // tonic pitch class 0..11
  minor: boolean;
  swing: number; // fraction of a 16th that off-16ths are delayed
  barsPerChord: number;
  progressions: ChordDef[][];
  keys: KeysType;
  keysCenter: number; // midi centre for voicings
  keysFilter: number; // Hz
  fmIndex: number; // e-piano brightness
  tremoloHz: number;
  tremoloDepth: number;
  drums: DrumStyle;
  bass: BassStyle;
  melody: MelodyVoice;
  melodyProb: number;
  melodyLow: number;
  reverb: number; // send amount
  lowpass: number; // master music lowpass for this station
  level: number; // station fader level
}

// chord qualities
const MAJ7 = [0, 4, 7, 11];
const MAJ9 = [0, 4, 7, 11, 14];
const MAJ69 = [0, 4, 7, 9, 14];
const MIN7 = [0, 3, 7, 10];
const MIN9 = [0, 3, 7, 10, 14];
const MIN11 = [0, 3, 7, 10, 14, 17];
const DOM7 = [0, 4, 7, 10];
const DOM9 = [0, 4, 7, 10, 14];
const DOM13 = [0, 4, 10, 14, 21];
const DOM7B9 = [0, 4, 7, 10, 13];
const HALFDIM = [0, 3, 6, 10];
const SUS9 = [0, 5, 7, 10, 14];

const c = (r: number, q: readonly number[]): ChordDef => ({ r, q });

export const STATION_DEFS: StationDef[] = [
  {
    id: 'rainy-cafe',
    name: 'Rainy Café',
    description: 'Warm Rhodes, dusty boom-bap and jazzy sevenths. The house blend.',
    bpm: 78,
    key: 5, // F
    minor: false,
    swing: 0.22,
    barsPerChord: 1,
    progressions: [
      [c(0, MAJ9), c(9, MIN9), c(2, MIN9), c(7, DOM13)],
      [c(2, MIN9), c(7, DOM9), c(0, MAJ9), c(0, MAJ69)],
      [c(5, MAJ9), c(4, MIN7), c(9, MIN9), c(7, SUS9)],
      [c(0, MAJ9), c(4, DOM7B9), c(9, MIN9), c(2, DOM9)],
    ],
    keys: 'rhodes',
    keysCenter: 64,
    keysFilter: 3200,
    fmIndex: 1.4,
    tremoloHz: 4.2,
    tremoloDepth: 0.14,
    drums: 'boombap',
    bass: 'round',
    melody: 'bell',
    melodyProb: 0.35,
    melodyLow: 70,
    reverb: 0.28,
    lowpass: 4200,
    level: 0.55,
  },
  {
    id: 'late-night',
    name: 'Late Night',
    description: 'Slow, dark minor keys and long reverb tails for the 2am grind.',
    bpm: 70,
    key: 0, // C minor
    minor: true,
    swing: 0.18,
    barsPerChord: 1,
    progressions: [
      [c(0, MIN9), c(5, MIN9), c(8, MAJ7), c(7, DOM7B9)],
      [c(0, MIN11), c(10, DOM9), c(8, MAJ9), c(7, DOM7B9)],
      [c(2, HALFDIM), c(7, DOM7B9), c(0, MIN9), c(0, MIN11)],
      [c(8, MAJ9), c(7, MIN7), c(5, MIN9), c(7, DOM7B9)],
    ],
    keys: 'rhodes',
    keysCenter: 60,
    keysFilter: 2200,
    fmIndex: 0.9,
    tremoloHz: 3.4,
    tremoloDepth: 0.18,
    drums: 'lazy',
    bass: 'round',
    melody: 'bell',
    melodyProb: 0.25,
    melodyLow: 67,
    reverb: 0.5,
    lowpass: 3200,
    level: 0.55,
  },
  {
    id: 'sunny-bossa',
    name: 'Sunny Bossa',
    description: 'Bright bossa-nova comping, rim clicks and a breezy flute.',
    bpm: 92,
    key: 7, // G
    minor: false,
    swing: 0.04,
    barsPerChord: 1,
    progressions: [
      [c(0, MAJ9), c(2, DOM9), c(2, MIN9), c(7, DOM9)],
      [c(0, MAJ69), c(9, MIN9), c(2, MIN9), c(7, DOM13)],
      [c(4, MIN7), c(9, DOM7B9), c(2, MIN9), c(7, DOM9)],
      [c(5, MAJ9), c(5, MIN9), c(0, MAJ9), c(7, SUS9)],
    ],
    keys: 'rhodes',
    keysCenter: 66,
    keysFilter: 4200,
    fmIndex: 1.7,
    tremoloHz: 5,
    tremoloDepth: 0.08,
    drums: 'bossa',
    bass: 'bossa',
    melody: 'flute',
    melodyProb: 0.45,
    melodyLow: 72,
    reverb: 0.2,
    lowpass: 5500,
    level: 0.5,
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    description: 'Sparse ambient pads and soft kalimba. Minimal drums, maximum flow.',
    bpm: 60,
    key: 2, // D
    minor: false,
    swing: 0.1,
    barsPerChord: 2,
    progressions: [
      [c(0, MAJ9), c(7, MAJ9), c(9, MIN9), c(5, MAJ9)],
      [c(0, MAJ69), c(4, MIN7), c(5, MAJ9), c(5, MAJ9)],
      [c(9, MIN9), c(5, MAJ9), c(0, MAJ9), c(7, SUS9)],
    ],
    keys: 'pad',
    keysCenter: 62,
    keysFilter: 1500,
    fmIndex: 0,
    tremoloHz: 0.18,
    tremoloDepth: 0.15,
    drums: 'sparse',
    bass: 'drone',
    melody: 'kalimba',
    melodyProb: 0.3,
    melodyLow: 69,
    reverb: 0.55,
    lowpass: 3000,
    level: 0.6,
  },
  {
    id: 'chiptune-study',
    name: 'Chiptune Study',
    description: 'Soft 8-bit arpeggios and triangle bass, mellowed out for studying.',
    bpm: 96,
    key: 0, // C
    minor: false,
    swing: 0.12,
    barsPerChord: 1,
    progressions: [
      [c(0, MAJ7), c(9, MIN7), c(2, MIN7), c(7, DOM7)],
      [c(5, MAJ7), c(4, MIN7), c(9, MIN7), c(7, SUS9)],
      [c(9, MIN7), c(5, MAJ7), c(0, MAJ7), c(7, DOM7)],
    ],
    keys: 'chip',
    keysCenter: 66,
    keysFilter: 2600,
    fmIndex: 0,
    tremoloHz: 5.5,
    tremoloDepth: 0.05,
    drums: 'chip',
    bass: 'chip',
    melody: 'chip',
    melodyProb: 0.4,
    melodyLow: 74,
    reverb: 0.16,
    lowpass: 3600,
    level: 0.5,
  },
];

export const STATIONS: { id: StationId; name: string; description: string; bpm: number }[] = STATION_DEFS.map((d) => ({
  id: d.id,
  name: d.name,
  description: d.description,
  bpm: d.bpm,
}));

export function getStationDef(id: StationId): StationDef {
  return STATION_DEFS.find((d) => d.id === id) || STATION_DEFS[0];
}

// --- comping patterns: [step, durationInSteps]
type Hit = [number, number];
const COMP_WHOLE: Hit[] = [[0, 15]];
const COMP_REHIT: Hit[] = [[0, 9], [10, 6]];
const COMP_HALVES: Hit[] = [[0, 6], [6, 10]];
const COMP_LATE: Hit[] = [[3, 13]];
const COMP_PUSH: Hit[] = [[0, 7], [7, 2], [12, 4]];
const BOSSA_A: Hit[] = [[0, 2], [3, 2], [6, 3], [10, 2], [12, 3]];
const BOSSA_B: Hit[] = [[2, 2], [6, 2], [8, 3], [11, 2], [14, 2]];

interface MelNote {
  midi: number;
  dur: number; // steps
  vel: number;
}

/**
 * One station's generator. Owns its own sub-mix and a fader so the engine
 * can crossfade two of them.
 */
export class LofiPlayer {
  readonly def: StationDef;
  private ctx: AudioContext;
  private bank: NoiseBank;

  private fader: GainNode;
  private wetFader: GainNode;
  private keysBus: GainNode;
  private keysFilter: BiquadFilterNode;
  private bassBus: GainNode;
  private bassFilter: BiquadFilterNode;
  private drumBus: GainNode;
  private hatPan: StereoPannerNode;
  private melBus: GainNode;
  private melFilter: BiquadFilterNode;
  private melPan: StereoPannerNode;
  private sends: GainNode[] = [];
  private wow: GainNode;
  private lfos: OscillatorNode[] = [];
  private lfoGains: GainNode[] = [];
  private pulse: PeriodicWave | null = null;

  private stepDur: number;
  private nextTime: number;
  private step = 0;
  private bar = 0;
  private stopAt = Infinity;
  private alive = true;

  // section / bar state
  private sectionIdx = -1;
  private progIdx = 0;
  private prog: ChordDef[];
  private center: number;
  private dropFrom = -1;
  private drumsInSection = true;
  private barComputed = -1;
  private chord: ChordDef;
  private nextChord: ChordDef;
  private chordStart = true;
  private voicing: number[] = [];
  private lastVoicing: number[] = [];
  private comp = new Map<number, number>();
  private mel = new Map<number, MelNote>();
  private drumsOn = true;
  private fill = false;
  private kickExtra = -1;
  private lastMel = -1;
  private arpPos = 0;

  constructor(ctx: AudioContext, def: StationDef, bank: NoiseBank, dest: AudioNode, reverbIn: AudioNode, startTime: number) {
    this.ctx = ctx;
    this.def = def;
    this.bank = bank;
    this.stepDur = 60 / def.bpm / 4;
    this.nextTime = startTime;
    this.prog = def.progressions[0];
    this.chord = this.prog[0];
    this.nextChord = this.prog[1 % this.prog.length];
    this.center = def.keysCenter;

    const now = ctx.currentTime;

    this.fader = ctx.createGain();
    this.fader.gain.value = 0;
    this.fader.connect(dest);
    this.wetFader = ctx.createGain();
    this.wetFader.gain.value = 0;
    this.wetFader.connect(reverbIn);

    // keys: bus (tremolo) -> filter -> fader (+ reverb send)
    this.keysBus = ctx.createGain();
    this.keysBus.gain.value = 1 - def.tremoloDepth;
    this.keysFilter = ctx.createBiquadFilter();
    this.keysFilter.type = 'lowpass';
    this.keysFilter.frequency.value = def.keysFilter;
    this.keysFilter.Q.value = 0.5;
    this.keysBus.connect(this.keysFilter);
    this.keysFilter.connect(this.fader);
    this.addSend(this.keysFilter, def.reverb);

    const trem = this.lfo(def.tremoloHz, def.tremoloDepth, now);
    trem.connect(this.keysBus.gain);

    if (def.keys === 'pad') {
      // slow breathing filter on pads
      const fl = this.lfo(0.05, def.keysFilter * 0.35, now);
      fl.connect(this.keysFilter.frequency);
    }

    // tape wow + flutter, routed per note into oscillator detune (cents)
    this.wow = ctx.createGain();
    this.wow.gain.value = 1;
    this.lfo(0.45, def.keys === 'chip' ? 3 : 7, now).connect(this.wow);
    this.lfo(5.7, 1.6, now).connect(this.wow);

    // bass
    this.bassBus = ctx.createGain();
    this.bassFilter = ctx.createBiquadFilter();
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.value = def.bass === 'chip' ? 1800 : 520;
    this.bassFilter.Q.value = 0.7;
    this.bassBus.connect(this.bassFilter);
    this.bassFilter.connect(this.fader);

    // drums
    this.drumBus = ctx.createGain();
    this.drumBus.gain.value = def.drums === 'lazy' ? 0.8 : def.drums === 'sparse' ? 0.7 : 1;
    this.drumBus.connect(this.fader);
    this.addSend(this.drumBus, def.reverb * 0.3);
    this.hatPan = ctx.createStereoPanner();
    this.hatPan.pan.value = 0.25;
    this.hatPan.connect(this.drumBus);

    // melody
    this.melBus = ctx.createGain();
    this.melFilter = ctx.createBiquadFilter();
    this.melFilter.type = 'lowpass';
    this.melFilter.frequency.value = def.melody === 'chip' ? 3000 : 6000;
    this.melPan = ctx.createStereoPanner();
    this.melPan.pan.value = -0.22;
    this.melBus.connect(this.melFilter);
    this.melFilter.connect(this.melPan);
    this.melPan.connect(this.fader);
    this.addSend(this.melPan, def.reverb * 1.4);

    if (def.keys === 'chip' || def.melody === 'chip') this.pulse = createPulseWave(ctx, 0.25);
  }

  private addSend(from: AudioNode, amount: number): void {
    const g = this.ctx.createGain();
    g.gain.value = amount;
    from.connect(g);
    g.connect(this.wetFader);
    this.sends.push(g);
  }

  private lfo(freq: number, depth: number, now: number): GainNode {
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.value = depth;
    o.connect(g);
    o.start(now);
    this.lfos.push(o);
    this.lfoGains.push(g);
    return g;
  }

  fadeIn(t: number): void {
    this.fader.gain.cancelScheduledValues(t);
    this.fader.gain.setValueAtTime(0, t);
    this.fader.gain.setTargetAtTime(this.def.level, t, 0.45);
    this.wetFader.gain.cancelScheduledValues(t);
    this.wetFader.gain.setValueAtTime(0, t);
    this.wetFader.gain.setTargetAtTime(this.def.level, t, 0.45);
  }

  /** Fade out over ~1.5s; scheduling stops at the end of the fade. */
  fadeOut(now: number): void {
    smooth(this.fader.gain, 0, now, 0.35);
    smooth(this.wetFader.gain, 0, now, 0.35);
    this.stopAt = now + 1.6;
  }

  dispose(): void {
    if (!this.alive) return;
    this.alive = false;
    const t = this.ctx.currentTime;
    for (const o of this.lfos) {
      try {
        o.stop(t);
      } catch {
        /* */
      }
    }
    const all: AudioNode[] = [
      this.fader, this.wetFader, this.keysBus, this.keysFilter, this.bassBus, this.bassFilter,
      this.drumBus, this.hatPan, this.melBus, this.melFilter, this.melPan, this.wow,
      ...this.sends, ...this.lfos, ...this.lfoGains,
    ];
    for (const n of all) {
      try {
        n.disconnect();
      } catch {
        /* */
      }
    }
  }

  // ------------------------------------------------------------------ scheduling

  /** Schedule every 16th-step whose time falls before now + horizon. */
  schedule(now: number, horizon: number): void {
    if (!this.alive) return;
    if (this.nextTime < now - 0.5) {
      // Tab was throttled / context hiccup: skip ahead instead of bursting.
      const n = Math.ceil((now - this.nextTime) / this.stepDur);
      const total = this.step + n;
      this.bar += Math.floor(total / 16);
      this.step = total % 16;
      this.nextTime += n * this.stepDur;
    }
    const end = Math.min(now + horizon, this.stopAt);
    let guard = 0;
    while (this.nextTime < end && guard++ < 256) {
      this.ensureBar();
      if (this.nextTime >= now - 0.01) this.playStep(this.step, this.nextTime, now);
      this.nextTime += this.stepDur;
      this.step++;
      if (this.step >= 16) {
        this.step = 0;
        this.bar++;
      }
    }
  }

  private newSection(sec: number): void {
    const d = this.def;
    this.sectionIdx = sec;
    if (sec === 0) {
      this.progIdx = 0;
    } else if (chance(0.35)) {
      this.progIdx = 0;
    } else {
      const others: number[] = [];
      for (let i = 0; i < d.progressions.length; i++) if (i !== this.progIdx) others.push(i);
      this.progIdx = pick(others);
    }
    this.prog = d.progressions[this.progIdx];
    this.center = d.keysCenter + (sec === 0 ? 0 : pick([-3, -1, 0, 0, 2, 4]));
    this.dropFrom = sec > 0 && chance(0.3) ? pick([0, 6]) : -1;
    this.drumsInSection = d.drums === 'sparse' ? sec > 0 && chance(0.65) : true;
  }

  private ensureBar(): void {
    if (this.bar === this.barComputed) return;
    this.barComputed = this.bar;
    const d = this.def;
    const sec = Math.floor(this.bar / 8);
    if (sec !== this.sectionIdx) this.newSection(sec);
    const inSec = this.bar % 8;
    const bpc = d.barsPerChord;
    const ci = Math.floor(inSec / bpc) % this.prog.length;
    this.chord = this.prog[ci];
    this.nextChord = this.prog[(ci + 1) % this.prog.length];
    this.chordStart = inSec % bpc === 0;
    const dropped = this.dropFrom >= 0 && inSec >= this.dropFrom && inSec < this.dropFrom + 2;
    this.drumsOn = this.drumsInSection && !dropped;
    this.fill = inSec === 7;
    this.kickExtra = chance(0.3) ? pick([3, 7, 14]) : -1;

    if (this.chordStart) {
      const includeRoot = d.keys !== 'rhodes';
      this.voicing = this.computeVoicing(this.chord, includeRoot, d.keys === 'pad' ? 5 : 4);
      this.lastVoicing = this.voicing;
    }

    // keys comping for this bar
    this.comp.clear();
    if (d.keys === 'rhodes') {
      let pattern: Hit[];
      if (d.drums === 'bossa') pattern = this.bar % 2 === 0 ? BOSSA_A : BOSSA_B;
      else if (!this.drumsOn) pattern = weighted([[COMP_WHOLE, 0.7], [COMP_LATE, 0.3]] as const);
      else if (d.id === 'late-night') pattern = weighted([[COMP_WHOLE, 0.5], [COMP_LATE, 0.3], [COMP_REHIT, 0.2]] as const);
      else
        pattern = weighted([
          [COMP_WHOLE, 0.28],
          [COMP_REHIT, 0.24],
          [COMP_HALVES, 0.16],
          [COMP_LATE, 0.18],
          [COMP_PUSH, 0.14],
        ] as const);
      for (const [s, dur] of pattern) this.comp.set(s, dur);
    } else if (d.keys === 'pad') {
      if (this.chordStart) this.comp.set(0, 16 * bpc);
    } else if (d.keys === 'chip') {
      this.comp.set(0, 15); // soft triangle chord bed; arps fill the rest
    }

    // melody phrase for this bar
    this.mel.clear();
    let p = d.melodyProb * (this.drumsOn ? 1 : 1.5);
    if (this.bar < 2) p = 0; // let the intro breathe
    if (chance(p)) this.planMelody();
  }

  private computeVoicing(ch: ChordDef, includeRoot: boolean, maxNotes: number): number[] {
    const rootPc = (this.def.key + ch.r) % 12;
    let ivs = ch.q.slice();
    if (!includeRoot) ivs = ivs.filter((i) => i !== 0);
    while (ivs.length > maxNotes) {
      const i5 = ivs.indexOf(7);
      if (i5 >= 0) ivs.splice(i5, 1);
      else if (ivs.indexOf(0) >= 0) ivs.splice(ivs.indexOf(0), 1);
      else ivs.pop();
    }
    const pcs = ivs.map((i) => (rootPc + i) % 12);
    let best: number[] = [];
    let bestScore = Infinity;
    for (let k = 0; k < pcs.length; k++) {
      const rot = pcs.slice(k).concat(pcs.slice(0, k));
      const v: number[] = [];
      for (const pc of rot) {
        let n = pc;
        if (v.length) while (n <= v[v.length - 1]) n += 12;
        v.push(n);
      }
      const mean = v.reduce((a, b) => a + b, 0) / v.length;
      const shift = Math.round((this.center - mean) / 12) * 12;
      const vv = v.map((n) => n + shift);
      let score = Math.abs(mean + shift - this.center);
      if (this.lastVoicing.length) score += 0.35 * voiceDist(vv, this.lastVoicing);
      score += Math.random() * 1.5;
      if (score < bestScore) {
        bestScore = score;
        best = vv;
      }
    }
    // avoid muddy close intervals low down
    if (best.length > 1 && best[0] < 57 && best[1] - best[0] <= 2) {
      best[0] += 12;
      best.sort((a, b) => a - b);
    }
    return best;
  }

  private melodyScale(ch: ChordDef): number[] {
    const d = this.def;
    const penta = d.minor ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9];
    const rootPc = (d.key + ch.r) % 12;
    const chordPcs = ch.q.map((i) => (rootPc + i) % 12);
    const allowed = new Set<number>();
    for (const s of penta) {
      const pc = (d.key + s) % 12;
      const isTone = chordPcs.indexOf(pc) >= 0;
      const clash = chordPcs.some((cp) => {
        const diff = (pc - cp + 12) % 12;
        return diff === 1 || diff === 11;
      });
      if (isTone || !clash) allowed.add(pc);
    }
    for (const i of ch.q) if (i % 12 !== 1) allowed.add((rootPc + i) % 12);
    const out: number[] = [];
    for (let m = d.melodyLow; m <= d.melodyLow + 15; m++) if (allowed.has(m % 12)) out.push(m);
    return out;
  }

  private planMelody(): void {
    const d = this.def;
    const scale = this.melodyScale(this.chord);
    if (!scale.length) return;
    const isChip = d.melody === 'chip';
    const n = isChip ? randInt(3, 6) : d.melody === 'kalimba' ? randInt(2, 5) : randInt(2, 4);
    const pool = isChip ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 2, 3, 6, 8, 10, 11, 14];
    const slots: number[] = [];
    const avail = pool.slice();
    while (slots.length < n && avail.length) slots.push(avail.splice(Math.floor(Math.random() * avail.length), 1)[0]);
    slots.sort((a, b) => a - b);

    // continue from the previous melody note when possible
    let idx: number;
    if (this.lastMel < 0) idx = Math.floor(scale.length / 2);
    else {
      idx = 0;
      let bestD = Infinity;
      for (let i = 0; i < scale.length; i++) {
        const dd = Math.abs(scale[i] - this.lastMel);
        if (dd < bestD) {
          bestD = dd;
          idx = i;
        }
      }
    }
    for (let i = 0; i < slots.length; i++) {
      idx += pick([-2, -1, -1, 0, 1, 1, 2]);
      if (idx < 0) idx = 1;
      if (idx >= scale.length) idx = scale.length - 2;
      idx = Math.max(0, Math.min(scale.length - 1, idx));
      const next = i + 1 < slots.length ? slots[i + 1] : slots[i] + randInt(3, 6);
      const dur = Math.max(1, next - slots[i]);
      const midi = scale[idx];
      this.mel.set(slots[i], { midi, dur, vel: rand(0.5, 0.85) });
      this.lastMel = midi;
    }
  }

  // ------------------------------------------------------------------ per-step playback

  private playStep(step: number, t0: number, now: number): void {
    const d = this.def;
    const swing = step % 2 === 1 ? d.swing * this.stepDur : 0;
    const t = Math.max(now, t0 + swing);
    const hum = () => Math.max(now, t + rand(-0.004, 0.007));

    // drums
    this.playDrums(step, t, hum);

    // bass
    this.playBass(step, t);

    // keys
    const compDur = this.comp.get(step);
    if (compDur !== undefined) {
      const durS = compDur * this.stepDur;
      const accent = step === 0 ? 1 : 0.85;
      if (d.keys === 'rhodes') {
        const vel = rand(0.6, 0.85) * accent * (d.drums === 'bossa' ? 0.8 : 1);
        const roll = rand(0.005, 0.016);
        const up = chance(0.75);
        this.voicing.forEach((m, i) => {
          const k = up ? i : this.voicing.length - 1 - i;
          this.rhodesNote(m, t + k * roll + rand(0, 0.004), durS, vel * rand(0.88, 1.05));
        });
      } else if (d.keys === 'pad') {
        this.voicing.forEach((m) => this.padNote(m, t + rand(0, 0.05), durS + 0.3, rand(0.75, 1)));
      } else if (d.keys === 'chip') {
        this.voicing.forEach((m) => this.chipPadNote(m, t, durS));
      }
    }
    if (d.keys === 'chip') this.playArp(step, t);

    // melody
    const mn = this.mel.get(step);
    if (mn) this.melodyNote(mn.midi, hum(), mn.dur * this.stepDur, mn.vel);
  }

  private playDrums(step: number, t: number, hum: () => number): void {
    const d = this.def;
    const on = this.drumsOn;
    switch (d.drums) {
      case 'boombap':
      case 'lazy': {
        const lazy = d.drums === 'lazy';
        if (on) {
          if (step === 0) this.kick(hum(), rand(0.85, 1));
          if (step === 10) this.kick(hum(), rand(0.7, 0.85));
          if (step === this.kickExtra) this.kick(hum(), rand(0.45, 0.6));
          if (step === 4 || step === 12) lazy ? this.rim(hum() + 0.01, rand(0.7, 0.9)) : this.snare(hum() + 0.008, rand(0.75, 0.95));
          if (!lazy && (step === 7 || step === 15) && chance(0.18)) this.snare(hum(), rand(0.15, 0.25));
          if (this.fill && step >= 13 && chance(0.5)) this.snare(hum(), rand(0.2, 0.45));
        }
        // hats keep going a little even in drops
        const hatOn = on || chance(0.25);
        if (hatOn) {
          if (step % 2 === 0) {
            if (!lazy || step % 4 === 0 || chance(0.5)) {
              const open = step === 14 && chance(0.12);
              this.hat(hum(), (step % 4 === 0 ? 0.55 : 0.38) * rand(0.8, 1.1) * (on ? 1 : 0.5), open);
            }
          } else if (!lazy && chance(0.12)) this.hat(hum(), 0.2, false);
        }
        break;
      }
      case 'bossa': {
        if (on) {
          if (step === 0 || step === 8) this.kick(hum(), rand(0.6, 0.72));
          if (step === 6 || step === 14) this.kick(hum(), rand(0.4, 0.5));
          const clave = this.bar % 2 === 0 ? [0, 6, 12] : [4, 10];
          if (clave.indexOf(step) >= 0) this.rim(hum(), rand(0.55, 0.75));
        }
        if (on || chance(0.3)) this.shaker(hum(), step % 2 === 0 ? rand(0.32, 0.4) : rand(0.16, 0.24));
        break;
      }
      case 'sparse': {
        if (!on) break;
        if (step === 0) this.kick(hum(), 0.55);
        if (step === 10 && chance(0.25)) this.kick(hum(), 0.35);
        if (step === 4 || step === 12) this.brush(hum(), rand(0.3, 0.42));
        if (step % 2 === 0 && chance(0.45)) this.shaker(hum(), rand(0.1, 0.16));
        break;
      }
      case 'chip': {
        if (on) {
          if (step === 0 || (step === 10 && chance(0.7)) || step === this.kickExtra) this.chipKick(t, step === 0 ? 0.9 : 0.7);
          if (step === 4 || step === 12) this.chipSnare(t, 0.8);
          if (this.fill && step >= 14) this.chipSnare(t, 0.4);
        }
        if ((on || chance(0.3)) && step % 2 === 0) this.chipHat(t, step % 4 === 0 ? 0.5 : 0.35);
        break;
      }
    }
  }

  private bassMidi(ch: ChordDef): number {
    let m = 36 + ((this.def.key + ch.r) % 12);
    if (m > 45) m -= 12;
    return m;
  }

  private playBass(step: number, t: number): void {
    const d = this.def;
    const root = this.bassMidi(this.chord);
    const fifth = root + (this.chord.q.indexOf(6) >= 0 ? 6 : 7);
    const sd = this.stepDur;
    switch (d.bass) {
      case 'round': {
        if (step === 0) this.bassNote(root, t, 7 * sd, rand(0.85, 1));
        else if (step === 10 && (this.drumsOn ? chance(0.7) : chance(0.3))) {
          const n = weighted([[root, 0.5], [fifth, 0.3], [root + 12, 0.2]] as const);
          this.bassNote(n, t, 3.5 * sd, rand(0.65, 0.8));
        } else if (step === 14 && this.nextChord !== this.chord && chance(0.3)) {
          const target = this.bassMidi(this.nextChord);
          this.bassNote(target + pick([-1, 1]), t, 1.6 * sd, rand(0.45, 0.6));
        }
        break;
      }
      case 'bossa': {
        if (step === 0) this.bassNote(root, t, 5 * sd, 0.9);
        else if (step === 6) this.bassNote(fifth - 12 >= 33 ? fifth - 12 : fifth, t, 1.8 * sd, 0.65);
        else if (step === 8) this.bassNote(fifth - 12 >= 33 ? fifth - 12 : fifth, t, 5 * sd, 0.75);
        else if (step === 14) this.bassNote(root, t, 1.8 * sd, 0.6);
        break;
      }
      case 'drone': {
        if (step === 0 && this.chordStart) this.bassNote(root, t, 16 * d.barsPerChord * sd, 0.9);
        break;
      }
      case 'chip': {
        const pat: Record<number, number> = { 0: root, 4: root + 12, 8: root, 10: fifth, 12: root + 12 };
        const n = pat[step];
        if (n !== undefined) this.bassNote(n, t, (step === 0 || step === 8 ? 2.6 : 1.6) * sd, step === 0 ? 1 : 0.75);
        break;
      }
    }
  }

  private playArp(step: number, t: number): void {
    if (!this.voicing.length) return;
    if (chance(0.08) && step % 4 !== 0) return; // breathing rests
    const tones = this.voicing.slice();
    tones.push(tones[0] + 12);
    const n = tones.length;
    const cycle = n * 2 - 2;
    const pos = this.arpPos % cycle;
    const i = pos < n ? pos : cycle - pos;
    this.arpPos++;
    const vel = step % 4 === 0 ? 0.9 : step % 2 === 0 ? 0.7 : 0.55;
    this.chipNote(tones[i] + 12, t, this.stepDur * 1.5, vel, this.keysBus, 0.022);
  }

  // ------------------------------------------------------------------ voices

  private attachWow(osc: OscillatorNode): () => void {
    this.wow.connect(osc.detune);
    return () => {
      try {
        this.wow.disconnect(osc.detune);
      } catch {
        /* */
      }
    };
  }

  private rhodesNote(midi: number, t: number, dur: number, vel: number): void {
    const ctx = this.ctx;
    const f = mtof(midi);
    const car = ctx.createOscillator();
    car.frequency.value = f;
    const mod = ctx.createOscillator();
    mod.frequency.value = f;
    const modG = ctx.createGain();
    const idx = this.def.fmIndex * (0.5 + 0.7 * vel);
    modG.gain.setValueAtTime(f * idx, t);
    modG.gain.setTargetAtTime(f * idx * 0.12, t, 0.14);
    mod.connect(modG);
    modG.connect(car.frequency);

    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.value = f;
    body.detune.value = rand(-6, 6);
    const bodyG = ctx.createGain();
    bodyG.gain.value = 0.28;
    body.connect(bodyG);

    const env = ctx.createGain();
    const peak = 0.05 * vel;
    const decay = Math.max(0.35, Math.min(1.2, 0.8 + (64 - midi) * 0.03));
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + 0.012);
    env.gain.setTargetAtTime(peak * 0.28, t + 0.012, decay);
    const rel = t + Math.max(0.06, dur);
    env.gain.setTargetAtTime(0, rel, 0.16);
    car.connect(env);
    bodyG.connect(env);
    env.connect(this.keysBus);

    const un1 = this.attachWow(car);
    const un2 = this.attachWow(body);
    const end = rel + 1.0;
    car.start(t);
    mod.start(t);
    body.start(t);
    car.stop(end);
    mod.stop(end);
    body.stop(end);
    cleanup(car, [car, mod, modG, body, bodyG, env], () => {
      un1();
      un2();
    });
  }

  private padNote(midi: number, t: number, dur: number, vel: number): void {
    const ctx = this.ctx;
    const f = mtof(midi);
    const env = ctx.createGain();
    const peak = 0.03 * vel;
    env.gain.setValueAtTime(0, t);
    env.gain.setTargetAtTime(peak, t, 0.55);
    env.gain.setTargetAtTime(0, t + dur, 0.9);
    env.connect(this.keysBus);
    const oscs: OscillatorNode[] = [];
    const unhooks: (() => void)[] = [];
    for (const det of [-7, 7]) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.detune.value = det + rand(-2, 2);
      o.connect(env);
      unhooks.push(this.attachWow(o));
      oscs.push(o);
    }
    const end = t + dur + 5;
    for (const o of oscs) {
      o.start(t);
      o.stop(end);
    }
    cleanup(oscs[0], [...oscs, env], () => unhooks.forEach((u) => u()));
  }

  private chipPadNote(midi: number, t: number, dur: number): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = mtof(midi);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.018, t + 0.02);
    env.gain.setTargetAtTime(0.01, t + 0.02, 0.4);
    env.gain.setTargetAtTime(0, t + dur, 0.08);
    o.connect(env);
    env.connect(this.keysBus);
    o.start(t);
    o.stop(t + dur + 0.6);
    cleanup(o, [o, env]);
  }

  private chipNote(midi: number, t: number, dur: number, vel: number, dest: AudioNode, level: number, vibrato = false): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    if (this.pulse) o.setPeriodicWave(this.pulse);
    else o.type = 'square';
    const f = mtof(midi);
    o.frequency.value = f;
    const env = ctx.createGain();
    const peak = level * vel;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + 0.006);
    env.gain.setTargetAtTime(peak * 0.45, t + 0.006, 0.09);
    env.gain.setTargetAtTime(0, t + dur, 0.035);
    o.connect(env);
    env.connect(dest);
    const nodes: AudioNode[] = [o, env];
    let vib: OscillatorNode | null = null;
    if (vibrato && dur > 0.25) {
      vib = ctx.createOscillator();
      vib.frequency.value = 5.5;
      const vg = ctx.createGain();
      vg.gain.setValueAtTime(0, t);
      vg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(0.35, dur));
      vib.connect(vg);
      vg.connect(o.frequency);
      vib.start(t);
      nodes.push(vib, vg);
    }
    const end = t + dur + 0.3;
    o.start(t);
    o.stop(end);
    if (vib) vib.stop(end);
    cleanup(o, nodes);
  }

  private bassNote(midi: number, t: number, dur: number, vel: number): void {
    const ctx = this.ctx;
    const d = this.def;
    const f = mtof(midi);
    const env = ctx.createGain();
    const nodes: AudioNode[] = [env];
    const oscs: OscillatorNode[] = [];
    if (d.bass === 'chip') {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.connect(env);
      oscs.push(o);
      const peak = 0.2 * vel;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(peak, t + 0.005);
      env.gain.setTargetAtTime(peak * 0.7, t + 0.005, 0.2);
      env.gain.setTargetAtTime(0, t + dur, 0.03);
    } else {
      const s = ctx.createOscillator();
      s.type = 'sine';
      s.frequency.setValueAtTime(f * 1.015, t);
      s.frequency.setTargetAtTime(f, t, 0.025);
      s.connect(env);
      oscs.push(s);
      if (d.bass !== 'drone') {
        const tri = ctx.createOscillator();
        tri.type = 'triangle';
        tri.frequency.value = f;
        const tg = ctx.createGain();
        tg.gain.value = 0.4;
        tri.connect(tg);
        tg.connect(env);
        oscs.push(tri);
        nodes.push(tg);
      }
      if (d.bass === 'drone') {
        const peak = 0.16 * vel;
        env.gain.setValueAtTime(0, t);
        env.gain.setTargetAtTime(peak, t, 0.35);
        env.gain.setTargetAtTime(0, t + dur, 0.6);
      } else {
        const peak = 0.22 * vel;
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(peak, t + 0.012);
        env.gain.setTargetAtTime(peak * 0.55, t + 0.012, 0.45);
        env.gain.setTargetAtTime(0, t + dur, 0.06);
      }
    }
    env.connect(this.bassBus);
    const end = t + dur + (d.bass === 'drone' ? 3.5 : 0.5);
    for (const o of oscs) {
      o.start(t);
      o.stop(end);
    }
    cleanup(oscs[0], [...oscs, ...nodes]);
  }

  private melodyNote(midi: number, t: number, dur: number, vel: number): void {
    const ctx = this.ctx;
    const d = this.def;
    const f = mtof(midi);
    if (d.melody === 'chip') {
      this.chipNote(midi, t, dur, vel, this.melBus, 0.026, true);
      return;
    }
    const env = ctx.createGain();
    env.connect(this.melBus);
    const car = ctx.createOscillator();
    car.frequency.value = f;
    car.connect(env);
    const nodes: AudioNode[] = [car, env];
    const extra: OscillatorNode[] = [];
    let end: number;

    if (d.melody === 'flute') {
      const peak = 0.04 * vel;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(peak, t + 0.07);
      env.gain.setTargetAtTime(peak * 0.8, t + 0.07, 0.3);
      env.gain.setTargetAtTime(0, t + dur, 0.1);
      const vib = ctx.createOscillator();
      vib.frequency.value = 5;
      const vg = ctx.createGain();
      vg.gain.setValueAtTime(0, t);
      vg.gain.linearRampToValueAtTime(f * 0.007, t + 0.35);
      vib.connect(vg);
      vg.connect(car.frequency);
      extra.push(vib);
      nodes.push(vib, vg);
      // breath
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = Math.min(9000, f * 2);
      bp.Q.value = 1.2;
      const bg = ctx.createGain();
      percEnv(bg.gain, t, 0.05 * vel, 0.03, 0.06);
      bp.connect(bg);
      bg.connect(env);
      const ns = noiseShot(ctx, this.bank.white, bp, t, 0.3);
      nodes.push(bp, bg, ns);
      end = t + dur + 0.6;
    } else {
      // 'bell' (glassy e-piano / vibes) or 'kalimba'
      const kal = d.melody === 'kalimba';
      const mod = ctx.createOscillator();
      mod.frequency.value = f * (kal ? 5.2 : 4);
      const mg = ctx.createGain();
      mg.gain.setValueAtTime(f * (kal ? 0.9 : 0.7) * vel, t);
      mg.gain.setTargetAtTime(0, t, kal ? 0.03 : 0.06);
      mod.connect(mg);
      mg.connect(car.frequency);
      extra.push(mod);
      nodes.push(mod, mg);
      const peak = (kal ? 0.06 : 0.045) * vel;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(peak, t + 0.004);
      env.gain.setTargetAtTime(0, t + 0.004, kal ? 0.45 : 0.6);
      env.gain.setTargetAtTime(0, t + dur + 0.25, 0.15);
      end = t + Math.min(dur + 1.2, 3);
    }
    car.start(t);
    car.stop(end);
    for (const o of extra) {
      o.start(t);
      o.stop(end);
    }
    cleanup(car, nodes);
  }

  // ------------------------------------------------------------------ drums

  private kick(t: number, vel: number): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(115, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.13);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.4 * vel, t + 0.004);
    g.gain.setTargetAtTime(0, t + 0.03, 0.09);
    o.connect(g);
    g.connect(this.drumBus);
    o.start(t);
    o.stop(t + 0.7);
    cleanup(o, [o, g]);
  }

  private snare(t: number, vel: number): void {
    const ctx = this.ctx;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.7;
    const ng = ctx.createGain();
    percEnv(ng.gain, t, 0.17 * vel, 0.002, 0.065);
    bp.connect(ng);
    ng.connect(this.drumBus);
    const ns = noiseShot(ctx, this.bank.white, bp, t, 0.45);

    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(200, t);
    body.frequency.exponentialRampToValueAtTime(150, t + 0.06);
    const bg = ctx.createGain();
    percEnv(bg.gain, t, 0.1 * vel, 0.002, 0.04);
    body.connect(bg);
    bg.connect(this.drumBus);
    body.start(t);
    body.stop(t + 0.3);
    cleanup(ns, [ns, bp, ng, body, bg]);
  }

  private rim(t: number, vel: number): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = 820;
    const g = ctx.createGain();
    percEnv(g.gain, t, 0.07 * vel, 0.001, 0.018);
    o.connect(g);
    g.connect(this.drumBus);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3000;
    bp.Q.value = 1.5;
    const ng = ctx.createGain();
    percEnv(ng.gain, t, 0.1 * vel, 0.001, 0.012);
    bp.connect(ng);
    ng.connect(this.drumBus);
    const ns = noiseShot(ctx, this.bank.white, bp, t, 0.15);
    o.start(t);
    o.stop(t + 0.15);
    cleanup(ns, [ns, bp, ng, o, g]);
  }

  private brush(t: number, vel: number): void {
    const ctx = this.ctx;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3200;
    bp.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06 * vel, t + 0.035);
    g.gain.setTargetAtTime(0, t + 0.035, 0.12);
    bp.connect(g);
    g.connect(this.drumBus);
    const ns = noiseShot(ctx, this.bank.pink, bp, t, 0.8);
    cleanup(ns, [ns, bp, g]);
  }

  private hat(t: number, vel: number, open: boolean): void {
    const ctx = this.ctx;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6500;
    const g = ctx.createGain();
    percEnv(g.gain, t, 0.09 * vel, 0.001, open ? 0.12 : 0.022);
    hp.connect(g);
    g.connect(this.hatPan);
    const ns = noiseShot(ctx, this.bank.white, hp, t, open ? 0.7 : 0.15);
    cleanup(ns, [ns, hp, g]);
  }

  private shaker(t: number, vel: number): void {
    const ctx = this.ctx;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 6000;
    bp.Q.value = 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.08 * vel, t + 0.012);
    g.gain.setTargetAtTime(0, t + 0.012, 0.03);
    bp.connect(g);
    g.connect(this.hatPan);
    const ns = noiseShot(ctx, this.bank.white, bp, t, 0.2);
    cleanup(ns, [ns, bp, g]);
  }

  private chipKick(t: number, vel: number): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.09);
    const g = ctx.createGain();
    percEnv(g.gain, t, 0.32 * vel, 0.002, 0.06);
    o.connect(g);
    g.connect(this.drumBus);
    o.start(t);
    o.stop(t + 0.4);
    cleanup(o, [o, g]);
  }

  private chipSnare(t: number, vel: number): void {
    const ctx = this.ctx;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 4500;
    const g = ctx.createGain();
    percEnv(g.gain, t, 0.12 * vel, 0.001, 0.05);
    lp.connect(g);
    g.connect(this.drumBus);
    const ns = noiseShot(ctx, this.bank.white, lp, t, 0.35);
    cleanup(ns, [ns, lp, g]);
  }

  private chipHat(t: number, vel: number): void {
    const ctx = this.ctx;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    percEnv(g.gain, t, 0.07 * vel, 0.001, 0.012);
    hp.connect(g);
    g.connect(this.hatPan);
    const ns = noiseShot(ctx, this.bank.white, hp, t, 0.1);
    cleanup(ns, [ns, hp, g]);
  }
}

function voiceDist(a: number[], b: number[]): number {
  let s = 0;
  for (const x of a) {
    let m = Infinity;
    for (const y of b) m = Math.min(m, Math.abs(x - y));
    s += m;
  }
  return s / a.length;
}
