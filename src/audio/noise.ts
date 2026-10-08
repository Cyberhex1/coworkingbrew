// Procedurally generated buffers: noise colours, reverb impulses, crackle loops, pulse waves.
// Generated once per AudioContext and reused everywhere.

export interface NoiseBank {
  white: AudioBuffer;
  pink: AudioBuffer;
  brown: AudioBuffer;
}

/** Make the buffer loop seamlessly (end meets start) and remove DC. */
function fixLoop(d: Float32Array): void {
  const n = d.length;
  if (n < 2) return;
  const diff = d[n - 1] - d[0];
  let mean = 0;
  for (let i = 0; i < n; i++) {
    d[i] -= (diff * i) / (n - 1);
    mean += d[i];
  }
  mean /= n;
  for (let i = 0; i < n; i++) d[i] -= mean;
}

function normalize(d: Float32Array, peak: number): void {
  let max = 0;
  for (let i = 0; i < d.length; i++) {
    const a = Math.abs(d[i]);
    if (a > max) max = a;
  }
  if (max <= 0) return;
  const k = peak / max;
  for (let i = 0; i < d.length; i++) d[i] *= k;
}

export function createNoiseBank(ctx: BaseAudioContext, seconds = 4): NoiseBank {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * seconds);
  const white = ctx.createBuffer(1, len, sr);
  const pink = ctx.createBuffer(1, len, sr);
  const brown = ctx.createBuffer(1, len, sr);
  const w = white.getChannelData(0);
  const p = pink.getChannelData(0);
  const b = brown.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let last = 0;
  for (let i = 0; i < len; i++) {
    const x = Math.random() * 2 - 1;
    w[i] = x;
    // Paul Kellet's refined pink filter
    b0 = 0.99886 * b0 + x * 0.0555179;
    b1 = 0.99332 * b1 + x * 0.0750759;
    b2 = 0.969 * b2 + x * 0.153852;
    b3 = 0.8665 * b3 + x * 0.3104856;
    b4 = 0.55 * b4 + x * 0.5329522;
    b5 = -0.7616 * b5 - x * 0.016898;
    p[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + x * 0.5362;
    b6 = x * 0.115926;
    // Brown (integrated, leaky)
    last = (last + 0.02 * x) / 1.02;
    b[i] = last * 3.5;
  }
  fixLoop(p);
  fixLoop(b);
  normalize(w, 0.9);
  normalize(p, 0.9);
  normalize(b, 0.9);
  return { white, pink, brown };
}

/**
 * Stereo decaying-noise impulse response with a darkening tail —
 * a cheap but smooth "room/plate" for ConvolverNode.
 */
export function createImpulse(ctx: BaseAudioContext, seconds: number, decay: number, preDelay = 0.012): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(2, len, sr);
  const pre = Math.floor(sr * preDelay);
  const fadeIn = Math.floor(sr * 0.004);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let y = 0;
    for (let i = 0; i < len; i++) {
      if (i < pre) {
        d[i] = 0;
        continue;
      }
      const t = (i - pre) / (len - pre);
      const env = Math.pow(1 - t, decay) * Math.min(1, (i - pre) / fadeIn);
      const x = (Math.random() * 2 - 1) * env;
      const k = 1 - 0.88 * t; // one-pole lowpass gets darker over time
      y += k * (x - y);
      d[i] = y;
    }
  }
  return buf;
}

/** Looping crackle textures (mono). */
export function createCrackle(ctx: BaseAudioContext, kind: 'vinyl' | 'fire', seconds = 6): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);

  const addClick = (pos: number, amp: number, tauSamples: number, noisy: boolean) => {
    const n = Math.min(len - pos, Math.floor(tauSamples * 6));
    const sign = Math.random() < 0.5 ? -1 : 1;
    for (let k = 0; k < n; k++) {
      const e = Math.exp(-k / tauSamples);
      const v = k === 0 || !noisy ? sign : Math.random() * 2 - 1;
      d[pos + k] += amp * e * v;
    }
  };

  if (kind === 'vinyl') {
    // dense tiny ticks + rarer louder pops
    let t = 0;
    while (t < seconds) {
      t += -Math.log(1 - Math.random()) / 35;
      const pos = Math.floor(t * sr);
      if (pos >= len) break;
      const big = Math.random() < 0.04;
      const amp = big ? 0.5 + Math.random() * 0.5 : 0.04 + Math.pow(Math.random(), 4) * 0.5;
      addClick(pos, amp, big ? sr * 0.0006 : sr * 0.00012, big);
    }
  } else {
    // fire: clustered crackles of noisy bursts
    let t = 0;
    while (t < seconds) {
      t += -Math.log(1 - Math.random()) / 5;
      const n = 1 + Math.floor(Math.random() * 7);
      let ct = t;
      for (let j = 0; j < n; j++) {
        ct += 0.002 + Math.random() * 0.03;
        const pos = Math.floor(ct * sr);
        if (pos >= len) break;
        const amp = 0.08 + Math.pow(Math.random(), 2) * 0.7;
        addClick(pos, amp, sr * (0.0004 + Math.random() * 0.0025), true);
      }
      if (Math.random() < 0.08) {
        const pos = Math.floor((t + Math.random() * 0.2) * sr);
        if (pos < len) addClick(pos, 1, sr * 0.004, true);
      }
    }
  }
  // gentle differentiation to make clicks crisp, then normalize
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const x = d[i];
    d[i] = x - 0.6 * prev;
    prev = x;
  }
  normalize(d, 0.9);
  return buf;
}

/** Band-limited, softened pulse wave for mellow chiptune voices. */
export function createPulseWave(ctx: BaseAudioContext, duty = 0.25, harmonics = 28): PeriodicWave {
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);
  for (let n = 1; n <= harmonics; n++) {
    const soft = Math.exp(-n / 14);
    real[n] = ((2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty)) * soft;
  }
  return ctx.createPeriodicWave(real, imag);
}
