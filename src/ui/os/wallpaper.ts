import { makeCanvas, ditherGradientV, rng } from '../../engine/pixel';
import { WALLPAPERS, type Wallpaper } from '../../data/catalog';

// Procedural pixel-art desktop wallpapers (small canvas, scaled up crisp).
const cache = new Map<string, string>();

export function wallpaperURL(id: string): string {
  const hit = cache.get(id);
  if (hit) return hit;
  const wp = WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
  const url = draw(wp).toDataURL();
  cache.set(id, url);
  return url;
}

function draw(wp: Wallpaper) {
  const W = 192, H = 108;
  const [c, ctx] = makeCanvas(W, H);
  const r = rng(wp.id.length * 131 + 7);
  const px = (x: number, y: number, w: number, h: number, col: string) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  ditherGradientV(ctx, 0, 0, W, H, wp.stops);
  const [g0, g1] = wp.ground;
  const horizon = Math.floor(H * 0.68);

  const ridge = (base: number, amp: number, freq: number, col: string, seed: number) => {
    for (let x = 0; x < W; x++) {
      const y = base + Math.sin(x * freq + seed) * amp + Math.sin(x * freq * 2.3 + seed * 2) * amp * 0.4;
      px(x, y, 1, H - y, col);
    }
  };

  switch (wp.scene) {
    case 'hills':
      px(150, 18, 12, 12, '#fff6c8');
      for (let i = 0; i < 3; i++) { const cx = 20 + i * 55 + r() * 10, cy = 14 + r() * 14; px(cx, cy, 22, 4, '#ffffff'); px(cx + 4, cy - 3, 12, 3, '#ffffff'); }
      ridge(horizon - 18, 6, 0.04, '#8cc07a', 1);
      ridge(horizon - 4, 5, 0.06, g0, 3);
      ridge(horizon + 12, 4, 0.05, g1, 5);
      for (let i = 0; i < 30; i++) px(r() * W, horizon + 8 + r() * 30, 1, 1, ['#f7d97a', '#f0a8a8', '#ffffff'][i % 3]);
      break;
    case 'city':
      px(130, 40, 14, 14, '#ffd27a');
      for (let x = 0; x < W;) {
        const bw = 8 + Math.floor(r() * 14), bh = 18 + Math.floor(r() * 46);
        px(x, H - bh, bw, bh, g0);
        for (let wy = H - bh + 3; wy < H - 2; wy += 4) for (let wx = x + 2; wx < x + bw - 2; wx += 3) if (r() < 0.35) px(wx, wy, 1, 2, '#ffcf7a');
        x += bw + 1;
      }
      px(0, H - 6, W, 6, g1);
      break;
    case 'sea':
      px(40, 20, 12, 12, '#fff6c8');
      px(0, horizon, W, H - horizon, g0);
      for (let y = horizon + 2; y < H; y += 3) for (let x = (y * 7) % 11; x < W; x += 12 + (y % 5)) px(x, y, 5, 1, '#a8dcf0');
      px(120, horizon - 10, 30, 10, '#62a356'); px(128, horizon - 22, 3, 12, '#8a5234'); px(122, horizon - 26, 16, 5, '#3f7d4a');
      break;
    case 'forest':
      ridge(horizon - 10, 4, 0.05, '#9a7a5a', 2);
      for (let i = 0; i < 26; i++) {
        const tx = r() * W, th = 26 + r() * 40, base = H - 4 - r() * 10;
        for (let y = 0; y < th; y++) { const half = Math.floor((y / th) * 8) + 1; px(tx - half, base - th + y, half * 2, 1, i % 2 ? g0 : g1); }
        px(tx - 1, base, 2, 4, '#5a3a22');
      }
      break;
    case 'sakura':
      px(150, 16, 10, 10, '#ffffff');
      ridge(horizon, 5, 0.05, g0, 1);
      px(60, horizon - 40, 6, 44, '#6b3c28');
      for (let i = 0; i < 160; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 30; px(63 + Math.cos(a) * d * 1.3, horizon - 46 + Math.sin(a) * d * 0.8, 2, 2, ['#f0a8c8', '#f8c8d8', '#e888b0'][i % 3]); }
      for (let i = 0; i < 40; i++) px(r() * W, r() * H, 1, 1, '#f0a8c8');
      break;
    case 'stars':
      for (let i = 0; i < 160; i++) px(r() * W, r() * horizon, 1, 1, r() < 0.2 ? '#fff6c8' : '#9ab0e8');
      px(30, 16, 10, 10, '#fff6d8'); px(34, 15, 8, 8, wp.stops[0]);
      ridge(horizon, 8, 0.03, g0, 4);
      ridge(horizon + 14, 5, 0.05, g1, 6);
      break;
    case 'desert':
      px(140, 24, 16, 16, '#fff0b8');
      ridge(horizon - 6, 8, 0.03, '#e8b878', 1);
      ridge(horizon + 8, 6, 0.045, g0, 3);
      ridge(horizon + 22, 4, 0.06, g1, 5);
      px(40, horizon - 2, 3, 16, '#3f7d4a'); px(36, horizon + 4, 3, 2, '#3f7d4a'); px(36, horizon + 1, 2, 4, '#3f7d4a'); px(43, horizon + 2, 3, 2, '#3f7d4a'); px(45, horizon - 1, 2, 4, '#3f7d4a');
      break;
    case 'grid': {
      for (let i = 0; i < 8; i++) if (i % 3 !== 2) px(W / 2 - 22, 30 + i * 3, 44, 2, '#ffd27a');
      px(0, horizon, W, H - horizon, g0);
      for (let i = -12; i <= 12; i++) {
        for (let y = horizon; y < H; y++) { const x = W / 2 + i * 8 * ((y - horizon + 6) / 12); px(x, y, 1, 1, g1); }
      }
      for (let k = 0; k < 7; k++) { const y = horizon + Math.pow(k / 7, 2) * (H - horizon); px(0, y, W, 1, g1); }
      break;
    }
  }
  return c;
}
