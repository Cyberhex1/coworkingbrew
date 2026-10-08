// Low-level pixel-art helpers: offscreen canvases, string-defined sprites, outlines.

export type Canvas = HTMLCanvasElement;
export type Ctx = CanvasRenderingContext2D;

export function makeCanvas(w: number, h: number): [Canvas, Ctx] {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

/**
 * Build a sprite from rows of characters. '.' or ' ' is transparent; every other
 * character looks up a color in `map`.
 */
export function spriteFromRows(rows: string[], map: Record<string, string>): Canvas {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const [c, ctx] = makeCanvas(w, h);
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const col = map[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

/** Parse a template literal block into trimmed rows (keeps internal dots). */
export function rows(block: string): string[] {
  return block
    .split('\n')
    .map((r) => r.replace(/\s+$/g, ''))
    .filter((r) => r.trim().length > 0)
    .map((r) => r.trimStart());
}

/** Add a 1px outline around every opaque pixel (in place, returns a new canvas). */
export function outlined(src: Canvas, color: string, opts: { skipBottom?: boolean } = {}): Canvas {
  const w = src.width + 2;
  const h = src.height + 2;
  const [c, ctx] = makeCanvas(w, h);
  const sctx = src.getContext('2d')!;
  const data = sctx.getImageData(0, 0, src.width, src.height).data;
  const solid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < src.width && y < src.height && data[(y * src.width + x) * 4 + 3] > 40;
  ctx.fillStyle = color;
  for (let y = -1; y <= src.height; y++) {
    for (let x = -1; x <= src.width; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || (!opts.skipBottom && solid(x, y + 1))) {
        ctx.fillRect(x + 1, y + 1, 1, 1);
      }
    }
  }
  ctx.drawImage(src, 1, 1);
  return c;
}

export function flipH(src: Canvas): Canvas {
  const [c, ctx] = makeCanvas(src.width, src.height);
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return c;
}

/** Simple seeded PRNG so procedural textures are stable between reloads. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return (s >>> 0) / 4294967296;
  };
}

export function hash2(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** 4x4 Bayer matrix for ordered dithering. */
export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((r) => r.map((v) => (v + 0.5) / 16));

/** Fill a rect with a dithered blend between two colors (t = 0..1 share of b). */
export function ditherRect(ctx: Ctx, x: number, y: number, w: number, h: number, a: string, b: string, t: number) {
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      ctx.fillStyle = BAYER4[(y + yy) & 3][(x + xx) & 3] < t ? b : a;
      ctx.fillRect(x + xx, y + yy, 1, 1);
    }
  }
}

/** Vertical dithered gradient across a list of color stops. */
export function ditherGradientV(ctx: Ctx, x: number, y: number, w: number, h: number, stops: string[]) {
  const segs = stops.length - 1;
  for (let yy = 0; yy < h; yy++) {
    const f = (yy / Math.max(1, h - 1)) * segs;
    const i = Math.min(segs - 1, Math.floor(f));
    const t = f - i;
    for (let xx = 0; xx < w; xx++) {
      ctx.fillStyle = BAYER4[(y + yy) & 3][(x + xx) & 3] < t ? stops[i + 1] : stops[i];
      ctx.fillRect(x + xx, y + yy, 1, 1);
    }
  }
}

/** Convert a canvas to a data URL (for using sprites as <img> in the React UI). */
export function toDataURL(c: Canvas): string {
  return c.toDataURL('image/png');
}
