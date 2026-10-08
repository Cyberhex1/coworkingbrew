// CoworkingBrew audio engine — pure Web Audio, no assets.
//
// Graph:
//   players ─┬─────────────► musicMix ─► HP ─► LP(station) ─► comp ─► musicGain ─┐
//            └─► musicVerb ─► verbReturn ─┘                                        │
//   ambience layers ─► ambMix ─► ambLP (focus muffle) ─► ambGain ──────────────────┤
//   sfx/chimes ─► sfxBus (+ sfxVerb) ──────────────────────────────────────────────┤
//                                                       masterGain ◄───────────────┘
//                                                           └─► limiter ─► destination

import { AMBIENCES, AmbienceMixer } from './ambience';
import type { AmbienceId } from './ambience';
import { getStationDef, LofiPlayer, STATIONS } from './lofi';
import type { StationId } from './lofi';
import { createImpulse, createNoiseBank } from './noise';
import type { NoiseBank } from './noise';
import { SfxKit } from './sfx';
import type { ChimeKind, SfxName } from './sfx';
import { clamp01, smooth } from './util';

export type { StationId } from './lofi';
export type { AmbienceId } from './ambience';
export type { SfxName, ChimeKind } from './sfx';
export { STATIONS } from './lofi';
export { AMBIENCES } from './ambience';

export interface AudioState {
  unlocked: boolean;
  musicOn: boolean;
  station: StationId;
  master: number;
  music: number;
}

interface Graph {
  ctx: AudioContext;
  bank: NoiseBank;
  masterGain: GainNode;
  limiter: DynamicsCompressorNode;
  musicMix: GainNode;
  musicHP: BiquadFilterNode;
  musicLP: BiquadFilterNode;
  musicComp: DynamicsCompressorNode;
  musicGain: GainNode;
  musicVerb: ConvolverNode;
  verbReturn: GainNode;
  ambMix: GainNode;
  ambLP: BiquadFilterNode;
  ambGain: GainNode;
  sfxBus: GainNode;
  sfxVerb: ConvolverNode;
  sfxVerbReturn: GainNode;
  ambience: AmbienceMixer;
  sfx: SfxKit;
}

type AudioContextCtor = typeof AudioContext;

const SCHED_INTERVAL_MS = 25;
const LOOKAHEAD = 0.15; // seconds, visible tab
const LOOKAHEAD_HIDDEN = 1.2; // background tabs throttle timers to ~1/s

export class AudioEngine {
  private g: Graph | null = null;
  private _unlocked = false;
  private state = {
    master: 0.7,
    music: 0.6,
    musicOn: false,
    station: 'rainy-cafe' as StationId,
  };
  private amb: Record<AmbienceId, number> = {
    rain: 0,
    cafe: 0,
    fire: 0,
    birds: 0,
    crickets: 0,
    water: 0,
    vinyl: 0,
  };
  private prox = { music: 1, cafe: 1, fire: 0 };
  private focus = false;
  private listeners = new Set<() => void>();
  private snapshot: AudioState;
  private current: LofiPlayer | null = null;
  private players: LofiPlayer[] = [];
  private timer: number | null = null;
  private musicOffTimer: number | null = null;
  private unlocking: Promise<void> | null = null;
  private visHandler: (() => void) | null = null;

  constructor() {
    this.snapshot = this.makeSnapshot();
    if (typeof document !== 'undefined') {
      this.visHandler = () => this.onVisibility();
      document.addEventListener('visibilitychange', this.visHandler);
    }
  }

  get unlocked(): boolean {
    return this._unlocked;
  }

  // ------------------------------------------------------------------ lifecycle

  unlock(): Promise<void> {
    if (this._unlocked && this.g && this.g.ctx.state === 'running') return Promise.resolve();
    if (this.unlocking) return this.unlocking;
    this.unlocking = this.doUnlock().finally(() => {
      this.unlocking = null;
    });
    return this.unlocking;
  }

  private async doUnlock(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!this.g) {
      const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
      const Ctor = w.AudioContext || w.webkitAudioContext;
      if (!Ctor) return;
      let ctx: AudioContext;
      try {
        ctx = new Ctor();
      } catch {
        return;
      }
      this.g = this.buildGraph(ctx);
    }
    const ctx = this.g.ctx;
    if ((ctx.state as string) !== 'running') {
      try {
        await ctx.resume();
      } catch {
        /* needs a user gesture; try again on the next call */
      }
    }
    if ((ctx.state as string) === 'running' && !this._unlocked) {
      this._unlocked = true;
      this.applyAll();
      this.startTimer();
      this.emit();
    }
  }

  /** Tear everything down (used for HMR / unmount of the whole app). */
  dispose(): void {
    this.stopTimer();
    if (this.visHandler && typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.visHandler);
    this.visHandler = null;
    for (const p of this.players) p.dispose();
    this.players = [];
    this.current = null;
    if (this.g) {
      this.g.ambience.dispose();
      this.g.ctx.close().catch(() => undefined);
      this.g = null;
    }
    this._unlocked = false;
    this.emit();
  }

  private buildGraph(ctx: AudioContext): Graph {
    const bank = createNoiseBank(ctx, 4);
    const nyq = ctx.sampleRate / 2;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -2;
    limiter.knee.value = 2;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.2;
    limiter.connect(ctx.destination);

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(limiter);

    // music chain
    const musicMix = ctx.createGain();
    const musicHP = ctx.createBiquadFilter();
    musicHP.type = 'highpass';
    musicHP.frequency.value = 35;
    musicHP.Q.value = 0.6;
    const musicLP = ctx.createBiquadFilter();
    musicLP.type = 'lowpass';
    musicLP.frequency.value = getStationDef(this.state.station).lowpass;
    musicLP.Q.value = 0.55;
    const musicComp = ctx.createDynamicsCompressor();
    musicComp.threshold.value = -16;
    musicComp.knee.value = 10;
    musicComp.ratio.value = 2.5;
    musicComp.attack.value = 0.015;
    musicComp.release.value = 0.3;
    const musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicMix.connect(musicHP);
    musicHP.connect(musicLP);
    musicLP.connect(musicComp);
    musicComp.connect(musicGain);
    musicGain.connect(masterGain);

    const musicVerb = ctx.createConvolver();
    musicVerb.buffer = createImpulse(ctx, 2.8, 2.6);
    const verbReturn = ctx.createGain();
    verbReturn.gain.value = 0.55;
    musicVerb.connect(verbReturn);
    verbReturn.connect(musicMix);

    // ambience chain
    const ambMix = ctx.createGain();
    const ambLP = ctx.createBiquadFilter();
    ambLP.type = 'lowpass';
    ambLP.frequency.value = Math.min(20000, nyq - 200);
    ambLP.Q.value = 0.5;
    const ambGain = ctx.createGain();
    ambGain.gain.value = 1;
    ambMix.connect(ambLP);
    ambLP.connect(ambGain);
    ambGain.connect(masterGain);

    // sfx chain
    const sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.9;
    sfxBus.connect(masterGain);
    const sfxVerb = ctx.createConvolver();
    sfxVerb.buffer = createImpulse(ctx, 1.8, 3);
    const sfxVerbReturn = ctx.createGain();
    sfxVerbReturn.gain.value = 0.5;
    sfxVerb.connect(sfxVerbReturn);
    sfxVerbReturn.connect(sfxBus);

    const ambience = new AmbienceMixer(ctx, bank, ambMix);
    const sfx = new SfxKit(ctx, bank, sfxBus, sfxVerb);

    return {
      ctx, bank, masterGain, limiter, musicMix, musicHP, musicLP, musicComp, musicGain, musicVerb, verbReturn,
      ambMix, ambLP, ambGain, sfxBus, sfxVerb, sfxVerbReturn, ambience, sfx,
    };
  }

  private applyAll(): void {
    const g = this.g;
    if (!g) return;
    smooth(g.masterGain.gain, this.state.master, g.ctx.currentTime, 0.08);
    if (this.state.musicOn) this.startMusic();
    this.applyMusicGain(0.3);
    this.applyFocus();
    this.updateAmbience(0.3);
  }

  // ------------------------------------------------------------------ scheduler

  private startTimer(): void {
    if (this.timer !== null || typeof window === 'undefined') return;
    this.timer = window.setInterval(() => this.tick(), SCHED_INTERVAL_MS);
    this.tick();
  }

  private stopTimer(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  private tick(): void {
    const g = this.g;
    if (!g || (g.ctx.state as string) !== 'running') return;
    const now = g.ctx.currentTime;
    const hidden = typeof document !== 'undefined' && document.hidden;
    const horizon = hidden ? LOOKAHEAD_HIDDEN : LOOKAHEAD;
    for (const p of this.players) p.schedule(now, horizon);
    g.ambience.tick(now, horizon);
  }

  private onVisibility(): void {
    const g = this.g;
    if (!g || !this._unlocked) return;
    if (!document.hidden && (g.ctx.state as string) !== 'running') {
      g.ctx.resume().catch(() => undefined);
    }
    // players/layers skip ahead themselves if they fell >0.5s behind
    this.tick();
  }

  // ------------------------------------------------------------------ music

  private startMusic(): void {
    const g = this.g;
    if (!g || this.current) return;
    const def = getStationDef(this.state.station);
    const now = g.ctx.currentTime;
    const t = now + 0.08;
    const p = new LofiPlayer(g.ctx, def, g.bank, g.musicMix, g.musicVerb, t);
    p.fadeIn(t);
    this.current = p;
    this.players.push(p);
    smooth(g.musicLP.frequency, def.lowpass, now, 0.5);
    this.tick();
  }

  private retire(p: LofiPlayer): void {
    const g = this.g;
    if (!g) return;
    p.fadeOut(g.ctx.currentTime);
    window.setTimeout(() => {
      p.dispose();
      const i = this.players.indexOf(p);
      if (i >= 0) this.players.splice(i, 1);
    }, 2600);
  }

  private applyMusicGain(tau = 0.15): void {
    const g = this.g;
    if (!g) return;
    const v = this.state.musicOn ? this.state.music * this.prox.music : 0;
    smooth(g.musicGain.gain, v, g.ctx.currentTime, this.state.musicOn ? tau : 0.3);
  }

  setMasterVolume(v: number): void {
    const val = clamp01(v);
    if (val === this.state.master) return;
    this.state.master = val;
    if (this.g) smooth(this.g.masterGain.gain, val, this.g.ctx.currentTime, 0.05);
    this.emit();
  }

  setMusicVolume(v: number): void {
    const val = clamp01(v);
    if (val === this.state.music) return;
    this.state.music = val;
    this.applyMusicGain(0.05);
    this.emit();
  }

  setMusicOn(on: boolean): void {
    on = !!on;
    if (on === this.state.musicOn) return;
    this.state.musicOn = on;
    if (this.g && this._unlocked) {
      if (on) {
        if (this.musicOffTimer !== null) {
          window.clearTimeout(this.musicOffTimer);
          this.musicOffTimer = null;
        }
        this.startMusic();
      } else {
        if (this.musicOffTimer !== null) window.clearTimeout(this.musicOffTimer);
        this.musicOffTimer = window.setTimeout(() => {
          this.musicOffTimer = null;
          if (!this.state.musicOn && this.current) {
            this.retire(this.current);
            this.current = null;
          }
        }, 1500);
      }
      this.applyMusicGain(0.3);
    }
    this.emit();
  }

  setStation(id: StationId): void {
    if (!STATIONS.some((s) => s.id === id)) return;
    if (id === this.state.station) return;
    this.state.station = id;
    const g = this.g;
    if (g && this._unlocked) {
      if (this.current) {
        this.retire(this.current);
        this.current = null;
      }
      if (this.state.musicOn) this.startMusic();
      else smooth(g.musicLP.frequency, getStationDef(id).lowpass, g.ctx.currentTime, 0.5);
    }
    this.emit();
  }

  // ------------------------------------------------------------------ ambience & space

  setAmbience(id: AmbienceId, v: number): void {
    if (!(id in this.amb)) return;
    this.amb[id] = clamp01(v);
    this.updateAmbience(0.2);
  }

  setProximity(p: { music: number; cafe: number; fire: number }): void {
    if (!p) return;
    const music = clamp01(p.music);
    const cafe = clamp01(p.cafe);
    const fire = clamp01(p.fire);
    const changed =
      Math.abs(music - this.prox.music) > 0.002 ||
      Math.abs(cafe - this.prox.cafe) > 0.002 ||
      Math.abs(fire - this.prox.fire) > 0.002;
    if (!changed) return;
    const musicChanged = Math.abs(music - this.prox.music) > 0.002;
    this.prox = { music, cafe, fire };
    if (musicChanged) this.applyMusicGain(0.12);
    this.updateAmbience(0.12);
  }

  setFocusMuffle(on: boolean): void {
    on = !!on;
    if (on === this.focus) return;
    this.focus = on;
    this.applyFocus();
    this.updateAmbience(0.4);
  }

  private applyFocus(): void {
    const g = this.g;
    if (!g) return;
    const open = Math.min(20000, g.ctx.sampleRate / 2 - 200);
    smooth(g.ambLP.frequency, this.focus ? 1800 : open, g.ctx.currentTime, 0.35);
  }

  private updateAmbience(tau: number): void {
    const g = this.g;
    if (!g || !this._unlocked) return;
    for (const { id } of AMBIENCES) {
      const user = this.amb[id];
      let level = user;
      let active = user > 0.001;
      if (id === 'cafe') {
        level = user * this.prox.cafe * (this.focus ? 0.4 : 1);
      } else if (id === 'fire') {
        // user-enabled fire is always a little audible, louder near the hearth;
        // standing by the fireplace makes it audible even if not enabled.
        level = Math.max(user * (0.4 + 0.6 * this.prox.fire), this.prox.fire * 0.5);
        active = user > 0.001 || this.prox.fire > 0.001;
      }
      g.ambience.set(id, clamp01(level), active, tau);
    }
  }

  // ------------------------------------------------------------------ one-shots

  sfx(name: SfxName): void {
    const g = this.g;
    if (!g || !this._unlocked) return;
    if ((g.ctx.state as string) !== 'running') g.ctx.resume().catch(() => undefined);
    try {
      g.sfx.play(name);
    } catch {
      /* never let a UI sound throw */
    }
  }

  chime(kind: ChimeKind): void {
    const g = this.g;
    if (!g || !this._unlocked) return;
    if ((g.ctx.state as string) !== 'running') g.ctx.resume().catch(() => undefined);
    try {
      g.sfx.chime(kind);
    } catch {
      /* ignore */
    }
  }

  // ------------------------------------------------------------------ state

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** Returns a cached snapshot (stable identity until something changes; safe for useSyncExternalStore). */
  getState(): AudioState {
    return this.snapshot;
  }

  private makeSnapshot(): AudioState {
    return {
      unlocked: this._unlocked,
      musicOn: this.state.musicOn,
      station: this.state.station,
      master: this.state.master,
      music: this.state.music,
    };
  }

  private emit(): void {
    this.snapshot = this.makeSnapshot();
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('[audio] listener error', e);
      }
    });
  }
}

export const audio = new AudioEngine();

// Vite HMR: don't leave orphaned AudioContexts/timers around in dev.
const hot = (import.meta as unknown as { hot?: { dispose(cb: () => void): void } }).hot;
if (hot) hot.dispose(() => audio.dispose());
