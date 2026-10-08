// Short, soft, retro-cozy UI/world sounds and session-complete chimes.

import type { NoiseBank } from './noise';
import { createPulseWave } from './noise';
import { cleanup, mtof, noiseShot, percEnv, rand } from './util';

export type SfxName =
  | 'click' | 'open' | 'close' | 'coin' | 'pop' | 'error' | 'step' | 'type'
  | 'pour' | 'vend' | 'print' | 'success' | 'notify' | 'sit' | 'whoosh';

export type ChimeKind = 'bell' | 'kalimba' | 'gong' | 'digital';

interface ToneOpts {
  type?: OscillatorType;
  wave?: PeriodicWave;
  f: number;
  fEnd?: number;
  glide?: number; // seconds for fEnd ramp
  amp: number;
  attack?: number;
  tau: number; // decay time constant
  dur?: number; // hard stop after this (default tau*7)
  pan?: number;
  send?: number; // reverb send
  detune?: number;
}

export class SfxKit {
  private ctx: AudioContext;
  private bank: NoiseBank;
  private out: AudioNode;
  private verb: AudioNode;
  private pulse: PeriodicWave;
  private lastType = 0;

  constructor(ctx: AudioContext, bank: NoiseBank, out: AudioNode, verbIn: AudioNode) {
    this.ctx = ctx;
    this.bank = bank;
    this.out = out;
    this.verb = verbIn;
    this.pulse = createPulseWave(ctx, 0.5, 20);
  }

  // ------------------------------------------------------------ primitives

  /** Routes a voice to the sfx bus (+ optional pan/reverb); returns its input gain + nodes to clean. */
  private voiceOut(pan = 0, send = 0): { g: GainNode; nodes: AudioNode[] } {
    const ctx = this.ctx;
    const g = ctx.createGain();
    const nodes: AudioNode[] = [g];
    let tail: AudioNode = g;
    if (pan !== 0) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      tail = p;
      nodes.push(p);
    }
    tail.connect(this.out);
    if (send > 0) {
      const s = ctx.createGain();
      s.gain.value = send;
      tail.connect(s);
      s.connect(this.verb);
      nodes.push(s);
    }
    return { g, nodes };
  }

  private tone(t: number, o: ToneOpts): void {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    if (o.wave) osc.setPeriodicWave(o.wave);
    else osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.fEnd) osc.frequency.exponentialRampToValueAtTime(o.fEnd, t + (o.glide || o.tau));
    if (o.detune) osc.detune.value = o.detune;
    const { g, nodes } = this.voiceOut(o.pan || 0, o.send || 0);
    percEnv(g.gain, t, o.amp, o.attack ?? 0.004, o.tau);
    osc.connect(g);
    const end = t + (o.dur ?? o.tau * 7 + (o.attack ?? 0.004));
    osc.start(t);
    osc.stop(end);
    cleanup(osc, [osc, ...nodes]);
  }

  /** Filtered noise burst with optional frequency sweep. */
  private noise(
    t: number,
    opts: {
      buf?: 'white' | 'pink' | 'brown';
      type: BiquadFilterType;
      f: number;
      fEnd?: number;
      sweep?: number;
      q?: number;
      amp: number;
      attack?: number;
      tau: number;
      dur?: number;
      pan?: number;
      send?: number;
    },
  ): void {
    const ctx = this.ctx;
    const flt = ctx.createBiquadFilter();
    flt.type = opts.type;
    flt.Q.value = opts.q ?? 0.8;
    flt.frequency.setValueAtTime(opts.f, t);
    if (opts.fEnd) flt.frequency.exponentialRampToValueAtTime(opts.fEnd, t + (opts.sweep || opts.tau * 3));
    const { g, nodes } = this.voiceOut(opts.pan || 0, opts.send || 0);
    percEnv(g.gain, t, opts.amp, opts.attack ?? 0.002, opts.tau);
    flt.connect(g);
    const dur = opts.dur ?? opts.tau * 7 + (opts.attack ?? 0.002);
    const src = noiseShot(ctx, this.bank[opts.buf || 'white'], flt, t, dur);
    cleanup(src, [src, flt, ...nodes]);
  }

  // ------------------------------------------------------------ sfx

  play(name: SfxName): void {
    const t = this.ctx.currentTime + 0.005;
    switch (name) {
      case 'click':
        this.tone(t, { type: 'triangle', f: 1800, fEnd: 1100, glide: 0.015, amp: 0.1, attack: 0.001, tau: 0.007 });
        this.noise(t, { type: 'highpass', f: 3000, amp: 0.04, tau: 0.004 });
        break;
      case 'type': {
        // never identical twice in a row
        const now = this.ctx.currentTime;
        const soft = now - this.lastType < 0.06 ? 0.7 : 1;
        this.lastType = now;
        this.noise(t, { type: 'bandpass', f: rand(2400, 4000), q: 2, amp: rand(0.05, 0.08) * soft, tau: 0.006 });
        this.tone(t, { f: rand(520, 680), amp: 0.025 * soft, attack: 0.001, tau: 0.008 });
        break;
      }
      case 'open':
        this.tone(t, { type: 'triangle', f: 520, amp: 0.08, attack: 0.002, tau: 0.02 });
        this.tone(t + 0.05, { type: 'triangle', f: 780, amp: 0.07, attack: 0.002, tau: 0.03 });
        this.noise(t, { buf: 'pink', type: 'bandpass', f: 1500, fEnd: 3500, sweep: 0.09, q: 1.2, amp: 0.05, attack: 0.02, tau: 0.03 });
        break;
      case 'close':
        this.tone(t, { type: 'triangle', f: 780, amp: 0.07, attack: 0.002, tau: 0.02 });
        this.tone(t + 0.05, { type: 'triangle', f: 500, amp: 0.08, attack: 0.002, tau: 0.03 });
        this.noise(t, { buf: 'pink', type: 'bandpass', f: 3200, fEnd: 1300, sweep: 0.09, q: 1.2, amp: 0.05, attack: 0.015, tau: 0.03 });
        break;
      case 'coin':
        this.tone(t, { wave: this.pulse, f: mtof(83), amp: 0.045, attack: 0.002, tau: 0.03, dur: 0.12 });
        this.tone(t + 0.075, { wave: this.pulse, f: mtof(88), amp: 0.045, attack: 0.002, tau: 0.12, send: 0.15 });
        break;
      case 'pop':
        this.tone(t, { f: 380, fEnd: 1100, glide: 0.045, amp: 0.13, attack: 0.002, tau: 0.03 });
        break;
      case 'error':
        this.buzz(t, 150);
        this.buzz(t + 0.15, 125);
        break;
      case 'step': {
        const f = rand(80, 100);
        this.tone(t, { f, fEnd: f * 0.6, glide: 0.06, amp: 0.07, attack: 0.003, tau: 0.03 });
        this.noise(t, { buf: 'brown', type: 'lowpass', f: 400, amp: 0.05, attack: 0.002, tau: 0.02 });
        break;
      }
      case 'pour':
        this.pour(t);
        break;
      case 'vend':
        this.vend(t);
        break;
      case 'print':
        this.print(t);
        break;
      case 'success':
        [72, 76, 79, 84].forEach((m, i) => {
          const last = i === 3;
          this.tone(t + i * 0.075, { type: 'triangle', f: mtof(m), amp: 0.07, attack: 0.004, tau: last ? 0.35 : 0.12, send: 0.25 });
          this.tone(t + i * 0.075, { f: mtof(m + 12), amp: 0.02, attack: 0.004, tau: last ? 0.2 : 0.06 });
        });
        break;
      case 'notify':
        this.bellTone(t, mtof(81), 0.07, 0.25, 0.2);
        this.bellTone(t + 0.13, mtof(86), 0.07, 0.4, 0.2);
        break;
      case 'sit':
        this.noise(t, { buf: 'brown', type: 'lowpass', f: 320, amp: 0.16, attack: 0.02, tau: 0.08 });
        this.tone(t, { f: 75, fEnd: 55, glide: 0.08, amp: 0.08, attack: 0.008, tau: 0.06 });
        this.noise(t, { buf: 'pink', type: 'bandpass', f: 700, fEnd: 280, sweep: 0.18, q: 1, amp: 0.04, attack: 0.02, tau: 0.06 });
        break;
      case 'whoosh':
        this.whoosh(t);
        break;
    }
  }

  private buzz(t: number, f: number): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = f;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const { g, nodes } = this.voiceOut();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.006);
    g.gain.setValueAtTime(0.06, t + 0.09);
    g.gain.linearRampToValueAtTime(0, t + 0.11);
    o.connect(lp);
    lp.connect(g);
    o.start(t);
    o.stop(t + 0.13);
    cleanup(o, [o, lp, ...nodes]);
  }

  private bellTone(t: number, f: number, amp: number, tau: number, send: number): void {
    const ctx = this.ctx;
    const car = ctx.createOscillator();
    car.frequency.value = f;
    const mod = ctx.createOscillator();
    mod.frequency.value = f * 2;
    const mg = ctx.createGain();
    mg.gain.setValueAtTime(f * 0.6, t);
    mg.gain.setTargetAtTime(0, t, 0.05);
    mod.connect(mg);
    mg.connect(car.frequency);
    const { g, nodes } = this.voiceOut(0, send);
    percEnv(g.gain, t, amp, 0.003, tau);
    car.connect(g);
    const end = t + tau * 7;
    car.start(t);
    mod.start(t);
    car.stop(end);
    mod.stop(end);
    cleanup(car, [car, mod, mg, ...nodes]);
  }

  private pour(t: number): void {
    const ctx = this.ctx;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 4;
    bp.frequency.setValueAtTime(550, t);
    bp.frequency.exponentialRampToValueAtTime(1500, t + 0.8);
    const { g, nodes } = this.voiceOut(0, 0.1);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.1);
    g.gain.setTargetAtTime(0.11, t + 0.1, 0.2);
    g.gain.setTargetAtTime(0, t + 0.68, 0.06);
    // liquid wobble
    const wob = ctx.createOscillator();
    wob.frequency.value = 13;
    const wg = ctx.createGain();
    wg.gain.value = 120;
    wob.connect(wg);
    wg.connect(bp.frequency);
    bp.connect(g);
    const src = noiseShot(ctx, this.bank.pink, bp, t, 1.1);
    wob.start(t);
    wob.stop(t + 1.1);
    cleanup(src, [src, bp, wob, wg, ...nodes]);
  }

  private vend(t: number): void {
    // clunk
    this.tone(t, { f: 130, fEnd: 60, glide: 0.12, amp: 0.16, attack: 0.002, tau: 0.06 });
    this.noise(t, { type: 'lowpass', f: 800, amp: 0.08, tau: 0.04 });
    // whirr
    const ctx = this.ctx;
    const w0 = t + 0.1;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(65, w0);
    o.frequency.linearRampToValueAtTime(80, w0 + 0.5);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 480;
    const am = ctx.createGain();
    am.gain.value = 0.6;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 18;
    const lg = ctx.createGain();
    lg.gain.value = 0.4;
    lfo.connect(lg);
    lg.connect(am.gain);
    const { g, nodes } = this.voiceOut();
    g.gain.setValueAtTime(0, w0);
    g.gain.linearRampToValueAtTime(0.05, w0 + 0.05);
    g.gain.setValueAtTime(0.05, w0 + 0.5);
    g.gain.linearRampToValueAtTime(0, w0 + 0.58);
    o.connect(lp);
    lp.connect(am);
    am.connect(g);
    o.start(w0);
    lfo.start(w0);
    o.stop(w0 + 0.62);
    lfo.stop(w0 + 0.62);
    cleanup(o, [o, lp, am, lfo, lg, ...nodes]);
    // can drops
    this.tone(t + 0.75, { f: 110, fEnd: 70, glide: 0.08, amp: 0.12, attack: 0.002, tau: 0.05 });
    this.noise(t + 0.75, { type: 'bandpass', f: 1800, q: 1.5, amp: 0.05, tau: 0.03 });
  }

  private print(t: number): void {
    const ctx = this.ctx;
    const dur = 1.0;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(210, t);
    o.frequency.setValueAtTime(236, t + 0.33);
    o.frequency.setValueAtTime(210, t + 0.66);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1100;
    // rhythmic head movement
    const am = ctx.createGain();
    am.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 9;
    const lg = ctx.createGain();
    lg.gain.value = 0.45;
    lfo.connect(lg);
    lg.connect(am.gain);
    const nb = ctx.createBiquadFilter();
    nb.type = 'bandpass';
    nb.frequency.value = 2200;
    nb.Q.value = 1;
    const ng = ctx.createGain();
    ng.gain.value = 0.6;
    const { g, nodes } = this.voiceOut(0.15);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.03, t + 0.04);
    g.gain.setValueAtTime(0.03, t + dur - 0.06);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(lp);
    lp.connect(am);
    nb.connect(ng);
    ng.connect(am);
    am.connect(g);
    const src = noiseShot(ctx, this.bank.white, nb, t, dur + 0.05);
    o.start(t);
    lfo.start(t);
    o.stop(t + dur + 0.05);
    lfo.stop(t + dur + 0.05);
    cleanup(src, [src, o, lp, am, lfo, lg, nb, ng, ...nodes]);
    // paper feed tick at the end
    this.tone(t + dur, { type: 'triangle', f: 900, amp: 0.05, attack: 0.001, tau: 0.012 });
  }

  private whoosh(t: number): void {
    const ctx = this.ctx;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(2500, t + 0.22);
    bp.frequency.exponentialRampToValueAtTime(600, t + 0.45);
    const p = ctx.createStereoPanner();
    p.pan.setValueAtTime(-0.6, t);
    p.pan.linearRampToValueAtTime(0.6, t + 0.45);
    const { g, nodes } = this.voiceOut();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.13, t + 0.2);
    g.gain.setTargetAtTime(0, t + 0.22, 0.07);
    bp.connect(p);
    p.connect(g);
    const src = noiseShot(ctx, this.bank.pink, bp, t, 0.7);
    cleanup(src, [src, bp, p, ...nodes]);
  }

  // ------------------------------------------------------------ chimes

  chime(kind: ChimeKind): void {
    const t = this.ctx.currentTime + 0.01;
    switch (kind) {
      case 'bell':
        this.bell(t, mtof(79), 1);
        this.bell(t + 0.32, mtof(84), 0.8);
        break;
      case 'kalimba':
        [72, 76, 79, 81, 84, 79].forEach((m, i) => {
          const last = i === 5;
          this.kalimba(t + i * 0.14 + (last ? 0.1 : 0), mtof(m), last ? 0.8 : rand(0.75, 0.95), last ? 0.9 : 0.5);
        });
        break;
      case 'gong':
        this.gong(t);
        break;
      case 'digital':
        [72, 79, 84, 88, 91].forEach((m, i) => {
          for (let e = 0; e < 3; e++) {
            const amp = 0.04 * Math.pow(0.45, e);
            this.tone(t + i * 0.08 + e * 0.24, {
              wave: this.pulse,
              f: mtof(m),
              amp,
              attack: 0.003,
              tau: i === 4 ? 0.3 : 0.09,
              send: 0.2,
              pan: e === 0 ? 0 : e === 1 ? -0.4 : 0.4,
            });
            this.tone(t + i * 0.08 + e * 0.24, { type: 'triangle', f: mtof(m - 12), amp: amp * 0.8, attack: 0.003, tau: i === 4 ? 0.4 : 0.1 });
          }
        });
        break;
    }
  }

  private bell(t: number, f: number, vel: number): void {
    const ratios = [0.5, 1, 1.183, 1.506, 2.0, 2.514, 2.662, 3.011];
    const amps = [0.35, 1, 0.45, 0.3, 0.4, 0.18, 0.12, 0.08];
    ratios.forEach((r, i) => {
      const tau = 0.9 / Math.pow(r, 0.55);
      this.tone(t, { f: f * r, amp: 0.028 * amps[i] * vel, attack: 0.002, tau, dur: Math.min(3, tau * 6), send: 0.35, detune: rand(-3, 3) });
    });
  }

  private kalimba(t: number, f: number, vel: number, tau: number): void {
    this.tone(t, { f, amp: 0.08 * vel, attack: 0.003, tau, send: 0.3 });
    this.tone(t, { f: f * 5.4, amp: 0.012 * vel, attack: 0.001, tau: 0.03 });
    this.tone(t, { f: f * 2, amp: 0.01 * vel, attack: 0.002, tau: 0.12 });
  }

  private gong(t: number): void {
    const ctx = this.ctx;
    const f0 = 130.8;
    const ratios = [1, 1.48, 1.97, 2.53, 3.12, 3.73, 4.4, 5.2];
    const amps = [1, 0.6, 0.5, 0.35, 0.3, 0.2, 0.14, 0.1];
    ratios.forEach((r, i) => {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(f0 * r, t);
      o.frequency.setTargetAtTime(f0 * r * 0.985, t, 1.2);
      const { g, nodes } = this.voiceOut(0, 0.4);
      const peak = 0.04 * amps[i];
      const att = i < 2 ? 0.01 : 0.15 + i * 0.08; // upper partials bloom in
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + att);
      g.gain.setTargetAtTime(peak * 0.5, t + att, 0.6);
      g.gain.setTargetAtTime(0, t + 1.6, 0.45);
      o.connect(g);
      o.start(t);
      o.stop(t + 3.6);
      cleanup(o, [o, ...nodes]);
    });
    // mallet thump
    this.noise(t, { buf: 'brown', type: 'lowpass', f: 300, amp: 0.12, attack: 0.004, tau: 0.05 });
  }
}
