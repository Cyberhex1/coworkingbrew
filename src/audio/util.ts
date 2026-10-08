// Small shared helpers for the CoworkingBrew audio engine.

export const mtof = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
export const rand = (a: number, b: number): number => a + Math.random() * (b - a);
export const randInt = (a: number, b: number): number => Math.floor(rand(a, b + 1));
export const chance = (p: number): boolean => Math.random() < p;

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function weighted<T>(items: readonly (readonly [T, number])[]): T {
  let total = 0;
  for (const [, w] of items) total += w;
  let r = Math.random() * total;
  for (const [v, w] of items) {
    r -= w;
    if (r <= 0) return v;
  }
  return items[items.length - 1][0];
}

export const clamp01 = (v: number): number => {
  if (typeof v !== 'number' || !isFinite(v)) return 0;
  return v < 0 ? 0 : v > 1 ? 1 : v;
};

/** Click-free move of an AudioParam toward a value (exponential approach). */
export function smooth(param: AudioParam, value: number, t: number, tau: number): void {
  param.cancelScheduledValues(t);
  param.setTargetAtTime(value, t, tau);
}

/**
 * Disconnect a one-shot's node chain once its (last-stopping) source ends,
 * so per-note graphs never leak.
 */
export function cleanup(src: AudioScheduledSourceNode, nodes: AudioNode[], extra?: () => void): void {
  src.onended = () => {
    for (const n of nodes) {
      try {
        n.disconnect();
      } catch {
        /* already disconnected */
      }
    }
    if (extra) {
      try {
        extra();
      } catch {
        /* ignore */
      }
    }
    src.onended = null;
  };
}

/** A looping-noise one-shot starting at a random offset in the buffer. */
export function noiseShot(
  ctx: BaseAudioContext,
  buf: AudioBuffer,
  dest: AudioNode,
  t: number,
  dur: number,
): AudioBufferSourceNode {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  s.connect(dest);
  s.start(t, Math.random() * Math.max(0, buf.duration - 0.05));
  s.stop(t + dur);
  return s;
}

/** Simple percussive envelope on a gain param: 0 -> peak (attack) -> exponential decay. */
export function percEnv(g: AudioParam, t: number, peak: number, attack: number, tau: number): void {
  g.setValueAtTime(0, t);
  g.linearRampToValueAtTime(peak, t + attack);
  g.setTargetAtTime(0, t + attack, tau);
}
