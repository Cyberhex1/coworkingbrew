import * as THREE from 'three';

// VoxBuilder collects axis-aligned colored boxes and bakes them into one
// BufferGeometry with vertex colors, so a whole room is a handful of draw calls.

export interface BoxOpts {
  /** Darken the bottom vertices a touch for cheap ambient occlusion. */
  ao?: number;
}

type Xform = { x: number; y: number; z: number; rot: number; s: number };

const tmpColor = new THREE.Color();

export class VoxBuilder {
  positions: number[] = [];
  normals: number[] = [];
  colors: number[] = [];
  indices: number[] = [];
  private stack: Xform[] = [{ x: 0, y: 0, z: 0, rot: 0, s: 1 }];

  get xf() {
    return this.stack[this.stack.length - 1];
  }

  /** Push a local frame: translate then rotate by quarter turns (0..3) around Y. */
  push(x: number, y: number, z: number, rotQuarter = 0, scale = 1) {
    const p = this.xf;
    const [wx, wz] = rot(x * p.s, z * p.s, p.rot);
    this.stack.push({ x: p.x + wx, y: p.y + y * p.s, z: p.z + wz, rot: (p.rot + rotQuarter) & 3, s: p.s * scale });
    return this;
  }

  pop() {
    if (this.stack.length > 1) this.stack.pop();
    return this;
  }

  /** Add a box by min corner (x,y,z) and size (w,h,d) in the current local frame. */
  box(x: number, y: number, z: number, w: number, h: number, d: number, color: string | number, opts: BoxOpts = {}) {
    const f = this.xf;
    // transform the two corners, then re-sort into min/max
    const [ax, az] = rot(x * f.s, z * f.s, f.rot);
    const [bx, bz] = rot((x + w) * f.s, (z + d) * f.s, f.rot);
    const x0 = f.x + Math.min(ax, bx), x1 = f.x + Math.max(ax, bx);
    const z0 = f.z + Math.min(az, bz), z1 = f.z + Math.max(az, bz);
    const y0 = f.y + y * f.s, y1 = f.y + (y + h) * f.s;
    this.rawBox(x0, y0, z0, x1, y1, z1, color, opts);
    return this;
  }

  /** Box centered on (cx, *, cz) with bottom at y. Handy for furniture legs/props. */
  cbox(cx: number, y: number, cz: number, w: number, h: number, d: number, color: string | number, opts?: BoxOpts) {
    return this.box(cx - w / 2, y, cz - d / 2, w, h, d, color, opts);
  }

  rawBox(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, color: string | number, opts: BoxOpts = {}) {
    tmpColor.set(color as THREE.ColorRepresentation);
    const r = tmpColor.r, g = tmpColor.g, b = tmpColor.b;
    const ao = opts.ao ?? 0;
    // faces: +x, -x, +y, -y, +z, -z
    const faces: [number[], number[][]][] = [
      [[1, 0, 0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]]],
      [[-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]],
      [[0, 1, 0], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]]],
      [[0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]],
      [[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]],
      [[0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]]],
    ];
    for (const [n, verts] of faces) {
      const base = this.positions.length / 3;
      for (const v of verts) {
        this.positions.push(v[0], v[1], v[2]);
        this.normals.push(n[0], n[1], n[2]);
        const k = ao > 0 && v[1] === y0 ? 1 - ao : 1;
        this.colors.push(r * k, g * k, b * k);
      }
      this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }

  isEmpty() {
    return this.positions.length === 0;
  }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    g.setIndex(this.indices);
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

function rot(x: number, z: number, q: number): [number, number] {
  switch (q & 3) {
    case 1: return [-z, x];
    case 2: return [-x, -z];
    case 3: return [z, -x];
    default: return [x, z];
  }
}

// ---------- shared materials ----------

let gradientMap: THREE.DataTexture | null = null;
export function toonGradient(): THREE.DataTexture {
  if (gradientMap) return gradientMap;
  const tones = new Uint8Array([150, 150, 150, 255, 205, 205, 205, 255, 255, 255, 255, 255]);
  gradientMap = new THREE.DataTexture(tones, 3, 1, THREE.RGBAFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.generateMipmaps = false;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

const matCache = new Map<string, THREE.Material>();

/** Lit toon material driven by vertex colors. */
export function toonMat(): THREE.MeshToonMaterial {
  let m = matCache.get('toon') as THREE.MeshToonMaterial | undefined;
  if (!m) {
    m = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonGradient() });
    matCache.set('toon', m);
  }
  return m;
}

/** Unlit material for glowing things (screens, lamp shades, windows). */
export function glowMat(): THREE.MeshBasicMaterial {
  let m = matCache.get('glow') as THREE.MeshBasicMaterial | undefined;
  if (!m) {
    m = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    matCache.set('glow', m);
  }
  return m;
}

export function glassMat(): THREE.MeshBasicMaterial {
  let m = matCache.get('glass') as THREE.MeshBasicMaterial | undefined;
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: '#cfeef4', transparent: true, opacity: 0.28, depthWrite: false });
    matCache.set('glass', m);
  }
  return m;
}

export function meshFrom(b: VoxBuilder, kind: 'toon' | 'glow' = 'toon', shadows = true): THREE.Mesh {
  const mesh = new THREE.Mesh(b.build(), kind === 'toon' ? toonMat() : glowMat());
  if (kind === 'toon' && shadows) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
  return mesh;
}
