import * as THREE from 'three';
import { makeCanvas, rng, hash2, ditherGradientV, BAYER4, type Ctx } from './pixel';
import { shade } from './palette';
import type { RoomTheme, SkyStyle } from './themes';

export const TPU = 16; // texels per world unit

export function canvasTexture(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function px(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

// ---------------------------------------------------------------- floors

export function floorTexture(theme: RoomTheme, wUnits: number, dUnits: number): HTMLCanvasElement {
  const W = wUnits * TPU, H = dUnits * TPU;
  const [c, ctx] = makeCanvas(W, H);
  const [dk, md, lt, seam] = theme.floorColors;
  const r = rng(theme.id.length * 977 + 13);

  switch (theme.floor) {
    case 'planks':
    case 'timber': {
      const pw = theme.floor === 'timber' ? 12 : 8; // plank width (texels)
      for (let y = 0; y < H; y += pw) {
        let x = -Math.floor(r() * 40);
        while (x < W) {
          const len = theme.floor === 'timber' ? 40 + Math.floor(r() * 40) : 28 + Math.floor(r() * 36);
          const pick = r();
          const base = pick < 0.33 ? dk : pick < 0.75 ? md : lt;
          px(ctx, x, y, len, pw, base);
          // grain
          for (let g = 0; g < 3; g++) {
            const gy = y + 1 + Math.floor(r() * (pw - 2));
            const gx = x + Math.floor(r() * len * 0.6);
            px(ctx, gx, gy, 4 + Math.floor(r() * 12), 1, shade(base, -0.12));
          }
          // highlight top edge
          px(ctx, x, y, len, 1, shade(base, 0.08));
          // knots for timber
          if (theme.floor === 'timber' && r() < 0.35) {
            const kx = x + 6 + Math.floor(r() * (len - 12)), ky = y + 3 + Math.floor(r() * (pw - 6));
            px(ctx, kx, ky, 3, 2, shade(base, -0.3));
          }
          px(ctx, x + len - 1, y, 1, pw, seam);
          x += len;
        }
        px(ctx, 0, y + pw - 1, W, 1, seam);
      }
      break;
    }
    case 'parquet': {
      const s = 8;
      for (let by = 0; by < H; by += s * 2) {
        for (let bx = 0; bx < W; bx += s * 2) {
          for (let q = 0; q < 4; q++) {
            const ox = bx + (q % 2) * s, oy = by + Math.floor(q / 2) * s;
            const horiz = (q === 0 || q === 3);
            for (let k = 0; k < 2; k++) {
              const hv = hash2(ox + k * 3, oy + q);
              const col = hv < 0.6 ? md : hv < 0.88 ? lt : dk;
              if (horiz) {
                px(ctx, ox, oy + k * 4, s, 4, col);
                px(ctx, ox, oy + k * 4 + 3, s, 1, seam);
                px(ctx, ox, oy + k * 4, s, 1, shade(col, 0.08));
              } else {
                px(ctx, ox + k * 4, oy, 4, s, col);
                px(ctx, ox + k * 4 + 3, oy, 1, s, seam);
                px(ctx, ox + k * 4, oy, 1, s, shade(col, 0.08));
              }
            }
          }
        }
      }
      break;
    }
    case 'carpet': {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const n = hash2(x, y);
          ctx.fillStyle = n < 0.18 ? dk : n > 0.86 ? lt : md;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // carpet tile seams
      ctx.globalAlpha = 0.35;
      for (let y = 0; y < H; y += 32) px(ctx, 0, y, W, 1, seam);
      for (let x = 0; x < W; x += 32) px(ctx, x, 0, 1, H, seam);
      ctx.globalAlpha = 1;
      break;
    }
    case 'tatami': {
      const mw = 32, mh = 64;
      for (let y = 0; y < H; y += mh) {
        for (let x = 0; x < W; x += mw) {
          const rotated = ((x / mw + y / mh) % 2) === 1;
          const ww = rotated ? mh : mw, hh = rotated ? mw : mh;
          for (let yy = 0; yy < mh; yy += hh) {
            for (let xx = 0; xx < mw; xx += ww) {
              const X = x + xx, Y = y + yy;
              const cw = Math.min(ww, mw), ch = Math.min(hh, mh);
              px(ctx, X, Y, cw, ch, md);
              // straw weave lines
              for (let i = 1; i < (rotated ? ch : cw); i += 2) {
                if (rotated) px(ctx, X, Y + i, cw, 1, i % 4 === 1 ? lt : dk);
                else px(ctx, X + i, Y, 1, ch, i % 4 === 1 ? lt : dk);
              }
              // cloth border
              px(ctx, X, Y, cw, 2, seam);
              px(ctx, X, Y + ch - 2, cw, 2, seam);
              if (rotated) { px(ctx, X, Y, 2, ch, seam); px(ctx, X + cw - 2, Y, 2, ch, seam); }
            }
          }
        }
      }
      break;
    }
    case 'stone': {
      px(ctx, 0, 0, W, H, seam);
      let y = 0;
      while (y < H) {
        const rh = 10 + Math.floor(r() * 8);
        let x = -Math.floor(r() * 10);
        while (x < W) {
          const sw = 12 + Math.floor(r() * 18);
          const col = [dk, md, lt][Math.floor(r() * 3)];
          px(ctx, x + 1, y + 1, sw - 2, rh - 2, col);
          px(ctx, x + 1, y + 1, sw - 2, 1, shade(col, 0.12));
          px(ctx, x + 1, y + rh - 2, sw - 2, 1, shade(col, -0.12));
          if (r() < 0.3) px(ctx, x + 3 + Math.floor(r() * (sw - 6)), y + rh - 3, 2, 1, '#5a7a4a'); // moss
          x += sw;
        }
        y += rh;
      }
      break;
    }
    case 'grid': {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const n = hash2(x, y);
          ctx.fillStyle = n < 0.5 ? dk : md;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      const [n1, n2] = theme.neon ?? ['#00e5ff', '#ff3fb4'];
      ctx.globalAlpha = 0.5;
      for (let y = 0; y < H; y += 16) px(ctx, 0, y, W, 1, n1);
      for (let x = 0; x < W; x += 16) px(ctx, x, 0, 1, H, n1);
      ctx.globalAlpha = 0.85;
      for (let y = 0; y < H; y += 64) px(ctx, 0, y, W, 1, n2);
      for (let x = 0; x < W; x += 64) px(ctx, x, 0, 1, H, n2);
      ctx.globalAlpha = 1;
      break;
    }
  }
  return c;
}

// ---------------------------------------------------------------- walls

export function wallTexture(theme: RoomTheme, lenUnits: number, hUnits: number, seed = 1): HTMLCanvasElement {
  const W = Math.round(lenUnits * TPU), H = Math.round(hUnits * TPU);
  const [c, ctx] = makeCanvas(W, H);
  const { base, alt, wainscot, trim } = theme.wallColors;
  const r = rng(seed * 131 + theme.id.length);
  const wainH = 16; // 1 unit wainscot
  const wainTop = H - wainH;

  px(ctx, 0, 0, W, H, base);
  switch (theme.wall) {
    case 'plaster': {
      for (let y = 0; y < wainTop; y++) for (let x = 0; x < W; x++) {
        if (hash2(x + seed * 7, y) < 0.06) px(ctx, x, y, 1, 1, alt);
      }
      break;
    }
    case 'brick': {
      for (let y = 0; y < wainTop; y += 6) {
        const off = (y / 6) % 2 === 0 ? 0 : 7;
        for (let x = -off; x < W; x += 14) {
          const col = r() < 0.3 ? alt : r() < 0.15 ? shade(base, 0.12) : base;
          px(ctx, x, y, 13, 5, col);
          px(ctx, x, y, 13, 1, shade(col, 0.1));
        }
        px(ctx, 0, y + 5, W, 1, '#d8c8b0');
      }
      for (let x = 0; x < W; x++) for (let y = 0; y < wainTop; y++) {
        // mortar verticals already gaps; tint gaps
      }
      break;
    }
    case 'tile': {
      // subway tile upper wall
      for (let y = 0; y < wainTop; y += 4) {
        const off = (y / 4) % 2 === 0 ? 0 : 4;
        for (let x = -off; x < W; x += 8) {
          px(ctx, x, y, 7, 3, base);
          px(ctx, x, y, 7, 1, '#ffffff');
        }
        px(ctx, 0, y + 3, W, 1, alt);
      }
      break;
    }
    case 'shoji': {
      // paper panels in a wooden lattice
      px(ctx, 0, 0, W, wainTop, base);
      for (let x = 0; x < W; x += 24) px(ctx, x, 0, 2, wainTop, trim);
      for (let x = 0; x < W; x += 8) px(ctx, x, 0, 1, wainTop, wainscot);
      for (let y = 4; y < wainTop; y += 10) px(ctx, 0, y, W, 1, wainscot);
      break;
    }
    case 'bistro': {
      // deep green with vertical gold pinstripe + damask dots
      for (let x = 0; x < W; x += 12) px(ctx, x, 0, 1, wainTop, shade(trim, -0.25));
      for (let y = 3; y < wainTop; y += 8) for (let x = 6; x < W; x += 12) {
        px(ctx, x - 1, y, 3, 1, alt); px(ctx, x, y - 1, 1, 3, alt);
      }
      break;
    }
    case 'logs': {
      for (let y = 0; y < wainTop; y += 8) {
        const col = (y / 8) % 2 === 0 ? base : alt;
        px(ctx, 0, y, W, 8, col);
        px(ctx, 0, y, W, 1, shade(col, 0.15));
        px(ctx, 0, y + 7, W, 1, shade(col, -0.3));
        for (let k = 0; k < W / 24; k++) {
          const gx = Math.floor(r() * W);
          px(ctx, gx, y + 3 + Math.floor(r() * 3), 6 + Math.floor(r() * 10), 1, shade(col, -0.15));
        }
      }
      break;
    }
    case 'glass': {
      // Victorian conservatory: mostly glass panes with white mullions
      ditherGradientV(ctx, 0, 0, W, wainTop, ['#cfe8f0', '#b8dce4', '#a8d0c0']);
      for (let x = 0; x < W; x += 16) px(ctx, x, 0, 2, wainTop, trim);
      for (let y = 0; y < wainTop; y += 12) px(ctx, 0, y, W, 1, trim);
      // leaves peeking from outside
      for (let i = 0; i < W / 3; i++) {
        const lx = Math.floor(r() * W), ly = wainTop - 2 - Math.floor(r() * r() * wainTop * 0.7);
        px(ctx, lx, ly, 2, 2, r() < 0.5 ? '#5a9a4a' : '#3f7d4a');
      }
      break;
    }
    case 'panel': {
      for (let x = 0; x < W; x += 20) {
        px(ctx, x + 2, 4, 16, wainTop - 8, alt);
        px(ctx, x + 2, 4, 16, 1, shade(alt, 0.15));
      }
      // little stars painted on
      for (let i = 0; i < W / 10; i++) px(ctx, Math.floor(r() * W), Math.floor(r() * (wainTop - 6)), 1, 1, '#d8e4ff');
      break;
    }
    case 'neon': {
      for (let y = 0; y < wainTop; y++) for (let x = 0; x < W; x++) {
        if (hash2(x, y + seed) < 0.12) px(ctx, x, y, 1, 1, alt);
      }
      const [n1, n2] = theme.neon ?? ['#00e5ff', '#ff3fb4'];
      px(ctx, 0, 10, W, 1, n1);
      px(ctx, 0, wainTop - 4, W, 1, n2);
      break;
    }
  }

  // wainscot + chair rail + skirting
  px(ctx, 0, wainTop, W, wainH, wainscot);
  if (theme.wall !== 'glass') {
    for (let x = 4; x < W; x += 20) {
      px(ctx, x, wainTop + 3, 14, wainH - 7, shade(wainscot, 0.1));
      px(ctx, x, wainTop + 3, 14, 1, shade(wainscot, 0.22));
      px(ctx, x, wainTop + wainH - 5, 14, 1, shade(wainscot, -0.2));
    }
  }
  px(ctx, 0, wainTop - 1, W, 2, trim);
  px(ctx, 0, H - 2, W, 2, shade(wainscot, -0.35));
  // crown molding
  px(ctx, 0, 0, W, 2, trim);
  px(ctx, 0, 2, W, 1, shade(trim, -0.25));
  return c;
}

// ---------------------------------------------------------------- window views

export function skyTexture(style: SkyStyle, w: number, h: number, seed = 1): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  const r = rng(seed * 71 + 5);
  const building = (x: number, bw: number, bh: number, col: string, lit: string, litChance: number) => {
    px(ctx, x, h - bh, bw, bh, col);
    for (let wy = h - bh + 2; wy < h - 1; wy += 3) for (let wx = x + 1; wx < x + bw - 1; wx += 2) {
      if (r() < litChance) px(ctx, wx, wy, 1, 1, lit);
    }
  };
  switch (style) {
    case 'cityDay':
    case 'city': {
      ditherGradientV(ctx, 0, 0, w, h, ['#7ec0ee', '#a8d8f0', '#e0f0f4']);
      // cloud
      px(ctx, 4, 4, 10, 2, '#ffffff'); px(ctx, 6, 3, 5, 1, '#ffffff');
      for (let x = 0; x < w; ) {
        const bw = 5 + Math.floor(r() * 7);
        building(x, bw, 8 + Math.floor(r() * (h * 0.5)), r() < 0.5 ? '#8a9ab0' : '#a4b0c0', '#dfe8f0', 0.35);
        x += bw + 1;
      }
      break;
    }
    case 'sunset': {
      ditherGradientV(ctx, 0, 0, w, h, ['#3a2a5e', '#c8507a', '#ff9a5c', '#ffd27a']);
      px(ctx, Math.floor(w * 0.6), Math.floor(h * 0.55), 6, 6, '#fff0b8');
      for (let x = 0; x < w; ) {
        const bw = 4 + Math.floor(r() * 7);
        building(x, bw, 6 + Math.floor(r() * (h * 0.45)), '#3a2440', '#ffcf7a', 0.25);
        x += bw;
      }
      break;
    }
    case 'bamboo': {
      ditherGradientV(ctx, 0, 0, w, h, ['#d8ecd0', '#b8dcb0', '#8cc08a']);
      for (let x = 1; x < w; x += 4 + Math.floor(r() * 3)) {
        const col = r() < 0.5 ? '#4a8a4a' : '#3a7040';
        px(ctx, x, 0, 2, h, col);
        for (let y = 3 + Math.floor(r() * 4); y < h; y += 7) px(ctx, x, y, 2, 1, '#2a5030');
        px(ctx, x + 2, Math.floor(r() * h), 3, 1, '#6aaa5a');
      }
      break;
    }
    case 'rain': {
      ditherGradientV(ctx, 0, 0, w, h, ['#3a4a64', '#5a6e8a', '#7a8ea8']);
      for (let x = 0; x < w; ) {
        const bw = 5 + Math.floor(r() * 6);
        building(x, bw, 6 + Math.floor(r() * (h * 0.5)), '#2e3a50', '#ffcf7a', 0.2);
        x += bw + 1;
      }
      // rain streaks are animated separately; leave a few static drops
      for (let i = 0; i < w * 1.5; i++) px(ctx, Math.floor(r() * w), Math.floor(r() * h), 1, 2, 'rgba(220,235,255,0.55)');
      break;
    }
    case 'forest': {
      ditherGradientV(ctx, 0, 0, w, h, ['#ffb070', '#ffd8a0', '#f0e0b0']);
      for (let i = 0; i < 9; i++) {
        const tx = Math.floor(r() * w), th = 10 + Math.floor(r() * (h * 0.7));
        const col = i % 2 ? '#2f5a2a' : '#3f6e30';
        for (let y = h - th; y < h; y++) {
          const half = Math.floor(((y - (h - th)) / th) * 5) + 1;
          px(ctx, tx - half, y, half * 2, 1, col);
        }
      }
      px(ctx, 0, h - 3, w, 3, '#24401e');
      break;
    }
    case 'garden': {
      ditherGradientV(ctx, 0, 0, w, h, ['#bfe6f4', '#e0f4f0']);
      for (let i = 0; i < w * 2; i++) {
        const lx = Math.floor(r() * w), ly = Math.floor(h * 0.3 + r() * h * 0.7);
        px(ctx, lx, ly, 2, 2, ['#3f7d4a', '#62a356', '#2f5c3c', '#9cc96a'][Math.floor(r() * 4)]);
      }
      for (let i = 0; i < 6; i++) px(ctx, Math.floor(r() * w), Math.floor(h * 0.5 + r() * h * 0.4), 1, 1, '#f0a8a8');
      break;
    }
    case 'pond': {
      ditherGradientV(ctx, 0, 0, w, Math.floor(h * 0.62), ['#0c1030', '#1d2a5e', '#2e3a6e']);
      ditherGradientV(ctx, 0, Math.floor(h * 0.62), w, h - Math.floor(h * 0.62), ['#1d2a5e', '#0c1430']);
      for (let i = 0; i < w; i++) px(ctx, Math.floor(r() * w), Math.floor(r() * h * 0.55), 1, 1, r() < 0.3 ? '#fff6c8' : '#9ab0e8');
      const mx = Math.floor(w * 0.7), my = Math.floor(h * 0.18);
      px(ctx, mx, my, 5, 5, '#fff6d8'); px(ctx, mx + 1, my - 1, 3, 7, '#fff6d8'); px(ctx, mx - 1, my + 1, 7, 3, '#fff6d8');
      px(ctx, mx + 1, Math.floor(h * 0.7), 3, 1, '#c8d0ff');
      for (let i = 0; i < 5; i++) {
        const lx = Math.floor(r() * w), ly = Math.floor(h * 0.7 + r() * h * 0.25);
        px(ctx, lx, ly, 3, 1, '#2f6e4a'); px(ctx, lx + 1, ly - 1, 1, 1, '#f0a8c8');
      }
      break;
    }
    case 'synth': {
      ditherGradientV(ctx, 0, 0, w, Math.floor(h * 0.6), ['#140f30', '#4a1e6e', '#ff3fb4']);
      const sy = Math.floor(h * 0.6);
      px(ctx, 0, sy, w, h - sy, '#140f20');
      const sx = Math.floor(w / 2) - 5;
      for (let i = 0; i < 10; i++) if (i % 3 !== 2) px(ctx, sx, Math.floor(h * 0.3) + i, 10, 1, '#ffd27a');
      for (let x = 0; x < w; x += 4) px(ctx, x, sy, 1, h - sy, '#00e5ff');
      for (let y = sy; y < h; y += 3) px(ctx, 0, y, w, 1, '#00a8c0');
      break;
    }
  }
  return c;
}

// ---------------------------------------------------------------- rugs & props

export function rugTexture(colors: [string, string, string], wU: number, dU: number, round = false): HTMLCanvasElement {
  const W = Math.round(wU * TPU), H = Math.round(dU * TPU);
  const [c, ctx] = makeCanvas(W, H);
  const [main, border, pattern] = colors;
  if (round) {
    const cx = W / 2, cy = H / 2;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot((x + 0.5 - cx) / cx, (y + 0.5 - cy) / cy);
      if (d > 1) continue;
      let col = main;
      if (d > 0.86) col = border;
      else if (d > 0.74) col = main;
      else if (d > 0.68) col = pattern;
      else if (Math.abs(((d * 10) % 2) - 1) < 0.15) col = shade(main, 0.12);
      if (BAYER4[y & 3][x & 3] < 0.12) col = shade(col, -0.08);
      px(ctx, x, y, 1, 1, col);
    }
    return c;
  }
  px(ctx, 0, 0, W, H, border);
  px(ctx, 2, 2, W - 4, H - 4, main);
  px(ctx, 4, 4, W - 8, 1, pattern); px(ctx, 4, H - 5, W - 8, 1, pattern);
  px(ctx, 4, 4, 1, H - 8, pattern); px(ctx, W - 5, 4, 1, H - 8, pattern);
  // diamond motif
  const cx = Math.floor(W / 2), cy = Math.floor(H / 2);
  const rad = Math.floor(Math.min(W, H) / 3);
  for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
    const m = Math.abs(x) + Math.abs(y);
    if (m === rad || m === rad - 3) px(ctx, cx + x, cy + y, 1, 1, pattern);
    else if (m < rad - 6 && (m % 3 === 0)) px(ctx, cx + x, cy + y, 1, 1, border);
  }
  // fringe
  for (let x = 1; x < W; x += 2) { px(ctx, x, 0, 1, 1, '#f4e4c1'); px(ctx, x, H - 1, 1, 1, '#f4e4c1'); }
  return c;
}

/** A little pixel-text renderer (3x5 font) for signs drawn into textures. */
const FONT3x5: Record<string, string> = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
  '4': '101101111001001', '5': '111100110001110', '6': '011100110101010', '7': '111001010010010', '8': '010101010101010',
  '9': '010101011001110', ' ': '000000000000000', '.': '000000000000010', '!': '010010010000010', '-': '000000111000000',
  ':': '000010000010000', '$': '011110010011110', '/': '001001010100100', '&': '010101010101011', "'": '010010000000000',
};
export function pixelText(ctx: Ctx, text: string, x: number, y: number, color: string) {
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const g = FONT3x5[ch] ?? FONT3x5[' '];
    for (let i = 0; i < 15; i++) if (g[i] === '1') px(ctx, cx + (i % 3), y + Math.floor(i / 3), 1, 1, color);
    cx += 4;
  }
  return cx - x;
}
export function pixelTextWidth(text: string) {
  return text.length * 4 - 1;
}

export function menuBoardTexture(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(64, 28);
  px(ctx, 0, 0, 64, 28, '#5e3626');
  px(ctx, 2, 2, 60, 24, '#24302a');
  pixelText(ctx, 'MENU', 25, 4, '#f7d97a');
  const items = [['LATTE', '4'], ['MOCHA', '5'], ['MATCHA', '5'], ['COLD BREW', '6']];
  items.forEach(([n, p], i) => {
    const y = 11 + (i % 2) * 7, x = i < 2 ? 4 : 33;
    pixelText(ctx, n, x, y, '#f4e4c1');
    pixelText(ctx, p, x + 26, y, '#9cc96a');
  });
  return c;
}

export function whiteboardTexture(cols: { title: string; cards: string[] }[]): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(56, 26);
  px(ctx, 0, 0, 56, 26, '#f8f8f4');
  const colW = 18;
  const noteCols = ['#f7d97a', '#8cb4dc', '#9cc96a', '#f0a8a8'];
  cols.slice(0, 3).forEach((col, i) => {
    const x = 1 + i * colW;
    pixelText(ctx, col.title.slice(0, 4), x + 1, 1, '#3a3a44');
    px(ctx, x, 7, colW - 2, 1, '#b8b8be');
    col.cards.slice(0, 4).forEach((_, k) => {
      const nx = x + 1 + (k % 2) * 8, ny = 9 + Math.floor(k / 2) * 8;
      px(ctx, nx, ny, 7, 6, noteCols[(i + k) % 4]);
      px(ctx, nx + 1, ny + 2, 5, 1, 'rgba(0,0,0,0.25)');
    });
    if (i < 2) px(ctx, x + colW - 1, 1, 1, 24, '#d0d0d4');
  });
  return c;
}

export function screenTexture(kind: 'code' | 'focus' | 'idle' | 'off', seed = 0, progress = 0): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 12);
  const r = rng(seed + 3);
  if (kind === 'off') { px(ctx, 0, 0, 16, 12, '#1d2a2a'); return c; }
  px(ctx, 0, 0, 16, 12, kind === 'focus' ? '#1d3a34' : '#20303a');
  if (kind === 'code' || kind === 'idle') {
    for (let y = 1; y < 11; y += 2) {
      const ind = Math.floor(r() * 4);
      px(ctx, 1 + ind, y, 2 + Math.floor(r() * 8), 1, ['#8fe3c4', '#f7d97a', '#f0a8a8', '#8cb4dc'][Math.floor(r() * 4)]);
    }
  } else {
    // focus ring timer
    px(ctx, 2, 9, 12, 2, '#2f5c4a');
    px(ctx, 2, 9, Math.round(12 * progress), 2, '#8fe3c4');
    pixelText(ctx, 'FOCUS', 0, 2, '#8fe3c4');
  }
  return c;
}

export function posterTexture(kind: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 22);
  const palettes = [
    ['#f4e4c1', '#d9734e', '#2e3a5e'],
    ['#2e3a5e', '#f7d97a', '#8cb4dc'],
    ['#fbf1dc', '#3f7d4a', '#c08a2e'],
    ['#4a1e6e', '#ff3fb4', '#00e5ff'],
  ];
  const [bg, a, b] = palettes[kind % palettes.length];
  px(ctx, 0, 0, 16, 22, bg);
  if (kind % 4 === 0) { // mountain + sun
    px(ctx, 9, 4, 4, 4, a);
    for (let y = 0; y < 8; y++) px(ctx, 7 - y, 10 + y, 2 + y * 2, 1, b);
  } else if (kind % 4 === 1) { // coffee cup
    px(ctx, 4, 8, 7, 7, a); px(ctx, 11, 9, 2, 3, a); px(ctx, 5, 9, 5, 1, b);
    px(ctx, 6, 4, 1, 3, b); px(ctx, 8, 3, 1, 3, b);
  } else if (kind % 4 === 2) { // plant
    px(ctx, 6, 14, 5, 5, b); px(ctx, 7, 6, 3, 8, a); px(ctx, 4, 8, 3, 3, a); px(ctx, 10, 9, 3, 3, a);
  } else { // synth sun
    for (let i = 0; i < 6; i++) if (i % 2 === 0) px(ctx, 4, 5 + i, 8, 1, a);
    px(ctx, 0, 14, 16, 1, b); px(ctx, 0, 17, 16, 1, b);
  }
  px(ctx, 2, 19, 12, 1, a);
  return c;
}
