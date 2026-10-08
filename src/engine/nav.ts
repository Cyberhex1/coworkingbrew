// Occupancy grid + A* for click-to-move and NPC wandering.
export const CELL = 0.25;

export class NavGrid {
  w: number;
  h: number;
  blocked: Uint8Array; // raw obstacles
  inflated: Uint8Array; // obstacles grown by the walker radius (for pathing)

  constructor(public widthUnits: number, public depthUnits: number) {
    this.w = Math.ceil(widthUnits / CELL);
    this.h = Math.ceil(depthUnits / CELL);
    this.blocked = new Uint8Array(this.w * this.h);
    this.inflated = new Uint8Array(this.w * this.h);
  }

  /** Mark an axis-aligned world rect as solid. */
  block(x0: number, z0: number, x1: number, z1: number) {
    const cx0 = Math.max(0, Math.floor(Math.min(x0, x1) / CELL));
    const cz0 = Math.max(0, Math.floor(Math.min(z0, z1) / CELL));
    const cx1 = Math.min(this.w - 1, Math.ceil(Math.max(x0, x1) / CELL) - 1);
    const cz1 = Math.min(this.h - 1, Math.ceil(Math.max(z0, z1) / CELL) - 1);
    for (let z = cz0; z <= cz1; z++) for (let x = cx0; x <= cx1; x++) this.blocked[z * this.w + x] = 1;
  }

  unblock(x0: number, z0: number, x1: number, z1: number) {
    const cx0 = Math.max(0, Math.floor(x0 / CELL)), cz0 = Math.max(0, Math.floor(z0 / CELL));
    const cx1 = Math.min(this.w - 1, Math.ceil(x1 / CELL) - 1), cz1 = Math.min(this.h - 1, Math.ceil(z1 / CELL) - 1);
    for (let z = cz0; z <= cz1; z++) for (let x = cx0; x <= cx1; x++) this.blocked[z * this.w + x] = 0;
  }

  finalize() {
    const { w, h } = this;
    for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
      let solid = 0;
      for (let dz = -1; dz <= 1 && !solid; dz++) for (let dx = -1; dx <= 1 && !solid; dx++) {
        const xx = x + dx, zz = z + dz;
        if (xx < 0 || zz < 0 || xx >= w || zz >= h || this.blocked[zz * w + xx]) solid = 1;
      }
      this.inflated[z * w + x] = solid;
    }
  }

  isSolidAt(x: number, z: number): boolean {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    if (cx < 0 || cz < 0 || cx >= this.w || cz >= this.h) return true;
    return this.blocked[cz * this.w + cx] === 1;
  }

  /** Circle-vs-grid test used for player movement. */
  canStand(x: number, z: number, r = 0.2): boolean {
    if (this.isSolidAt(x, z)) return false;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      if (this.isSolidAt(x + Math.cos(a) * r, z + Math.sin(a) * r)) return false;
    }
    return true;
  }

  private nearestOpen(cx: number, cz: number, grid: Uint8Array): [number, number] | null {
    for (let rad = 0; rad < 12; rad++) {
      for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== rad) continue;
        const x = cx + dx, z = cz + dz;
        if (x >= 0 && z >= 0 && x < this.w && z < this.h && !grid[z * this.w + x]) return [x, z];
      }
    }
    return null;
  }

  /** A* from world point to world point. Returns world waypoints (excluding start). */
  findPath(sx: number, sz: number, tx: number, tz: number): { x: number; z: number }[] | null {
    const { w, h } = this;
    const grid = this.inflated;
    let s = [Math.floor(sx / CELL), Math.floor(sz / CELL)] as [number, number];
    let t = [Math.floor(tx / CELL), Math.floor(tz / CELL)] as [number, number];
    if (grid[s[1] * w + s[0]]) s = this.nearestOpen(s[0], s[1], grid) ?? s;
    const targetInside = !!grid[t[1] * w + t[0]];
    if (targetInside) {
      const n = this.nearestOpen(t[0], t[1], grid);
      if (!n) return null;
      t = n;
    }
    const N = w * h;
    const g = new Float32Array(N).fill(Infinity);
    const f = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const open: number[] = [];
    const si = s[1] * w + s[0], ti = t[1] * w + t[0];
    const hf = (i: number) => {
      const x = i % w, z = (i / w) | 0;
      const dx = Math.abs(x - t[0]), dz = Math.abs(z - t[1]);
      return Math.max(dx, dz) + 0.414 * Math.min(dx, dz);
    };
    g[si] = 0;
    f[si] = hf(si);
    open.push(si);
    let iter = 0;
    while (open.length && iter++ < 20000) {
      let bi = 0;
      for (let k = 1; k < open.length; k++) if (f[open[k]] < f[open[bi]]) bi = k;
      const cur = open[bi];
      open.splice(bi, 1);
      if (cur === ti) break;
      closed[cur] = 1;
      const cx = cur % w, cz = (cur / w) | 0;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const nx = cx + dx, nz = cz + dz;
        if (nx < 0 || nz < 0 || nx >= w || nz >= h) continue;
        const ni = nz * w + nx;
        if (grid[ni] || closed[ni]) continue;
        if (dx && dz && (grid[cz * w + nx] || grid[nz * w + cx])) continue; // no corner cutting
        const ng = g[cur] + (dx && dz ? 1.414 : 1);
        if (ng < g[ni]) {
          g[ni] = ng;
          f[ni] = ng + hf(ni);
          came[ni] = cur;
          if (!open.includes(ni)) open.push(ni);
        }
      }
    }
    if (came[ti] === -1 && si !== ti) return null;
    const cells: number[] = [];
    for (let c = ti; c !== -1 && c !== si; c = came[c]) cells.push(c);
    cells.reverse();
    // string-pull: drop waypoints that have clear line of sight
    const pts = cells.map((i) => ({ x: ((i % w) + 0.5) * CELL, z: (((i / w) | 0) + 0.5) * CELL }));
    if (!targetInside) pts.push({ x: tx, z: tz });
    const out: { x: number; z: number }[] = [];
    let ax = sx, az = sz;
    for (let i = 0; i < pts.length; i++) {
      const next = pts[i + 1];
      if (next && this.lineClear(ax, az, next.x, next.z)) continue;
      out.push(pts[i]);
      ax = pts[i].x;
      az = pts[i].z;
    }
    return out;
  }

  lineClear(ax: number, az: number, bx: number, bz: number): boolean {
    const d = Math.hypot(bx - ax, bz - az);
    const steps = Math.ceil(d / (CELL * 0.5));
    for (let i = 1; i <= steps; i++) {
      const x = ax + ((bx - ax) * i) / steps, z = az + ((bz - az) * i) / steps;
      const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
      if (cx < 0 || cz < 0 || cx >= this.w || cz >= this.h || this.inflated[cz * this.w + cx]) return false;
    }
    return true;
  }
}
