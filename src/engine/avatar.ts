import * as THREE from 'three';
import { VoxBuilder, toonMat, glowMat } from './vox';
import { shade } from './palette';
import type { AvatarConfig, AnimState } from './avatarTypes';

// A voxel chibi. Built in "voxel" units (1/16 of a world unit) so one voxel is
// roughly one screen texel at the default zoom.
const V = 1 / 16;

function part(build: (b: VoxBuilder) => void, glow = false): THREE.Mesh {
  const b = new VoxBuilder();
  b.push(0, 0, 0, 0, V);
  build(b);
  const m = new THREE.Mesh(b.build(), glow ? glowMat() : toonMat());
  m.castShadow = !glow;
  return m;
}

export interface AvatarRig {
  root: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  eyes: THREE.Mesh;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  tail?: THREE.Group;
  hand: THREE.Group; // right hand attach point
  heldItem: THREE.Object3D | null;
  heldKind: string | null;
  config: AvatarConfig;
  phase: number;
  blinkT: number;
  state: AnimState;
  stateT: number;
}

export function buildAvatar(cfg: AvatarConfig): AvatarRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const skin = cfg.skin;
  const skinDk = shade(skin, -0.14);
  const top = cfg.topColor;
  const topDk = shade(top, -0.18);
  const bottom = cfg.top === 'overalls' ? cfg.bottomColor : cfg.bottomColor;
  const fullSleeve = cfg.top === 'sweater' || cfg.top === 'hoodie' || cfg.top === 'cardigan' || cfg.top === 'kimono';

  // ---- legs
  const mkLeg = (x: number) => {
    const g = new THREE.Group();
    g.position.set(x * V, 6 * V, 0);
    g.add(part((b) => {
      b.box(-1.5, -4, -1.5, 3, 4, 3, bottom);
      b.box(-1.5, -6, -1.5, 3, 2, 3, cfg.top === 'apron' ? bottom : shade(bottom, -0.05));
      b.box(-1.6, -6, -1.6, 3.2, 1.5, 3.9, cfg.shoeColor);
      b.box(-1.6, -6, 1.6, 3.2, 0.5, 0.7, shade(cfg.shoeColor, -0.25));
    }));
    body.add(g);
    return g;
  };
  const legL = mkLeg(-1.6);
  const legR = mkLeg(1.6);

  // ---- torso
  const torso = new THREE.Group();
  torso.position.set(0, 6 * V, 0);
  body.add(torso);
  torso.add(part((b) => {
    const tc = cfg.top === 'overalls' ? top : top;
    b.box(-3.5, 0, -2, 7, 6.2, 4, tc, { ao: 0.12 });
    switch (cfg.top) {
      case 'hoodie':
        b.box(-3, 5, -3.2, 6, 2.5, 1.6, topDk); // hood
        b.box(-2, 1, 1.95, 4, 2, 0.3, topDk); // pocket
        b.box(-1.2, 3.2, 2, 0.5, 2, 0.3, '#fbf1dc');
        b.box(0.7, 3.2, 2, 0.5, 2, 0.3, '#fbf1dc');
        break;
      case 'sweater':
        b.box(-3.55, 2.5, -2.05, 7.1, 1.2, 4.1, shade(top, 0.3));
        b.box(-2, 5.4, 1.9, 4, 0.8, 0.3, topDk);
        break;
      case 'overalls':
        b.box(-2.5, 0, 1.9, 5, 4.2, 0.35, cfg.bottomColor);
        b.box(-2.7, 4, 1.9, 1, 2.2, 0.35, cfg.bottomColor);
        b.box(1.7, 4, 1.9, 1, 2.2, 0.35, cfg.bottomColor);
        b.box(-2.5, 0, -2.05, 5, 3, 0.3, cfg.bottomColor);
        b.box(-0.5, 2.5, 2.2, 1, 1, 0.2, '#e2b04a');
        break;
      case 'cardigan':
        b.box(-1, 0, 1.9, 2, 6.2, 0.35, '#fbf1dc');
        b.box(-1.5, 0.5, 2.2, 0.6, 0.6, 0.2, '#c08a2e');
        b.box(-1.5, 2.5, 2.2, 0.6, 0.6, 0.2, '#c08a2e');
        break;
      case 'apron':
        b.box(-3, 0, 1.9, 6, 5, 0.35, '#f4e4c1');
        b.box(-3.6, 2.2, -2.1, 7.2, 0.7, 4.2, '#c9b28c');
        b.box(-1.5, 1.2, 2.2, 3, 1.2, 0.2, '#e6cf9f');
        break;
      case 'kimono':
        b.box(-3.6, 1.6, -2.1, 7.2, 1.4, 4.2, cfg.extraColor);
        b.box(-0.5, 3, 1.95, 1, 3.2, 0.3, shade(top, 0.35));
        break;
      default: // tee
        b.box(-1, 5.6, 1.95, 2, 0.6, 0.2, skin);
    }
    // waist band / belt
    if (cfg.top !== 'overalls' && cfg.top !== 'kimono') b.box(-3.55, 0, -2.05, 7.1, 0.8, 4.1, shade(bottom, -0.1));
    // extras worn on torso
    if (cfg.extra === 'scarf') {
      b.box(-3.7, 5, -2.2, 7.4, 1.6, 4.4, cfg.extraColor);
      b.box(1, 1.5, 2.2, 1.6, 3.6, 0.5, cfg.extraColor);
      b.box(1, 1.5, 2.6, 1.6, 0.6, 0.2, shade(cfg.extraColor, 0.3));
    }
    if (cfg.extra === 'backpack') {
      b.box(-2.8, 0.8, -4.2, 5.6, 5, 2.2, cfg.extraColor, { ao: 0.15 });
      b.box(-2, 1.4, -4.6, 4, 2, 0.5, shade(cfg.extraColor, -0.2));
    }
    if (cfg.extra === 'wings') {
      b.box(-6.5, 1.5, -3, 5, 5, 0.6, '#ffffff');
      b.box(1.5, 1.5, -3, 5, 5, 0.6, '#ffffff');
      b.box(-6, 2, -3.1, 4, 1, 0.3, cfg.extraColor);
      b.box(2, 2, -3.1, 4, 1, 0.3, cfg.extraColor);
    }
  }));

  // ---- arms
  const mkArm = (side: -1 | 1) => {
    const g = new THREE.Group();
    g.position.set(side * 4.6 * V, 11.6 * V, 0);
    const w = cfg.top === 'kimono' ? 3 : 2;
    g.add(part((b) => {
      const sleeveLen = fullSleeve ? 4.6 : 2.6;
      b.box(-w / 2, -sleeveLen, -1, w, sleeveLen, 2, cfg.top === 'apron' ? top : top);
      if (!fullSleeve) b.box(-0.9, -4.6, -0.9, 1.8, 2, 1.8, skin);
      b.box(-0.95, -6, -0.95, 1.9, 1.5, 1.9, skin);
      if (fullSleeve) b.box(-w / 2 - 0.05, -4.8, -1.05, w + 0.1, 0.6, 2.1, topDk);
    }));
    torso.parent!.add(g);
    return g;
  };
  const armL = mkArm(-1);
  const armR = mkArm(1);
  const hand = new THREE.Group();
  hand.position.set(0, -5.6 * V, 0.6 * V);
  armR.add(hand);

  // ---- head
  const head = new THREE.Group();
  head.position.set(0, 12 * V, 0);
  body.add(head);
  head.add(part((b) => buildHead(b, cfg, skin, skinDk)));

  const eyes = part((b) => buildEyes(b, cfg));
  eyes.castShadow = false;
  head.add(eyes);

  if (cfg.glasses === 'visor') {
    head.add(part((b) => b.box(-4.6, 4, 4.7, 9.2, 1.8, 0.5, '#7cf0ff'), true));
  }

  // ---- tail
  let tail: THREE.Group | undefined;
  if (cfg.extra === 'foxtail' || cfg.extra === 'cattail') {
    tail = new THREE.Group();
    tail.position.set(0, 7 * V, -2 * V);
    tail.add(part((b) => {
      if (cfg.extra === 'foxtail') {
        b.box(-1.5, -1, -4, 3, 3, 4, cfg.extraColor);
        b.box(-2, -0.5, -7, 4, 3.5, 3, cfg.extraColor);
        b.box(-1.5, 0, -8.6, 3, 2.6, 1.8, '#fbf1dc');
      } else {
        b.box(-0.6, -0.6, -4, 1.2, 1.2, 4, cfg.extraColor);
        b.box(-0.6, -0.6, -5, 1.2, 4, 1.2, cfg.extraColor);
      }
    }));
    body.add(tail);
  }

  return {
    root, body, torso, head, eyes, armL, armR, legL, legR, tail, hand,
    heldItem: null, heldKind: null, config: cfg, phase: 0, blinkT: 2 + Math.random() * 3, state: 'idle', stateT: 0,
  };
}

function buildHead(b: VoxBuilder, cfg: AvatarConfig, skin: string, skinDk: string) {
  const hc = cfg.hairColor;
  const hcD = shade(hc, -0.2);
  const hcL = shade(hc, 0.18);
  // skull
  b.box(-5, 0, -4.5, 10, 9, 9, skin);
  b.box(-5.01, 0, -4.51, 10.02, 0.6, 9.02, skinDk); // jaw shade
  // ears
  b.box(-5.6, 3, -0.5, 0.7, 2, 1.5, skinDk);
  b.box(4.9, 3, -0.5, 0.7, 2, 1.5, skinDk);
  // mouth + blush
  b.box(-0.6, 1.6, 4.5, 1.2, 0.5, 0.15, shade(skin, -0.35));
  if (cfg.eyes !== 'sleepy') {
    b.box(-4, 2.2, 4.5, 1.4, 0.9, 0.12, '#f0a0a0');
    b.box(2.6, 2.2, 4.5, 1.4, 0.9, 0.12, '#f0a0a0');
  }

  // hair
  const cap = (sideBottom: number, backBottom: number, width = 5.5) => {
    b.box(-width, 7.5, -5, width * 2, 2.3, 10, hc); // top
    b.box(-width, backBottom, -5.2, width * 2, 9.8 - backBottom, 1.4, hc); // back
    b.box(-width, sideBottom, -5, 1, 9.8 - sideBottom, 8, hc); // left
    b.box(width - 1, sideBottom, -5, 1, 9.8 - sideBottom, 8, hc); // right
    // fringe
    b.box(-5.2, 6.4, 4.2, 10.4, 1.6, 1, hc);
    b.box(-5.2, 5.6, 4.2, 2.4, 1, 1, hc);
    b.box(2.8, 5.6, 4.2, 2.4, 1, 1, hc);
    b.box(-1, 5.8, 4.2, 1.6, 0.8, 1, hcD);
    b.box(-4, 9.6, -3, 5, 0.4, 4, hcL); // shine
  };
  switch (cfg.hair) {
    case 'short': cap(4, 2); break;
    case 'buzz':
      b.box(-5.15, 6.8, -4.65, 10.3, 2.4, 9.3, hc);
      b.box(-5.15, 3, -4.65, 10.3, 4, 1.4, hc);
      break;
    case 'long':
      cap(-1, -5);
      b.box(-5.5, -6, -5.2, 11, 6, 2, hc);
      b.box(-6.2, -4, -3, 1.4, 8, 5, hcD);
      b.box(4.8, -4, -3, 1.4, 8, 5, hcD);
      break;
    case 'bob':
      cap(1, 0.5, 5.8);
      b.box(-6.3, 0.5, -4, 1, 7, 7, hcD);
      b.box(5.3, 0.5, -4, 1, 7, 7, hcD);
      break;
    case 'bun':
      cap(4, 2);
      b.box(-2, 9.2, -3, 4, 3.4, 4, hc);
      b.box(-1.2, 12.3, -2.2, 2.4, 0.6, 2.4, hcL);
      break;
    case 'ponytail':
      cap(4, 2);
      b.box(-1.2, 1, -7.6, 2.4, 7, 2.4, hc);
      b.box(-1.4, 6.5, -6.5, 2.8, 1.2, 1.6, cfg.hatColor);
      break;
    case 'afro':
      b.box(-6.8, 6, -6, 13.6, 6.5, 12.4, hc);
      b.box(-6.8, 1, -6.5, 13.6, 6, 3.5, hc);
      b.box(-6.8, 2, -4, 2, 5, 8, hc);
      b.box(4.8, 2, -4, 2, 5, 8, hc);
      b.box(-5.6, 6, 4.2, 11.2, 1.6, 2, hc);
      b.box(-5, 11.8, -4, 6, 0.8, 5, hcL);
      break;
    case 'spiky':
      cap(4, 2);
      for (let i = 0; i < 4; i++) b.box(-4.5 + i * 2.6, 9.6, -2 + (i % 2) * 2, 2, 2 + (i % 2), 2, hc);
      b.box(-1, 8.4, 4.6, 2, 2.2, 1.2, hc);
      break;
    case 'braids':
      cap(2, 1);
      for (const s of [-1, 1]) {
        for (let k = 0; k < 4; k++) b.box(s * 5.6 - 1, -1 - k * 2.2, 1.2, 2, 2, 2, k % 2 ? hcD : hc);
        b.box(s * 5.6 - 0.8, -8.2, 1.4, 1.6, 0.9, 1.6, cfg.hatColor);
      }
      break;
    case 'curly':
      cap(3, 1.5, 5.8);
      for (let i = 0; i < 6; i++) b.box(-5.6 + i * 2, 9.4, -4 + (i % 3) * 2.6, 2, 1.3, 2, i % 2 ? hcD : hc);
      b.box(-6.5, 2, -3, 1.2, 4, 3, hc);
      b.box(5.3, 2, -3, 1.2, 4, 3, hc);
      break;
  }

  // hats
  const hat = cfg.hatColor;
  const hatTopY = cfg.hair === 'afro' ? 12.4 : 9.8;
  switch (cfg.hat) {
    case 'beanie':
      b.box(-5.8, 6.8, -5.4, 11.6, 4.6, 10.8, hat);
      b.box(-5.95, 6.4, -5.55, 11.9, 1.6, 11.1, shade(hat, -0.2));
      b.box(-1.2, 11.4, -1.2, 2.4, 2, 2.4, '#fbf1dc');
      break;
    case 'cap':
      b.box(-5.6, 7.2, -5.2, 11.2, 3.4, 10.4, hat);
      b.box(-4, 7, 4.8, 8, 0.8, 4.4, shade(hat, -0.2));
      b.box(-0.6, 10.5, -0.6, 1.2, 0.6, 1.2, shade(hat, 0.3));
      break;
    case 'catears':
      for (const s of [-1, 1]) {
        b.box(s * 3.2 - 1.6, hatTopY - 0.3, -0.5, 3.2, 1.6, 1.6, cfg.hairColor === hat ? hat : hat);
        b.box(s * 3.2 - 1, hatTopY + 1.2, -0.5, 2, 1.4, 1.6, hat);
        b.box(s * 3.2 - 0.5, hatTopY + 2.5, -0.5, 1, 1, 1.6, hat);
        b.box(s * 3.2 - 0.6, hatTopY + 0.4, 1.1, 1.2, 1.6, 0.2, '#f0a0b0');
      }
      break;
    case 'frog':
      b.box(-5.6, 7, -5.2, 11.2, 4, 10.4, '#62a356');
      for (const s of [-1, 1]) {
        b.box(s * 2.8 - 1.6, 10.6, 1, 3.2, 3, 3.2, '#62a356');
        b.box(s * 2.8 - 1, 11.4, 4.1, 2, 2, 0.3, '#ffffff');
        b.box(s * 2.8 - 0.4, 11.8, 4.3, 0.9, 1.1, 0.2, '#2a1a1f');
      }
      break;
    case 'wizard':
      b.box(-7.5, hatTopY - 1, -7, 15, 1, 14, hat);
      b.box(-4.5, hatTopY, -4.5, 9, 4, 9, hat);
      b.box(-3, hatTopY + 4, -3, 6, 4, 6, hat);
      b.box(-1.5, hatTopY + 8, -1.5, 3, 3.5, 3, hat);
      b.box(-0.5, hatTopY + 11.5, 0, 1.5, 1.5, 1.5, hat);
      b.box(-2, hatTopY + 2, 4.55, 1, 1, 0.2, '#f7d97a');
      b.box(1.5, hatTopY + 5, 3.05, 1, 1, 0.2, '#f7d97a');
      b.box(-4.6, hatTopY, -4.6, 9.2, 1, 9.2, '#f7d97a');
      break;
    case 'crown':
      b.box(-4.5, hatTopY - 0.5, -4.5, 9, 2.4, 9, '#e2b04a');
      for (const [x, z] of [[-4.5, 3.5], [-0.5, 3.5], [3.5, 3.5], [-4.5, -4.5], [3.5, -4.5]]) b.box(x, hatTopY + 1.9, z, 1, 1.6, 1, '#f7d97a');
      b.box(-0.6, hatTopY + 0.4, 4.55, 1.2, 1.2, 0.2, '#d9734e');
      break;
    case 'headphones':
      b.box(-6, hatTopY - 0.4, -1, 12, 1.4, 2, '#3a3a44');
      for (const s of [-1, 1]) {
        b.box(s * 5.6 - 1.1, 2.6, -1.8, 2.2, 4.4, 3.6, hat);
        b.box(s * 5.6 - 1, 5, -1, 2, hatTopY - 5, 1.2, '#3a3a44');
      }
      break;
    case 'bow':
      b.box(1, hatTopY - 0.4, -1, 2, 2, 2, shade(hat, -0.1));
      b.box(-1.8, hatTopY - 0.6, -1, 2.8, 2.6, 2, hat);
      b.box(3, hatTopY - 0.6, -1, 2.8, 2.6, 2, hat);
      break;
    case 'flower':
      b.box(3.8, 7.4, 1.5, 2.4, 2.4, 2, hat);
      b.box(4.4, 8, 3.4, 1.2, 1.2, 0.4, '#f7d97a');
      b.box(4.2, 6.2, 2, 1.6, 1.4, 1, '#62a356');
      break;
    case 'beret':
      b.box(-5.8, hatTopY - 0.6, -5.2, 11.6, 1.8, 10.4, hat);
      b.box(-6.6, hatTopY + 0.2, -3.8, 4, 1.4, 7, hat);
      b.box(-0.4, hatTopY + 1.2, -0.4, 0.8, 0.8, 0.8, shade(hat, -0.3));
      break;
  }

  // glasses (frames)
  const g = cfg.glasses;
  if (g === 'round' || g === 'square') {
    const fc = g === 'round' ? '#8a5a1e' : '#2a1a1f';
    for (const s of [-1, 1]) {
      const x = s * 2.4 - 1.6;
      b.box(x, 3.4, 4.62, 3.2, 0.5, 0.2, fc);
      b.box(x, 5.7, 4.62, 3.2, 0.5, 0.2, fc);
      b.box(x, 3.4, 4.62, 0.5, 2.8, 0.2, fc);
      b.box(x + 2.7, 3.4, 4.62, 0.5, 2.8, 0.2, fc);
    }
    b.box(-0.8, 5.2, 4.62, 1.6, 0.4, 0.2, fc);
  } else if (g === 'sun') {
    b.box(-4.2, 3.6, 4.62, 3.4, 2.4, 0.25, '#1d2440');
    b.box(0.8, 3.6, 4.62, 3.4, 2.4, 0.25, '#1d2440');
    b.box(-0.8, 5.2, 4.62, 1.6, 0.5, 0.2, '#1d2440');
    b.box(-3.6, 5.2, 4.9, 1, 0.5, 0.1, '#8cb4dc');
    b.box(1.4, 5.2, 4.9, 1, 0.5, 0.1, '#8cb4dc');
  }
}

function buildEyes(b: VoxBuilder, cfg: AvatarConfig) {
  if (cfg.glasses === 'sun' || cfg.glasses === 'visor') return b.box(0, 0, 0, 0.01, 0.01, 0.01, '#000');
  const ink = '#2a1a1f';
  const z = 4.5;
  const eye = (x: number, kind: string) => {
    switch (kind) {
      case 'happy':
        b.box(x - 0.9, 4.4, z, 1.8, 0.6, 0.18, ink);
        b.box(x - 1.3, 3.9, z, 0.5, 0.6, 0.18, ink);
        b.box(x + 0.8, 3.9, z, 0.5, 0.6, 0.18, ink);
        break;
      case 'sleepy':
        b.box(x - 1, 3.8, z, 2, 0.5, 0.18, ink);
        break;
      case 'line':
        b.box(x - 0.9, 4.2, z, 1.8, 0.5, 0.18, ink);
        break;
      case 'sparkle':
        b.box(x - 0.6, 3.4, z, 1.3, 2.2, 0.18, ink);
        b.box(x - 0.1, 4.8, z + 0.05, 0.6, 0.6, 0.18, '#ffffff');
        b.box(x - 0.6, 3.2, z, 1.3, 0.4, 0.18, '#5b85b8');
        break;
      default:
        b.box(x - 0.6, 3.4, z, 1.2, 2, 0.18, ink);
        b.box(x - 0.1, 4.7, z + 0.05, 0.5, 0.5, 0.15, '#ffffff');
    }
  };
  eye(-2.4, cfg.eyes === 'wink' ? 'dot' : cfg.eyes);
  eye(2.4, cfg.eyes === 'wink' ? 'line' : cfg.eyes);
}

// ---------------------------------------------------------------- held props

const propCache = new Map<string, THREE.Object3D>();
export function makeHeldProp(kind: string): THREE.Object3D {
  const cached = propCache.get(kind);
  if (cached) return cached.clone();
  let obj: THREE.Object3D;
  if (kind === 'book') {
    obj = part((b) => {
      b.box(-2.5, -1, -0.5, 5, 3.6, 1.2, '#b5463b');
      b.box(-2.3, -0.9, 0.7, 4.6, 3.4, 0.2, '#fbf1dc');
    });
  } else if (kind === 'phone') {
    obj = part((b) => b.box(-1, -1, -0.3, 2, 3, 0.6, '#3a3a44'));
  } else {
    // cup / drink: kind like "cup:#c08a2e:#fbf1dc"
    const [, body = '#fbf1dc', lid = '#8a5234'] = kind.split(':');
    obj = part((b) => {
      b.box(-1.2, -1.5, -1.2, 2.4, 3.2, 2.4, body);
      b.box(-1.3, 1.5, -1.3, 2.6, 0.7, 2.6, lid);
      b.box(-1.25, -0.4, -1.25, 2.5, 1, 2.5, '#c9b28c');
    });
  }
  propCache.set(kind, obj);
  return obj.clone();
}

export function setHeld(rig: AvatarRig, kind: string | null) {
  if (rig.heldKind === kind) return;
  if (rig.heldItem) rig.hand.remove(rig.heldItem);
  rig.heldItem = null;
  rig.heldKind = kind;
  if (kind) {
    rig.heldItem = makeHeldProp(kind);
    rig.hand.add(rig.heldItem);
  }
}

// ---------------------------------------------------------------- animation

export function animateAvatar(rig: AvatarRig, dt: number, speed01: number, t: number) {
  rig.stateT += dt;
  const s = rig.state;
  const walking = s === 'walk';
  rig.phase += dt * (walking ? 10 * Math.max(0.6, speed01) : 0);

  // blink
  rig.blinkT -= dt;
  if (rig.blinkT < 0) {
    rig.eyes.scale.y = 0.15;
    if (rig.blinkT < -0.12) {
      rig.blinkT = 2.5 + Math.random() * 3.5;
      rig.eyes.scale.y = 1;
    }
  }
  rig.eyes.position.y = rig.blinkT < 0 ? 4.4 * V * 0.85 : 0;

  const sitting = s === 'sit' || s === 'type' || s === 'read' || s === 'sitIdle' || s === 'sleep';
  const lerp = (a: number, b: number) => a + (b - a) * Math.min(1, dt * 14);

  let legL = 0, legR = 0, armLx = 0, armRx = 0, armLz = 0, armRz = 0, bodyY = 0, headX = 0, headZ = 0;
  const breathe = Math.sin(t * 2.2 + rig.root.id) * 0.25 * V;

  if (walking) {
    const sw = Math.sin(rig.phase);
    legL = sw * 0.7;
    legR = -sw * 0.7;
    armLx = -sw * 0.6;
    armRx = sw * 0.6;
    bodyY = Math.abs(Math.cos(rig.phase)) * 0.9 * V;
  } else if (sitting) {
    legL = legR = -1.45;
    bodyY = 0.1 + breathe; // sit on chair seat
    armLx = armRx = -0.25;
    if (s === 'type') {
      armLx = -1.15 + Math.sin(t * 18) * 0.08;
      armRx = -1.15 + Math.sin(t * 18 + 2) * 0.08;
      headX = 0.12;
    } else if (s === 'read') {
      armLx = armRx = -1.0;
      armLz = 0.25;
      armRz = -0.25;
      headX = 0.25;
    } else if (s === 'sleep') {
      headX = 0.5;
      headZ = 0.15;
      armLx = armRx = -0.9;
    }
  } else {
    bodyY = breathe;
    armLz = 0.05;
    armRz = -0.05;
    if (s === 'wave') {
      armRx = 0;
      armRz = -2.6 + Math.sin(t * 14) * 0.35;
    }
  }

  // sipping: lift the right hand to the mouth every few seconds when holding a cup
  if (rig.heldKind?.startsWith('cup') && !walking && s !== 'wave' && s !== 'type') {
    const cyc = (t + rig.root.id) % 6;
    if (cyc < 1.4) {
      const k = Math.sin((cyc / 1.4) * Math.PI);
      armRx = -1.9 * k + armRx * (1 - k);
      armRz = 0.35 * k;
    } else if (!sitting) {
      armRx = -0.6;
    }
  } else if (rig.heldKind && walking) {
    armRx = -0.6;
  }

  rig.legL.rotation.x = lerp(rig.legL.rotation.x, legL);
  rig.legR.rotation.x = lerp(rig.legR.rotation.x, legR);
  rig.armL.rotation.x = lerp(rig.armL.rotation.x, armLx);
  rig.armR.rotation.x = lerp(rig.armR.rotation.x, armRx);
  rig.armL.rotation.z = lerp(rig.armL.rotation.z, armLz);
  rig.armR.rotation.z = lerp(rig.armR.rotation.z, armRz);
  rig.head.rotation.x = lerp(rig.head.rotation.x, headX);
  rig.head.rotation.z = lerp(rig.head.rotation.z, headZ);
  rig.body.position.y = lerp(rig.body.position.y, bodyY);
  if (rig.tail) rig.tail.rotation.y = Math.sin(t * (walking ? 9 : 3)) * 0.4;
}

export function disposeAvatar(rig: AvatarRig) {
  rig.root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose();
  });
}
