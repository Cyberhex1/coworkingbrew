import * as THREE from 'three';
import { LAYER_NO_OUTLINE } from './pipeline';

// Pooled square pixel particles (THREE.Points render as squares, so in the
// low-res buffer each particle is a crisp 1–2 texel dot).

interface P {
  alive: boolean;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; max: number;
  r: number; g: number; b: number;
  grav: number;
}

export class Particles {
  points: THREE.Points;
  private pool: P[] = [];
  private pos: Float32Array;
  private col: Float32Array;
  private geo: THREE.BufferGeometry;

  constructor(max = 600, size = 1.6) {
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    for (let i = 0; i < max; i++) this.pool.push({ alive: false, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, r: 1, g: 1, b: 1, grav: 0 });
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    const mat = new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    this.points.layers.set(LAYER_NO_OUTLINE);
  }

  setSize(px: number) {
    (this.points.material as THREE.PointsMaterial).size = px;
  }

  spawn(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, color: THREE.Color, gravity = 0) {
    const p = this.pool.find((q) => !q.alive);
    if (!p) return;
    p.alive = true;
    p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz;
    p.life = life; p.max = life;
    p.r = color.r; p.g = color.g; p.b = color.b;
    p.grav = gravity;
  }

  update(dt: number, t: number) {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (p.alive) {
        p.life -= dt;
        if (p.life <= 0) { p.alive = false; p.y = -99; }
        p.x += p.vx * dt + Math.sin(t * 3 + i) * 0.002;
        p.vy -= p.grav * dt;
        p.y = Math.max(0.02, p.y + p.vy * dt);
        p.z += p.vz * dt;
      }
      this.pos[i * 3] = p.x;
      this.pos[i * 3 + 1] = p.alive ? p.y : -99;
      this.pos[i * 3 + 2] = p.z;
      const fade = p.alive ? Math.min(1, p.life / (p.max * 0.5)) : 0;
      this.col[i * 3] = p.r * fade;
      this.col[i * 3 + 1] = p.g * fade;
      this.col[i * 3 + 2] = p.b * fade;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}
