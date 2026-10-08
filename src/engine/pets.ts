import * as THREE from 'three';
import { VoxBuilder, toonMat } from './vox';
import { shade } from './palette';
import type { PetKind } from './avatarTypes';

const V = 1 / 16;

export interface PetRig {
  root: THREE.Group;
  body: THREE.Group;
  tail?: THREE.Object3D;
  kind: PetKind;
  hop: number;
  x: number;
  z: number;
  facing: number;
  idleT: number;
  sitting: boolean;
}

export const PET_INFO: Record<Exclude<PetKind, 'none'>, { name: string; color: string; float?: boolean }> = {
  cat: { name: 'Cat', color: '#e2a050' },
  shiba: { name: 'Shiba', color: '#e08a40' },
  bunny: { name: 'Bunny', color: '#f4ece0' },
  duck: { name: 'Duck', color: '#f7d97a' },
  capybara: { name: 'Capybara', color: '#a07448' },
  ghost: { name: 'Ghost', color: '#eef4ff', float: true },
  dragon: { name: 'Dragon', color: '#62a356' },
  frog: { name: 'Frog', color: '#7cc05a' },
};

function mesh(build: (b: VoxBuilder) => void) {
  const b = new VoxBuilder();
  b.push(0, 0, 0, 0, V);
  build(b);
  const m = new THREE.Mesh(b.build(), toonMat());
  m.castShadow = true;
  return m;
}

export function buildPet(kind: Exclude<PetKind, 'none'>, color?: string): PetRig {
  const c = color ?? PET_INFO[kind].color;
  const d = shade(c, -0.2);
  const l = shade(c, 0.3);
  const ink = '#2a1a1f';
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  let tail: THREE.Object3D | undefined;
  const eyes = (b: VoxBuilder, y: number, z: number, sep = 1.5) => {
    b.box(-sep - 0.5, y, z, 1, 1.3, 0.2, ink);
    b.box(sep - 0.5, y, z, 1, 1.3, 0.2, ink);
  };

  switch (kind) {
    case 'cat':
    case 'shiba': {
      body.add(mesh((b) => {
        b.box(-2.5, 2, -3.5, 5, 3.5, 6, c);
        for (const [x, z] of [[-2.3, -3], [1.1, -3], [-2.3, 1.2], [1.1, 1.2]]) b.box(x, 0, z, 1.2, 2.2, 1.2, kind === 'shiba' ? l : d);
        b.box(-3, 4, 1.5, 6, 5, 4.5, c); // head
        b.box(-2.8, 8.8, 2.2, 1.6, 2, 1.4, c);
        b.box(1.2, 8.8, 2.2, 1.6, 2, 1.4, c);
        b.box(-2.4, 9, 3.4, 0.8, 1.2, 0.2, '#f0a0b0');
        b.box(1.6, 9, 3.4, 0.8, 1.2, 0.2, '#f0a0b0');
        if (kind === 'shiba') b.box(-2, 4, 5.8, 4, 2.4, 0.5, l);
        eyes(b, 6.2, 6.0);
        b.box(-0.5, 5.2, 6.05, 1, 0.6, 0.2, '#d97a86');
      }));
      const t = mesh((b) => {
        if (kind === 'shiba') { b.box(-1, 0, -2.5, 2, 2, 2.5, c); b.box(-1, 1.6, -2.4, 2, 2, 2, l); }
        else { b.box(-0.6, 0, -4, 1.2, 1.2, 4, c); b.box(-0.6, 0, -5, 1.2, 4, 1.2, d); }
      });
      t.position.set(0, 4.4 * V, -3.4 * V);
      body.add(t);
      tail = t;
      break;
    }
    case 'bunny':
      body.add(mesh((b) => {
        b.box(-2.5, 0, -3, 5, 4.5, 5.5, c);
        b.box(-2.5, 3, 1, 5, 4.5, 4, c);
        b.box(-2, 7.4, 1.8, 1.4, 4.5, 1.2, c);
        b.box(0.6, 7.4, 1.8, 1.4, 4.5, 1.2, c);
        b.box(-1.7, 8, 2.95, 0.8, 3.4, 0.2, '#f0a0b0');
        b.box(0.9, 8, 2.95, 0.8, 3.4, 0.2, '#f0a0b0');
        b.box(-1, 1.2, -4, 2, 2, 1.2, '#ffffff');
        eyes(b, 5, 5.05);
        b.box(-0.4, 4.2, 5.1, 0.8, 0.5, 0.2, '#d97a86');
      }));
      break;
    case 'duck':
      body.add(mesh((b) => {
        b.box(-2.5, 1, -3, 5, 4, 6, c);
        b.box(-2, 4, 0.5, 4, 4.5, 4, c);
        b.box(-1.3, 5, 4.4, 2.6, 1.2, 2, '#e8903a');
        b.box(-1.5, 0, -0.5, 1.2, 1, 1.8, '#e8903a');
        b.box(0.3, 0, -0.5, 1.2, 1, 1.8, '#e8903a');
        b.box(-3, 2, -2, 0.6, 2.5, 4, d);
        b.box(2.4, 2, -2, 0.6, 2.5, 4, d);
        eyes(b, 6.4, 4.55, 1.2);
      }));
      break;
    case 'capybara':
      body.add(mesh((b) => {
        b.box(-3, 1.5, -4, 6, 5, 8, c);
        for (const [x, z] of [[-2.6, -3.4], [1.4, -3.4], [-2.6, 2.4], [1.4, 2.4]]) b.box(x, 0, z, 1.2, 1.8, 1.2, d);
        b.box(-2.5, 3.5, 3, 5, 4, 4.5, c);
        b.box(-2, 3.5, 7.2, 4, 2.4, 0.6, d);
        b.box(-2.3, 7.3, 3.4, 1, 1, 1, d);
        b.box(1.3, 7.3, 3.4, 1, 1, 1, d);
        b.box(-0.8, 7.5, 4, 1.6, 0.6, 1.6, '#f7d97a'); // tiny orange on head
        eyes(b, 5.6, 7.55, 1.4);
      }));
      break;
    case 'ghost':
      body.add(mesh((b) => {
        b.box(-3, 2, -3, 6, 6.5, 6, c);
        b.box(-2.5, 8.5, -2.5, 5, 1, 5, c);
        for (let i = 0; i < 3; i++) b.box(-3 + i * 2.1, 0.6, -3, 1.6, 1.6, 6, c);
        eyes(b, 5.5, 3.05);
        b.box(-0.7, 3.6, 3.05, 1.4, 1.2, 0.2, '#6e4a7a');
        b.box(-2.6, 4.6, 3.05, 0.8, 0.6, 0.2, '#f0a0b0');
        b.box(1.8, 4.6, 3.05, 0.8, 0.6, 0.2, '#f0a0b0');
      }));
      break;
    case 'dragon':
      body.add(mesh((b) => {
        b.box(-2.5, 2, -3, 5, 4, 6, c);
        for (const [x, z] of [[-2.3, -2.6], [1.1, -2.6], [-2.3, 1.4], [1.1, 1.4]]) b.box(x, 0, z, 1.2, 2.2, 1.2, d);
        b.box(-2.6, 4.5, 1.8, 5.2, 4.6, 4.6, c);
        b.box(-1.6, 5, 6.2, 3.2, 2, 1.2, l);
        b.box(-2.2, 9, 2, 1, 2, 1, '#f7d97a');
        b.box(1.2, 9, 2, 1, 2, 1, '#f7d97a');
        b.box(-6, 5, -2, 3.6, 0.6, 4, l);
        b.box(2.4, 5, -2, 3.6, 0.6, 4, l);
        b.box(-0.6, 5.8, -3.6, 1.2, 1.2, 2, '#f7d97a');
        eyes(b, 7, 6.45);
      }));
      tail = mesh((b) => { b.box(-1, 0, -3, 2, 1.6, 3, c); b.box(-0.6, 0.2, -5, 1.2, 1.2, 2, d); });
      tail.position.set(0, 2.8 * V, -3 * V);
      body.add(tail);
      break;
    case 'frog':
      body.add(mesh((b) => {
        b.box(-3, 0.5, -2.5, 6, 3.5, 5.5, c);
        b.box(-2.6, 0.5, 2.8, 5.2, 0.6, 0.4, '#f0a8a8');
        b.box(-3.3, 3.2, 0.5, 2.4, 2.4, 2.4, c);
        b.box(0.9, 3.2, 0.5, 2.4, 2.4, 2.4, c);
        b.box(-2.7, 4, 2.95, 1.2, 1.2, 0.2, '#ffffff');
        b.box(1.5, 4, 2.95, 1.2, 1.2, 0.2, '#ffffff');
        b.box(-2.4, 4.2, 3.05, 0.6, 0.7, 0.2, ink);
        b.box(1.8, 4.2, 3.05, 0.6, 0.7, 0.2, ink);
        b.box(-3.6, 0, -2, 1.4, 1, 2.6, d);
        b.box(2.2, 0, -2, 1.4, 1, 2.6, d);
      }));
      break;
  }
  return { root, body, tail, kind, hop: 0, x: 0, z: 0, facing: 0, idleT: 0, sitting: false };
}

export function animatePet(p: PetRig, dt: number, moving: boolean, t: number) {
  if (moving) p.hop += dt * 12;
  const float = PET_INFO[p.kind as Exclude<PetKind, 'none'>]?.float;
  const bob = float ? 0.22 + Math.sin(t * 2.5) * 0.06 : moving ? Math.abs(Math.sin(p.hop)) * 0.08 : Math.sin(t * 2) * 0.004;
  p.body.position.y = bob;
  p.body.rotation.z = moving ? Math.sin(p.hop) * 0.08 : 0;
  if (p.tail) p.tail.rotation.y = Math.sin(t * (moving ? 12 : 4)) * 0.5;
}
