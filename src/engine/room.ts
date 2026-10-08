import * as THREE from 'three';
import { VoxBuilder, meshFrom, glassMat, toonGradient } from './vox';
import { NavGrid } from './nav';
import { rng, makeCanvas } from './pixel';
import { shade, P } from './palette';
import {
  TPU, canvasTexture, floorTexture, wallTexture, skyTexture, rugTexture, menuBoardTexture,
  whiteboardTexture, screenTexture, posterTexture, pixelText,
} from './textures';
import type { RoomTheme } from './themes';
import { LAYER_NO_OUTLINE } from './pipeline';

export const ROOM_W = 22;
export const ROOM_D = 16;
export const WALL_H = 3.4;

export interface Seat {
  x: number;
  z: number;
  y: number; // seat height offset applied to the avatar root
  facing: number;
  pose: 'type' | 'sitIdle' | 'read';
}

export type InteractKind =
  | 'desk' | 'coffee' | 'vending' | 'cooler' | 'whiteboard' | 'copier' | 'library'
  | 'record' | 'arcade' | 'wardrobe' | 'petbed' | 'door' | 'seat' | 'fireplace' | 'window';

export interface Interactable {
  id: string;
  kind: InteractKind;
  name: string;
  verb: string;
  x: number; // focus point (marker position)
  z: number;
  y: number;
  radius: number;
  approach: { x: number; z: number; facing: number };
  seat?: Seat;
  deskIndex?: number;
}

export interface DeskInfo {
  index: number;
  seat: Seat;
  center: { x: number; z: number };
  screenCanvas: HTMLCanvasElement;
  screenTex: THREE.CanvasTexture;
  decor: THREE.Group;
  topY: number;
  facingSign: 1 | -1; // +1: sitter faces +z
  labelPos: THREE.Vector3;
}

export interface WallInfo {
  group: THREE.Group;
  stub: THREE.Object3D;
  normal: THREE.Vector2;
}

export interface Emitter {
  kind: 'steam' | 'fire';
  x: number;
  y: number;
  z: number;
}

export interface RoomBuild {
  group: THREE.Group;
  nav: NavGrid;
  interactables: Interactable[];
  desks: DeskInfo[];
  walls: WallInfo[];
  emitters: Emitter[];
  animators: ((t: number, dt: number) => void)[];
  lights: { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight; points: THREE.PointLight[] };
  spawn: { x: number; z: number; facing: number };
  barista: { x: number; z: number; facing: number };
  whiteboardTex: { canvas: HTMLCanvasElement; tex: THREE.CanvasTexture };
  windows: { mesh: THREE.Mesh; rain: boolean }[];
  wanderPoints: { x: number; z: number }[];
}

// facing helpers: rotation.y so the avatar's +z points the given way
export const FACE = { S: 0, N: Math.PI, E: Math.PI / 2, W: -Math.PI / 2 };
// VoxBuilder quarter turns that map local +z to world dir
const Q = { S: 0, W: 1, N: 2, E: 3 } as const;

const BOOK_COLORS = ['#b5463b', '#d9734e', '#e2b04a', '#3f7d4a', '#2f6b6b', '#3f5f8f', '#6e4a7a', '#8a2f2f', '#c9b28c', '#2e3a5e', '#f4e4c1', '#5a5a66'];

export function buildRoom(theme: RoomTheme): RoomBuild {
  const group = new THREE.Group();
  const nav = new NavGrid(ROOM_W, ROOM_D);
  const b = new VoxBuilder(); // lit static furniture
  const gb = new VoxBuilder(); // glowing bits
  const interactables: Interactable[] = [];
  const desks: DeskInfo[] = [];
  const emitters: Emitter[] = [];
  const animators: ((t: number, dt: number) => void)[] = [];
  const windows: { mesh: THREE.Mesh; rain: boolean }[] = [];
  const r = rng(7 + theme.id.length * 31);
  const W = theme.wood;
  const night = theme.timeOfDay === 'night';

  const addInteract = (i: Interactable) => interactables.push(i);

  // ------------------------------------------------------------ floor
  const floorTex = canvasTexture(floorTexture(theme, ROOM_W, ROOM_D));
  const floorMat = new THREE.MeshToonMaterial({ map: floorTex, gradientMap: toonGradient() });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(ROOM_W / 2, 0, ROOM_D / 2);
  floor.receiveShadow = true;
  floor.name = 'floor';
  group.add(floor);
  // floor slab edge so the diorama has thickness
  b.box(-0.3, -0.6, -0.3, ROOM_W + 0.6, 0.57, ROOM_D + 0.6, shade(theme.floorColors[0], -0.35));

  // ------------------------------------------------------------ walls
  const walls: WallInfo[] = [];
  const mkWall = (side: 'N' | 'S' | 'W' | 'E') => {
    const g = new THREE.Group();
    const len = side === 'N' || side === 'S' ? ROOM_W : ROOM_D;
    const tex = canvasTexture(wallTexture(theme, len, WALL_H, side.charCodeAt(0)));
    const mat = new THREE.MeshToonMaterial({ map: tex, gradientMap: toonGradient() });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(len, WALL_H), mat);
    plane.receiveShadow = true;
    const t = 0.25;
    const cap = new VoxBuilder();
    const capC = theme.wallColors.trim;
    let normal: THREE.Vector2;
    if (side === 'N') {
      plane.position.set(ROOM_W / 2, WALL_H / 2, 0);
      cap.box(-t, 0, -t, ROOM_W + 2 * t, WALL_H + 0.08, t, shade(capC, -0.2));
      normal = new THREE.Vector2(0, -1);
    } else if (side === 'S') {
      plane.position.set(ROOM_W / 2, WALL_H / 2, ROOM_D);
      plane.rotation.y = Math.PI;
      cap.box(-t, 0, ROOM_D, ROOM_W + 2 * t, WALL_H + 0.08, t, shade(capC, -0.2));
      normal = new THREE.Vector2(0, 1);
    } else if (side === 'W') {
      plane.position.set(0, WALL_H / 2, ROOM_D / 2);
      plane.rotation.y = Math.PI / 2;
      cap.box(-t, 0, 0, t, WALL_H + 0.08, ROOM_D, shade(capC, -0.2));
      normal = new THREE.Vector2(-1, 0);
    } else {
      plane.position.set(ROOM_W, WALL_H / 2, ROOM_D / 2);
      plane.rotation.y = -Math.PI / 2;
      cap.box(ROOM_W, 0, 0, t, WALL_H + 0.08, ROOM_D, shade(capC, -0.2));
      normal = new THREE.Vector2(1, 0);
    }
    g.add(plane);
    const capMesh = meshFrom(cap);
    capMesh.castShadow = false;
    g.add(capMesh);
    // stub shown when the wall is cut away for the camera
    const stubB = new VoxBuilder();
    const sh = 0.32;
    if (side === 'N') stubB.box(-t, 0, -t, ROOM_W + 2 * t, sh, t, theme.wallColors.wainscot);
    if (side === 'S') stubB.box(-t, 0, ROOM_D, ROOM_W + 2 * t, sh, t, theme.wallColors.wainscot);
    if (side === 'W') stubB.box(-t, 0, 0, t, sh, ROOM_D, theme.wallColors.wainscot);
    if (side === 'E') stubB.box(ROOM_W, 0, 0, t, sh, ROOM_D, theme.wallColors.wainscot);
    const stub = meshFrom(stubB);
    stub.visible = false;
    group.add(stub);
    group.add(g);
    walls.push({ group: g, stub, normal });
    return g;
  };
  const wallN = mkWall('N');
  const wallS = mkWall('S');
  const wallW = mkWall('W');
  const wallE = mkWall('E');
  void wallS;

  // per-wall attachment builders (so they hide with their wall)
  const wallBuilders = new Map<THREE.Group, { b: VoxBuilder; gb: VoxBuilder }>();
  const wb = (g: THREE.Group) => {
    let e = wallBuilders.get(g);
    if (!e) { e = { b: new VoxBuilder(), gb: new VoxBuilder() }; wallBuilders.set(g, e); }
    return e;
  };

  const texturedPlane = (
    parent: THREE.Object3D, canvas: HTMLCanvasElement, w: number, h: number,
    pos: [number, number, number], rotY: number, lit = false,
  ) => {
    const tex = canvasTexture(canvas);
    const mat = lit
      ? new THREE.MeshToonMaterial({ map: tex, gradientMap: toonGradient() })
      : new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(...pos);
    m.rotation.y = rotY;
    if (!lit) m.layers.set(LAYER_NO_OUTLINE);
    parent.add(m);
    return { mesh: m, tex };
  };

  // window on a wall: side N uses x range, W uses z range
  const addWindow = (wall: THREE.Group, side: 'N' | 'W' | 'E', a0: number, a1: number, y0 = 1.0, y1 = 2.6) => {
    const { b: wbb } = wb(wall);
    const w = a1 - a0, h = y1 - y0;
    const sky = skyTexture(theme.sky, Math.round(w * TPU), Math.round(h * TPU), Math.round(a0 * 10));
    const frame = theme.wall === 'shoji' ? W.dark : theme.wall === 'neon' ? '#2e2a44' : theme.wallColors.trim;
    let pos: [number, number, number], rot = 0;
    if (side === 'N') {
      pos = [a0 + w / 2, y0 + h / 2, 0.02];
      wbb.box(a0 - 0.08, y0 - 0.08, 0, w + 0.16, 0.1, 0.1, frame);
      wbb.box(a0 - 0.08, y1 - 0.02, 0, w + 0.16, 0.1, 0.1, frame);
      wbb.box(a0 - 0.08, y0, 0, 0.1, h, 0.1, frame);
      wbb.box(a1 - 0.02, y0, 0, 0.1, h, 0.1, frame);
      wbb.box(a0 + w / 2 - 0.04, y0, 0, 0.08, h, 0.08, frame);
      wbb.box(a0 - 0.15, y0 - 0.16, 0, w + 0.3, 0.08, 0.22, shade(frame, 0.1)); // sill
      // curtains
      if (theme.wall !== 'glass' && theme.wall !== 'shoji') {
        wbb.box(a0 - 0.32, y0 - 0.2, 0.02, 0.26, h + 0.45, 0.1, theme.fabric);
        wbb.box(a1 + 0.06, y0 - 0.2, 0.02, 0.26, h + 0.45, 0.1, theme.fabric);
        wbb.box(a0 - 0.4, y1 + 0.2, 0.02, w + 0.8, 0.08, 0.12, W.dark);
      }
    } else {
      const xw = side === 'W' ? 0.02 : ROOM_W - 0.02;
      rot = side === 'W' ? Math.PI / 2 : -Math.PI / 2;
      pos = [xw, y0 + h / 2, a0 + w / 2];
      const x0 = side === 'W' ? 0 : ROOM_W - 0.1;
      wbb.box(x0, y0 - 0.08, a0 - 0.08, 0.1, 0.1, w + 0.16, frame);
      wbb.box(x0, y1 - 0.02, a0 - 0.08, 0.1, 0.1, w + 0.16, frame);
      wbb.box(x0, y0, a0 - 0.08, 0.1, h, 0.1, frame);
      wbb.box(x0, y0, a1 - 0.02, 0.1, h, 0.1, frame);
      wbb.box(x0, y0, a0 + w / 2 - 0.04, 0.08, h, 0.08, frame);
      const sx = side === 'W' ? 0 : ROOM_W - 0.22;
      wbb.box(sx, y0 - 0.16, a0 - 0.15, 0.22, 0.08, w + 0.3, shade(frame, 0.1));
      if (theme.wall !== 'glass' && theme.wall !== 'shoji') {
        const cx = side === 'W' ? 0.02 : ROOM_W - 0.12;
        wbb.box(cx, y0 - 0.2, a0 - 0.32, 0.1, h + 0.45, 0.26, theme.fabric);
        wbb.box(cx, y0 - 0.2, a1 + 0.06, 0.1, h + 0.45, 0.26, theme.fabric);
      }
    }
    const { mesh } = texturedPlane(wall, sky, w, h, pos, rot);
    windows.push({ mesh, rain: theme.timeOfDay === 'rainy' });
  };

  // ------------------------------------------------------------ furniture primitives
  const plant = (x: number, z: number, kind: 'monstera' | 'ficus' | 'snake' | 'fern' | 'bonsai' = 'monstera', scale = 1) => {
    const pot = theme.id === 'tea_loft' ? '#3a3a44' : theme.id === 'arcade' ? '#2e2a44' : '#b5523b';
    const s = scale;
    b.cbox(x, 0, z, 0.42 * s, 0.38 * s, 0.42 * s, pot, { ao: 0.2 });
    b.cbox(x, 0.38 * s, z, 0.48 * s, 0.07 * s, 0.48 * s, shade(pot, 0.12));
    b.cbox(x, 0.4 * s, z, 0.38 * s, 0.04, 0.38 * s, '#4a3020');
    const L = [P.leaf1, P.leaf2, P.leaf3, P.leaf4];
    if (kind === 'snake') {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        b.cbox(x + Math.cos(a) * 0.1 * s, 0.42 * s, z + Math.sin(a) * 0.1 * s, 0.07 * s, (0.5 + (i % 3) * 0.2) * s, 0.04 * s, i % 2 ? L[1] : L[3]);
      }
    } else if (kind === 'bonsai') {
      b.cbox(x, 0.42 * s, z, 0.06 * s, 0.3 * s, 0.06 * s, W.dark);
      b.cbox(x - 0.08 * s, 0.62 * s, z, 0.34 * s, 0.14 * s, 0.26 * s, L[1]);
      b.cbox(x + 0.1 * s, 0.7 * s, z + 0.04, 0.22 * s, 0.12 * s, 0.2 * s, L[2]);
    } else {
      const tall = kind === 'monstera' ? 1.0 : kind === 'ficus' ? 1.3 : 0.6;
      b.cbox(x, 0.42 * s, z, 0.06 * s, tall * 0.6 * s, 0.06 * s, W.dark);
      const n = kind === 'fern' ? 7 : 9;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r();
        const rad = (kind === 'ficus' ? 0.18 : 0.26) * s;
        const y = (0.42 + tall * (0.35 + r() * 0.6)) * s;
        const lw = (kind === 'monstera' ? 0.3 : 0.2) * s;
        b.cbox(x + Math.cos(a) * rad, y, z + Math.sin(a) * rad, lw, 0.12 * s, lw, L[Math.floor(r() * 4)]);
      }
      if (kind === 'ficus') b.cbox(x, (0.42 + tall) * s, z, 0.34 * s, 0.24 * s, 0.34 * s, L[2]);
    }
    nav.block(x - 0.25 * s, z - 0.25 * s, x + 0.25 * s, z + 0.25 * s);
  };

  const lampShade = (x: number, y: number, z: number, w = 0.32, col = theme.lamp) => {
    gb.cbox(x, y, z, w, 0.2, w, col);
    gb.cbox(x, y - 0.02, z, w * 0.6, 0.02, w * 0.6, '#fff6d8');
  };

  const floorLamp = (x: number, z: number) => {
    b.cbox(x, 0, z, 0.3, 0.05, 0.3, W.dark);
    b.cbox(x, 0.05, z, 0.05, 1.45, 0.05, W.dark);
    lampShade(x, 1.45, z, 0.38);
    nav.block(x - 0.15, z - 0.15, x + 0.15, z + 0.15);
  };

  const pendant = (x: number, z: number, y = 2.35) => {
    b.cbox(x, y + 0.2, z, 0.02, WALL_H - y - 0.2, 0.02, '#2a1a1f');
    b.cbox(x, y + 0.12, z, 0.32, 0.1, 0.32, theme.id === 'arcade' ? '#2e2a44' : P.brass1);
    gb.cbox(x, y, z, 0.24, 0.12, 0.24, theme.lamp);
  };

  const chair = (x: number, z: number, q: number, seatCol: string, frameCol = W.dark) => {
    b.push(x, 0, z, q);
    for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) b.cbox(lx, 0, lz, 0.05, 0.42, 0.05, frameCol);
    b.cbox(0, 0.42, 0, 0.46, 0.06, 0.46, seatCol);
    b.cbox(0, 0.42, -0.21, 0.42, 0.5, 0.05, frameCol);
    b.cbox(0, 0.72, -0.22, 0.36, 0.14, 0.06, seatCol);
    b.pop();
  };

  const officeChair = (x: number, z: number, q: number) => {
    b.push(x, 0, z, q);
    b.cbox(0, 0, 0, 0.5, 0.04, 0.08, '#2a2a30');
    b.cbox(0, 0, 0, 0.08, 0.04, 0.5, '#2a2a30');
    b.cbox(0, 0.04, 0, 0.06, 0.36, 0.06, '#5a5a66');
    b.cbox(0, 0.4, 0.02, 0.5, 0.08, 0.48, theme.fabric);
    b.cbox(0, 0.48, -0.24, 0.46, 0.55, 0.08, theme.fabric);
    b.cbox(0, 0.62, -0.285, 0.36, 0.3, 0.02, shade(theme.fabric, -0.2));
    b.pop();
  };

  const roundTable = (x: number, z: number, h = 0.74, rad = 0.42, top = W.mid) => {
    b.cbox(x, 0, z, 0.36, 0.05, 0.36, W.dark);
    b.cbox(x, 0.05, z, 0.07, h - 0.1, 0.07, W.dark);
    b.cbox(x, h - 0.05, z, rad * 2, 0.06, rad * 1.3, top);
    b.cbox(x, h - 0.05, z, rad * 1.3, 0.06, rad * 2, top);
    b.cbox(x, h - 0.05, z, rad * 1.7, 0.061, rad * 1.7, top);
    nav.block(x - rad, z - rad, x + rad, z + rad);
  };

  const cup = (x: number, y: number, z: number, col = '#fbf1dc', steam = false) => {
    b.cbox(x, y, z, 0.09, 0.1, 0.09, col);
    b.cbox(x + 0.06, y + 0.03, z, 0.03, 0.05, 0.03, col);
    b.cbox(x, y + 0.08, z, 0.07, 0.015, 0.07, '#6b3c28');
    if (steam) emitters.push({ kind: 'steam', x, y: y + 0.12, z });
  };

  const armchair = (x: number, z: number, q: number, col = theme.fabric) => {
    b.push(x, 0, z, q);
    b.cbox(0, 0, 0, 0.9, 0.12, 0.82, W.dark);
    b.cbox(0, 0.12, 0.04, 0.86, 0.3, 0.76, col, { ao: 0.15 });
    b.cbox(0, 0.42, 0.08, 0.58, 0.1, 0.6, shade(col, 0.12));
    b.cbox(0, 0.42, -0.32, 0.86, 0.5, 0.2, col);
    b.cbox(-0.36, 0.42, 0.04, 0.16, 0.22, 0.76, shade(col, -0.08));
    b.cbox(0.36, 0.42, 0.04, 0.16, 0.22, 0.76, shade(col, -0.08));
    b.pop();
    nav.block(x - 0.42, z - 0.42, x + 0.42, z + 0.42);
  };

  const seatInteract = (id: string, name: string, x: number, z: number, facing: number, pose: Seat['pose'] = 'sitIdle', y = 0.08) => {
    addInteract({
      id, kind: 'seat', name, verb: 'Sit', x, z, y: 0.9, radius: 0.9,
      approach: { x, z, facing }, seat: { x, z, y, facing, pose },
    });
  };

  // ------------------------------------------------------------ COFFEE AREA (north-west)
  {
    const counterTop = theme.id === 'arcade' ? '#2e2a44' : theme.id === 'tech_hub' ? '#f4efe4' : '#e6dcc8';
    // back counter along north wall
    b.box(0, 0, 0, 5.4, 0.92, 0.75, W.mid, { ao: 0.2 });
    b.box(0, 0.92, 0, 5.4, 0.06, 0.8, counterTop);
    for (let i = 0; i < 5; i++) b.box(0.15 + i * 1.05, 0.12, 0.751, 0.95, 0.66, 0.02, shade(W.mid, -0.12));
    // espresso machine
    b.box(0.6, 0.98, 0.08, 1.2, 0.55, 0.55, '#c9ccd2', { ao: 0.1 });
    b.box(0.6, 1.53, 0.08, 1.2, 0.06, 0.55, P.brass2);
    b.box(0.75, 1.0, 0.63, 0.9, 0.2, 0.08, '#5a5a66');
    for (const gx of [0.85, 1.35]) {
      b.box(gx, 1.22, 0.62, 0.14, 0.1, 0.16, '#3a3a44');
      b.box(gx + 0.03, 1.06, 0.66, 0.08, 0.16, 0.08, '#2a2a30');
    }
    gb.box(1.65, 1.38, 0.635, 0.06, 0.06, 0.02, '#9cff8a');
    for (let i = 0; i < 4; i++) cup(0.75 + i * 0.25, 1.59, 0.3, i % 2 ? '#fbf1dc' : '#d9734e');
    emitters.push({ kind: 'steam', x: 1.1, y: 1.65, z: 0.35 });
    // grinder + bean jars
    b.box(2.1, 0.98, 0.15, 0.35, 0.45, 0.35, '#3a3a44');
    b.box(2.15, 1.43, 0.2, 0.25, 0.22, 0.25, '#8a5234');
    for (let i = 0; i < 4; i++) {
      b.box(2.7 + i * 0.3, 0.98, 0.25, 0.2, 0.28, 0.2, '#e8f0f0');
      b.box(2.72 + i * 0.3, 0.98, 0.27, 0.16, 0.18, 0.16, ['#6b3c28', '#3e2418', '#94603c', '#4a2a1e'][i]);
    }
    // cups stack + syrups
    for (let i = 0; i < 3; i++) b.box(4.0, 0.98 + i * 0.1, 0.25, 0.14, 0.1, 0.14, '#fbf1dc');
    for (let i = 0; i < 4; i++) b.box(4.4 + i * 0.18, 0.98, 0.2, 0.1, 0.32, 0.1, ['#b5463b', '#e2b04a', '#62a356', '#6e4a7a'][i]);
    nav.block(0, 0, 5.4, 0.8);

    // front bar counter
    b.box(0, 0, 2.2, 4.7, 1.0, 0.75, W.dark, { ao: 0.2 });
    b.box(-0.05, 1.0, 2.15, 4.8, 0.07, 0.85, counterTop);
    for (let i = 0; i < 9; i++) b.box(0.1 + i * 0.5, 0.1, 2.951, 0.36, 0.8, 0.02, shade(W.dark, 0.12));
    b.box(4.7, 0, 0.8, 0.7, 1.0, 2.15, W.dark); // return to wall, leaving a gap for the barista
    b.box(4.65, 1.0, 0.8, 0.8, 0.07, 2.2, counterTop);
    nav.block(0, 2.2, 4.75, 2.95);
    nav.block(4.7, 1.6, 5.4, 2.95);
    // pastry case
    b.box(2.3, 1.07, 2.3, 1.6, 0.08, 0.55, W.mid);
    const pastry = ['#e2b04a', '#d9734e', '#f0a8a8', '#c98b5a', '#9cc96a', '#fbf1dc'];
    for (let i = 0; i < 6; i++) b.box(2.4 + (i % 3) * 0.5, 1.15 + Math.floor(i / 3) * 0.2, 2.42, 0.32, 0.1, 0.25, pastry[i]);
    b.box(2.3, 1.35, 2.3, 1.6, 0.03, 0.55, '#e8f0f0');
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.42, 0.55), glassMat());
    glass.position.set(3.1, 1.36, 2.575);
    glass.layers.set(LAYER_NO_OUTLINE);
    group.add(glass);
    // register + tip jar
    b.box(0.5, 1.07, 2.35, 0.45, 0.18, 0.4, '#3a3a44');
    b.box(0.55, 1.25, 2.5, 0.35, 0.22, 0.05, '#2a2a30');
    gb.box(0.58, 1.28, 2.56, 0.29, 0.16, 0.01, '#8fe3c4');
    b.box(1.4, 1.07, 2.5, 0.18, 0.22, 0.18, '#d8eef0');
    b.box(1.42, 1.07, 2.52, 0.14, 0.08, 0.14, '#62a356');
    // stools
    for (const sx of [1.0, 2.2, 3.4]) {
      b.cbox(sx, 0, 3.45, 0.06, 0.62, 0.06, P.brass1);
      b.cbox(sx, 0, 3.45, 0.3, 0.03, 0.3, P.brass0);
      b.cbox(sx, 0.62, 3.45, 0.38, 0.08, 0.38, theme.fabric);
    }
    // menu board on the wall
    const { b: nb } = wb(wallN);
    nb.box(0.8, 1.9, 0, 3.9, 1.2, 0.06, W.dark);
    texturedPlane(wallN, menuBoardTexture(), 3.7, 1.0, [2.75, 2.5, 0.07], 0);
    pendant(1.4, 2.6);
    pendant(3.4, 2.6);
    addInteract({
      id: 'coffee', kind: 'coffee', name: 'Espresso Bar', verb: 'Order a drink', x: 2.4, z: 2.6, y: 1.9, radius: 1.6,
      approach: { x: 2.6, z: 3.85, facing: FACE.N },
    });
  }

  // ------------------------------------------------------------ VENDING MACHINE + WATER COOLER
  {
    const body = theme.id === 'arcade' ? '#ff3fb4' : theme.id === 'tea_loft' ? '#3f5f8f' : '#b5463b';
    const vx = 6.0;
    b.box(vx, 0, 0.02, 1.3, 2.05, 0.85, body, { ao: 0.15 });
    b.box(vx + 0.1, 0.25, 0.87, 0.82, 1.5, 0.02, '#1d2440');
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 4; col++) {
        const c = ['#e2b04a', '#62a356', '#5b85b8', '#f0a8a8', '#d9734e', '#fbf1dc'][(row * 4 + col) % 6];
        b.box(vx + 0.16 + col * 0.19, 0.42 + row * 0.27, 0.8, 0.13, 0.17, 0.07, c);
      }
      b.box(vx + 0.12, 0.38 + row * 0.27, 0.86, 0.78, 0.03, 0.02, '#8a8a94');
    }
    const vglass = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.5), glassMat());
    vglass.position.set(vx + 0.51, 1.0, 0.9);
    vglass.layers.set(LAYER_NO_OUTLINE);
    group.add(vglass);
    b.box(vx + 0.98, 0.9, 0.87, 0.26, 0.6, 0.03, shade(body, -0.25));
    for (let k = 0; k < 6; k++) b.box(vx + 1.02 + (k % 2) * 0.1, 1.05 + Math.floor(k / 2) * 0.12, 0.9, 0.07, 0.07, 0.02, '#e2e2e2');
    b.box(vx + 0.15, 0.06, 0.87, 0.75, 0.14, 0.03, '#2a2a30');
    gb.box(vx + 0.08, 1.8, 0.871, 1.14, 0.18, 0.02, theme.id === 'arcade' ? '#00e5ff' : '#ffe9a0');
    nav.block(vx, 0, vx + 1.3, 0.9);
    addInteract({
      id: 'vending', kind: 'vending', name: 'Vending Machine', verb: 'Grab a snack', x: vx + 0.65, z: 0.9, y: 2.4, radius: 1.3,
      approach: { x: vx + 0.6, z: 1.65, facing: FACE.N },
    });

    // water cooler
    const cx = 7.95;
    b.box(cx, 0, 0.12, 0.55, 0.95, 0.5, '#e2e2e2', { ao: 0.15 });
    b.box(cx + 0.05, 0.6, 0.62, 0.45, 0.04, 0.06, '#8a8a94');
    b.box(cx + 0.12, 0.7, 0.62, 0.08, 0.08, 0.06, '#5b85b8');
    b.box(cx + 0.34, 0.7, 0.62, 0.08, 0.08, 0.06, '#b5463b');
    gb.box(cx + 0.1, 0.95, 0.17, 0.35, 0.5, 0.4, '#7cc0e8');
    gb.box(cx + 0.17, 1.45, 0.24, 0.21, 0.08, 0.26, '#a8d8f0');
    b.box(cx + 0.58, 0.55, 0.25, 0.12, 0.35, 0.12, '#fbf1dc');
    nav.block(cx, 0, cx + 0.72, 0.65);
    addInteract({
      id: 'cooler', kind: 'cooler', name: 'Water Cooler', verb: 'Hydrate & chat', x: cx + 0.28, z: 0.4, y: 1.9, radius: 1.2,
      approach: { x: cx + 0.3, z: 1.35, facing: FACE.N },
    });
  }

  // ------------------------------------------------------------ WHITEBOARD (north wall)
  let whiteboardCanvas: HTMLCanvasElement;
  let whiteboardTexture3: THREE.CanvasTexture;
  {
    const { b: nb } = wb(wallN);
    nb.box(9.35, 0.92, 0, 3.7, 1.58, 0.07, '#b8b8be');
    nb.box(9.45, 0.9, 0.07, 3.5, 0.06, 0.14, '#8a8a94');
    nb.box(9.7, 0.96, 0.12, 0.18, 0.04, 0.04, '#b5463b');
    nb.box(9.95, 0.96, 0.12, 0.18, 0.04, 0.04, '#3f5f8f');
    nb.box(10.2, 0.96, 0.12, 0.18, 0.04, 0.04, '#3f7d4a');
    whiteboardCanvas = whiteboardTexture([
      { title: 'TODO', cards: ['a', 'b', 'c'] }, { title: 'DOING', cards: ['a', 'b'] }, { title: 'DONE', cards: ['a', 'b', 'c', 'd'] },
    ]);
    const { tex } = texturedPlane(wallN, whiteboardCanvas, 3.5, 1.4, [11.2, 1.72, 0.075], 0, true);
    whiteboardTexture3 = tex;
    addInteract({
      id: 'whiteboard', kind: 'whiteboard', name: 'Sprint Whiteboard', verb: 'Plan the sprint', x: 11.2, z: 0.3, y: 2.8, radius: 1.6,
      approach: { x: 11.2, z: 1.3, facing: FACE.N },
    });
  }

  // ------------------------------------------------------------ north window + posters
  addWindow(wallN, 'N', 13.5, 15.3);
  {
    const { b: nb } = wb(wallN);
    nb.box(7.9, 1.75, 0, 0.62, 0.84, 0.04, W.dark);
    texturedPlane(wallN, posterTexture(theme.id === 'arcade' ? 3 : 1), 0.5, 0.7, [8.21, 2.17, 0.045], 0, true);
    // wall clock
    nb.box(12.9, 2.75, 0, 0.42, 0.42, 0.06, W.dark);
    nb.box(12.94, 2.79, 0.06, 0.34, 0.34, 0.02, '#fbf1dc');
    nb.box(13.1, 2.95, 0.08, 0.02, 0.12, 0.01, '#2a1a1f');
    nb.box(13.1, 2.95, 0.08, 0.1, 0.02, 0.01, '#2a1a1f');
  }

  // ------------------------------------------------------------ LIBRARY (north-east)
  {
    const shelfX = [15.75, 17.8, 19.85];
    for (const sx of shelfX) {
      const w = 1.95, d = 0.55, h = 2.7;
      b.box(sx, 0, 0.02, w, h, 0.06, W.dark);
      b.box(sx, 0, 0.02, 0.07, h, d, W.mid);
      b.box(sx + w - 0.07, 0, 0.02, 0.07, h, d, W.mid);
      b.box(sx, h - 0.06, 0.02, w, 0.08, d + 0.04, W.mid);
      for (let s = 0; s < 5; s++) {
        const y = 0.08 + s * 0.52;
        b.box(sx, y, 0.02, w, 0.05, d, W.mid);
        let bx = sx + 0.1;
        while (bx < sx + w - 0.2) {
          if (r() < 0.07) { // ornament
            if (r() < 0.5) plantMini(bx + 0.1, y + 0.05, 0.3);
            else b.box(bx, y + 0.05, 0.25, 0.18, 0.18, 0.18, ['#e2b04a', '#8cb4dc', '#f0a8a8'][Math.floor(r() * 3)]);
            bx += 0.26;
            continue;
          }
          const bw = 0.05 + r() * 0.07, bh = 0.24 + r() * 0.16;
          const col = BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)];
          b.box(bx, y + 0.05, 0.1 + r() * 0.06, bw, bh, 0.36, col);
          if (r() < 0.4) b.box(bx, y + 0.05 + bh * 0.7, 0.465, bw, 0.03, 0.01, P.brass2);
          bx += bw + 0.008;
        }
      }
      nav.block(sx, 0, sx + w, 0.62);
    }
    // ladder
    b.box(18.0, 0, 0.62, 0.06, 2.4, 0.06, W.light);
    b.box(18.5, 0, 0.62, 0.06, 2.4, 0.06, W.light);
    for (let i = 0; i < 6; i++) b.box(18.0, 0.3 + i * 0.38, 0.62, 0.56, 0.04, 0.05, W.light);
    // reading nook
    const rugT = canvasTexture(rugTexture(theme.rug, 5, 3.6, true));
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.6), new THREE.MeshToonMaterial({ map: rugT, transparent: true, alphaTest: 0.5, gradientMap: toonGradient() }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(18.8, 0.012, 3.4);
    rug.receiveShadow = true;
    group.add(rug);
    armchair(16.9, 3.6, Q.E, theme.fabric);
    armchair(20.7, 3.6, Q.W, theme.fabric2);
    seatInteract('armchair-1', 'Reading armchair', 16.95, 3.6, FACE.E, 'read', 0.05);
    seatInteract('armchair-2', 'Reading armchair', 20.65, 3.6, FACE.W, 'read', 0.05);
    // side table + lamp + books
    b.cbox(18.8, 0, 3.3, 0.6, 0.5, 0.6, W.mid);
    b.cbox(18.8, 0.5, 3.3, 0.66, 0.05, 0.66, W.light);
    b.cbox(18.65, 0.55, 3.2, 0.32, 0.08, 0.24, '#3f5f8f');
    b.cbox(18.67, 0.63, 3.2, 0.28, 0.06, 0.22, '#e2b04a');
    cup(19.0, 0.55, 3.45, '#fbf1dc', true);
    nav.block(18.5, 3.0, 19.1, 3.6);
    floorLamp(21.45, 1.35);
    addInteract({
      id: 'library', kind: 'library', name: 'Library', verb: 'Browse books', x: 18.8, z: 0.4, y: 3.0, radius: 1.8,
      approach: { x: 18.8, z: 1.25, facing: FACE.N },
    });
  }

  function plantMini(x: number, y: number, z: number) {
    b.cbox(x, y, z, 0.12, 0.1, 0.12, '#b5523b');
    b.cbox(x, y + 0.1, z, 0.18, 0.12, 0.18, P.leaf3);
  }

  // ------------------------------------------------------------ DESKS (8, two back-to-back rows)
  {
    const deskW = 2.2, deskD = 0.9, topY = 0.76;
    const startX = 5.9;
    const spineZ = 8.15;
    const deskTop = theme.id === 'arcade' ? '#2e2a44' : W.light;
    // spine divider
    b.box(startX - 0.05, 0, spineZ - 0.05, deskW * 4 + 0.1 + 0.3, 1.28, 0.1, theme.wallColors.wainscot);
    b.box(startX - 0.08, 1.28, spineZ - 0.07, deskW * 4 + 0.46, 0.05, 0.14, W.dark);
    for (let i = 0; i < 8; i++) {
      const row = i < 4 ? 0 : 1;
      const col = i % 4;
      const x0 = startX + col * (deskW + 0.1);
      const z0 = row === 0 ? spineZ - 0.05 - deskD : spineZ + 0.05;
      const cx = x0 + deskW / 2;
      // desk body
      b.box(x0, topY - 0.06, z0, deskW, 0.06, deskD, deskTop);
      b.box(x0 + 0.05, 0, z0 + 0.05, 0.06, topY - 0.06, deskD - 0.1, W.dark);
      b.box(x0 + deskW - 0.11, 0, z0 + 0.05, 0.06, topY - 0.06, deskD - 0.1, W.dark);
      b.box(x0 + deskW - 0.6, 0, z0 + 0.1, 0.5, topY - 0.08, deskD - 0.2, W.mid); // drawer unit
      b.box(x0 + deskW - 0.56, 0.45, row === 0 ? z0 + 0.09 : z0 + deskD - 0.11, 0.42, 0.02, 0.02, P.brass2);
      // privacy side panel
      if (col === 0 || true) b.box(x0 - 0.06, 0, z0, 0.05, 1.12, deskD, shade(theme.wallColors.wainscot, 0.15));
      if (col === 3) b.box(x0 + deskW + 0.01, 0, z0, 0.05, 1.12, deskD, shade(theme.wallColors.wainscot, 0.15));
      nav.block(x0 - 0.06, z0, x0 + deskW + 0.06, z0 + deskD);

      // monitor (chunky CRT-era display)
      const towardSpine = row === 0 ? 1 : -1; // monitor sits by the spine
      const mz = row === 0 ? z0 + deskD - 0.38 : z0 + 0.38;
      b.cbox(cx, topY, mz, 0.28, 0.04, 0.2, '#3a3a44');
      b.cbox(cx, topY + 0.04, mz, 0.06, 0.14, 0.06, '#3a3a44');
      const monW = 0.78, monH = 0.56;
      b.cbox(cx, topY + 0.16, mz, monW, monH, 0.24, theme.id === 'arcade' ? '#2e2a44' : '#e6dcc8');
      b.cbox(cx, topY + 0.2, mz - towardSpine * 0.08, monW - 0.2, monH - 0.12, 0.2, theme.id === 'arcade' ? '#24203a' : '#d0c4ac');
      const screenCanvas = screenTexture(i === 0 ? 'code' : 'idle', i);
      const screenTex = canvasTexture(screenCanvas);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(monW - 0.12, monH - 0.12), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
      const sz = mz - towardSpine * 0.121;
      screen.position.set(cx, topY + 0.16 + monH / 2, sz);
      screen.rotation.y = towardSpine === 1 ? Math.PI : 0;
      screen.layers.set(LAYER_NO_OUTLINE);
      group.add(screen);
      // keyboard + mouse
      const kz = row === 0 ? z0 + 0.2 : z0 + deskD - 0.2;
      b.cbox(cx, topY, kz, 0.5, 0.03, 0.16, '#e2e2e2');
      b.cbox(cx, topY + 0.03, kz, 0.46, 0.012, 0.12, '#b8b8be');
      b.cbox(cx + 0.4, topY, kz, 0.07, 0.03, 0.1, '#e2e2e2');

      // chair + seat
      const chairZ = row === 0 ? z0 - 0.5 : z0 + deskD + 0.5;
      const facing = row === 0 ? FACE.S : FACE.N;
      officeChair(cx, chairZ, row === 0 ? Q.S : Q.N);
      const decor = new THREE.Group();
      group.add(decor);
      const seat: Seat = { x: cx, z: chairZ + (row === 0 ? 0.05 : -0.05), y: 0.1, facing, pose: 'type' };
      desks.push({
        index: i, seat, center: { x: cx, z: z0 + deskD / 2 }, screenCanvas, screenTex, decor, topY,
        facingSign: row === 0 ? 1 : -1,
        labelPos: new THREE.Vector3(cx, 2.2, chairZ),
      });
      addInteract({
        id: `desk-${i}`, kind: 'desk', name: `Desk ${i + 1}`, verb: 'Sit down', x: cx, z: z0 + deskD / 2, y: 1.9, radius: 1.1,
        approach: { x: seat.x, z: seat.z, facing }, seat, deskIndex: i,
      });
    }
    // desk pendants
    pendant(8.2, 8.15, 2.5);
    pendant(12.8, 8.15, 2.5);
  }

  // ------------------------------------------------------------ WEST WALL: copier, window, door
  {
    // copier
    const cz = 5.4;
    b.box(0.05, 0, cz, 0.9, 0.95, 0.95, '#d8d8dc', { ao: 0.18 });
    b.box(0.0, 0.95, cz - 0.02, 0.95, 0.12, 1.0, '#b8b8be');
    b.box(0.92, 0.75, cz + 0.15, 0.12, 0.03, 0.65, '#8a8a94');
    b.box(0.94, 0.78, cz + 0.2, 0.08, 0.05, 0.55, '#fbf1dc');
    b.box(0.3, 1.07, cz + 0.1, 0.45, 0.05, 0.3, '#5a5a66');
    gb.box(0.45, 1.12, cz + 0.15, 0.2, 0.01, 0.16, '#8fe3c4');
    gb.box(0.8, 1.08, cz + 0.75, 0.05, 0.02, 0.05, '#9cff8a');
    b.box(0.1, 0.1, cz + 0.96, 0.8, 0.25, 0.01, '#8a8a94');
    b.box(0.1, 0.45, cz + 0.96, 0.8, 0.25, 0.01, '#8a8a94');
    // paper boxes
    b.box(0.1, 0, cz + 1.05, 0.5, 0.3, 0.4, '#e6cf9f');
    b.box(0.12, 0.3, cz + 1.08, 0.45, 0.25, 0.35, '#c9b28c');
    nav.block(0, cz, 1.05, cz + 1.45);
    addInteract({
      id: 'copier', kind: 'copier', name: 'Copier', verb: 'Print something', x: 0.5, z: cz + 0.5, y: 1.9, radius: 1.3,
      approach: { x: 1.55, z: cz + 0.5, facing: FACE.W },
    });

    addWindow(wallW, 'W', 7.4, 9.6);
    addWindow(wallW, 'W', 2.0, 3.6, 1.15, 2.55);

    // door
    const { b: wbW, gb: wgW } = wb(wallW);
    wbW.box(0, 0, 12.85, 0.12, 2.35, 0.12, W.dark);
    wbW.box(0, 0, 14.45, 0.12, 2.35, 0.12, W.dark);
    wbW.box(0, 2.3, 12.85, 0.12, 0.12, 1.72, W.dark);
    wbW.box(0, 0, 12.97, 0.07, 2.3, 1.48, theme.id === 'arcade' ? '#2e2a44' : W.mid);
    wbW.box(0.05, 1.2, 13.15, 0.04, 0.9, 1.1, shade(W.mid, 0.1));
    wbW.box(0.05, 0.2, 13.15, 0.04, 0.8, 1.1, shade(W.mid, 0.1));
    wbW.box(0.07, 1.0, 14.2, 0.06, 0.08, 0.12, P.brass2);
    wgW.box(0.06, 1.35, 13.3, 0.02, 0.6, 0.8, '#ffe9b0');
    // door sign
    const [sc, sctx] = makeCanvas(24, 8);
    sctx.fillStyle = '#2a1a1f'; sctx.fillRect(0, 0, 24, 8);
    pixelText(sctx, theme.door.replace('Door ', ''), 3, 2, '#f7d97a');
    texturedPlane(wallW, sc, 0.6, 0.2, [0.02, 2.55, 13.7], Math.PI / 2);
    // doormat
    b.box(0.15, 0, 13.0, 1.0, 0.02, 1.4, '#8a5234');
    b.box(0.25, 0.005, 13.1, 0.8, 0.02, 1.2, '#a8714d');
    addInteract({
      id: 'door', kind: 'door', name: theme.door, verb: 'Leave room (lobby)', x: 0.3, z: 13.7, y: 2.8, radius: 1.2,
      approach: { x: 1.0, z: 13.7, facing: FACE.W },
    });
    // coat rack
    b.cbox(0.55, 0, 11.8, 0.3, 0.04, 0.3, W.dark);
    b.cbox(0.55, 0, 11.8, 0.05, 1.7, 0.05, W.dark);
    b.cbox(0.4, 1.3, 11.8, 0.18, 0.4, 0.14, theme.fabric2);
    b.cbox(0.7, 1.35, 11.8, 0.16, 0.32, 0.14, '#5a5a66');
    nav.block(0.35, 11.6, 0.75, 12.0);
    plant(0.55, 10.6, 'snake');
    plant(0.55, 4.6, 'ficus', 0.9);
  }

  // ------------------------------------------------------------ CAFÉ TABLES (south-west)
  {
    const tables: [number, number][] = [[4.0, 12.4], [7.6, 13.9], [4.2, 15.0], [10.8, 12.6]];
    tables.forEach(([tx, tz], i) => {
      roundTable(tx, tz, 0.74, 0.4, i % 2 ? W.light : W.mid);
      chair(tx - 0.75, tz, Q.E, theme.fabric);
      chair(tx + 0.75, tz, Q.W, theme.fabric);
      seatInteract(`cafe-${i}-a`, 'Café seat', tx - 0.72, tz, FACE.E, 'sitIdle', 0.06);
      seatInteract(`cafe-${i}-b`, 'Café seat', tx + 0.72, tz, FACE.W, 'sitIdle', 0.06);
      if (i % 2 === 0) cup(tx + 0.12, 0.75, tz - 0.05, '#fbf1dc', true);
      else { b.cbox(tx, 0.75, tz, 0.1, 0.12, 0.1, '#d8eef0'); b.cbox(tx, 0.87, tz, 0.08, 0.08, 0.08, P.pink2); }
    });
    plant(2.2, 15.4, 'monstera', 1.1);
    plant(12.6, 15.3, 'fern');
    floorLamp(6.2, 15.5);
  }

  // ------------------------------------------------------------ LOUNGE (south-east)
  {
    const rugT = canvasTexture(rugTexture([theme.rug[2], theme.rug[1], theme.rug[0]], 5.8, 4.0));
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 4.0), new THREE.MeshToonMaterial({ map: rugT, gradientMap: toonGradient() }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(17.6, 0.012, 13.4);
    rug.receiveShadow = true;
    group.add(rug);
    // sofa against the south wall
    const sx = 15.6, sz = 15.05;
    b.box(sx, 0, sz, 3.0, 0.14, 0.85, W.dark);
    b.box(sx, 0.14, sz, 3.0, 0.3, 0.85, theme.fabric, { ao: 0.15 });
    for (let k = 0; k < 3; k++) b.box(sx + 0.2 + k * 0.88, 0.44, sz + 0.05, 0.84, 0.12, 0.55, shade(theme.fabric, 0.1));
    b.box(sx, 0.44, sz + 0.6, 3.0, 0.55, 0.25, theme.fabric);
    b.box(sx - 0.05, 0.44, sz, 0.22, 0.25, 0.85, shade(theme.fabric, -0.1));
    b.box(sx + 2.83, 0.44, sz, 0.22, 0.25, 0.85, shade(theme.fabric, -0.1));
    b.box(sx + 0.35, 0.56, sz + 0.45, 0.4, 0.35, 0.12, theme.fabric2);
    nav.block(sx - 0.05, sz, sx + 3.05, ROOM_D);
    for (let k = 0; k < 3; k++) seatInteract(`sofa-${k}`, 'Sofa', sx + 0.62 + k * 0.88, sz + 0.35, FACE.N, 'sitIdle', 0.04);
    armchair(14.75, 12.6, Q.E, theme.fabric2);
    seatInteract('lounge-chair', 'Armchair', 14.8, 12.6, FACE.E, 'read', 0.05);
    // coffee table
    b.box(16.3, 0, 12.7, 1.6, 0.35, 0.9, W.dark);
    b.box(16.25, 0.35, 12.65, 1.7, 0.06, 1.0, W.light);
    b.box(16.5, 0.41, 12.85, 0.4, 0.06, 0.3, '#b5463b');
    b.box(16.52, 0.47, 12.87, 0.36, 0.05, 0.26, '#fbf1dc');
    cup(17.5, 0.41, 13.0, '#d9734e', true);
    nav.block(16.25, 12.65, 17.95, 13.65);
    floorLamp(14.6, 15.4);
    plant(21.4, 15.4, 'monstera', 1.2);

    // record player cabinet on the east wall
    const rx = 21.15, rz = 10.6;
    b.box(rx, 0, rz, 0.8, 0.62, 1.7, W.mid, { ao: 0.2 });
    b.box(rx - 0.02, 0.62, rz - 0.02, 0.84, 0.05, 1.74, W.light);
    for (let k = 0; k < 2; k++) b.box(rx - 0.01, 0.1, rz + 0.1 + k * 0.8, 0.02, 0.42, 0.7, shade(W.mid, -0.15));
    // vinyl crate visible on the front
    for (let k = 0; k < 6; k++) b.box(rx - 0.02, 0.12, rz + 0.15 + k * 0.1, 0.03, 0.35, 0.08, BOOK_COLORS[k + 2]);
    b.box(rx + 0.1, 0.67, rz + 0.35, 0.6, 0.12, 0.7, '#3a2a24'); // turntable plinth
    // speakers
    for (const z of [rz + 0.02, rz + 1.36]) {
      b.box(rx + 0.15, 0.67, z, 0.5, 0.55, 0.32, '#3a2a24');
      b.box(rx + 0.12, 0.75, z + 0.06, 0.04, 0.2, 0.2, '#1d1d24');
      b.box(rx + 0.12, 1.0, z + 0.1, 0.04, 0.12, 0.12, '#1d1d24');
    }
    nav.block(rx, rz, ROOM_W, rz + 1.7);
    // spinning platter (animated)
    const pb = new VoxBuilder();
    pb.box(-0.24, 0, -0.24, 0.48, 0.03, 0.48, '#1d1d24');
    pb.box(-0.2, 0.001, -0.2, 0.4, 0.031, 0.4, '#2a2a30');
    pb.box(-0.07, 0.002, -0.07, 0.14, 0.032, 0.14, theme.rug[0]);
    pb.box(0.12, 0.003, -0.02, 0.06, 0.033, 0.04, '#fbf1dc');
    const platter = meshFrom(pb);
    platter.position.set(rx + 0.4, 0.79, rz + 0.7);
    group.add(platter);
    animators.push((_t, dt) => { platter.rotation.y -= dt * 3.5; });
    b.box(rx + 0.62, 0.79, rz + 0.95, 0.04, 0.05, 0.04, '#c9ccd2'); // tonearm base
    b.box(rx + 0.45, 0.83, rz + 0.92, 0.2, 0.02, 0.02, '#c9ccd2');
    addInteract({
      id: 'record', kind: 'record', name: 'Record Player', verb: 'Change the music', x: rx + 0.4, z: rz + 0.85, y: 1.9, radius: 1.3,
      approach: { x: rx - 0.6, z: rz + 0.85, facing: FACE.E },
    });

    // arcade cabinet
    const ax = 21.05, az = 12.9;
    const ac = theme.id === 'arcade' ? '#ff3fb4' : '#3f5f8f';
    b.box(ax, 0, az, 0.85, 1.85, 0.85, ac, { ao: 0.15 });
    b.box(ax - 0.1, 0.85, az + 0.05, 0.25, 0.12, 0.75, '#2a2a30');
    gb.box(ax - 0.06, 0.98, az + 0.2, 0.04, 0.04, 0.04, '#ff6a6a');
    gb.box(ax - 0.06, 0.98, az + 0.35, 0.04, 0.04, 0.04, '#6aff8a');
    b.box(ax - 0.06, 0.97, az + 0.55, 0.04, 0.1, 0.04, '#2a1a1f');
    b.box(ax - 0.01, 1.05, az + 0.08, 0.05, 0.6, 0.69, '#1d1d24');
    gb.box(ax - 0.02, 1.12, az + 0.14, 0.02, 0.48, 0.57, theme.id === 'arcade' ? '#00e5ff' : '#7cf0c4');
    gb.box(ax - 0.02, 1.7, az + 0.08, 0.02, 0.13, 0.69, theme.id === 'arcade' ? '#ffd27a' : '#ff9ad0');
    nav.block(ax - 0.12, az, ROOM_W, az + 0.85);
    addInteract({
      id: 'arcade', kind: 'arcade', name: 'Arcade Cabinet', verb: 'Play a break game', x: ax + 0.4, z: az + 0.42, y: 2.4, radius: 1.3,
      approach: { x: ax - 0.65, z: az + 0.42, facing: FACE.E },
    });

    // pet bed
    const px0 = 19.6, pz0 = 11.3;
    b.cbox(px0, 0, pz0, 0.85, 0.16, 0.7, theme.fabric2);
    b.cbox(px0, 0.16, pz0 - 0.28, 0.85, 0.14, 0.14, shade(theme.fabric2, -0.12));
    b.cbox(px0 - 0.36, 0.16, pz0, 0.13, 0.12, 0.7, shade(theme.fabric2, -0.12));
    b.cbox(px0 + 0.36, 0.16, pz0, 0.13, 0.12, 0.7, shade(theme.fabric2, -0.12));
    b.cbox(px0, 0.16, pz0 + 0.05, 0.6, 0.04, 0.5, '#fbf1dc');
    b.cbox(px0 + 0.55, 0, pz0 + 0.2, 0.2, 0.08, 0.2, '#8a8a94');
    addInteract({
      id: 'petbed', kind: 'petbed', name: 'Pet Corner', verb: 'Visit your pet', x: px0, z: pz0, y: 1.0, radius: 1.1,
      approach: { x: px0, z: pz0 + 0.8, facing: FACE.N },
    });
  }

  // ------------------------------------------------------------ EAST: wardrobe mirror (+ theme feature)
  {
    const mx = 21.3, mz = 6.2;
    b.box(mx, 0, mz, 0.5, 0.06, 1.0, W.dark);
    b.box(mx + 0.18, 0.06, mz + 0.05, 0.14, 1.9, 0.9, W.mid);
    gb.box(mx + 0.16, 0.2, mz + 0.12, 0.02, 1.62, 0.76, '#bfe0ea');
    gb.box(mx + 0.155, 1.2, mz + 0.2, 0.02, 0.4, 0.12, '#ffffff');
    // clothes rail
    b.box(mx - 0.05, 0, mz + 1.25, 0.06, 1.7, 0.06, P.brass1);
    b.box(mx - 0.05, 0, mz + 2.45, 0.06, 1.7, 0.06, P.brass1);
    b.box(mx - 0.05, 1.65, mz + 1.25, 0.06, 0.05, 1.26, P.brass1);
    ['#b5463b', '#e2b04a', '#3f7d4a', '#5b85b8', '#6e4a7a'].forEach((c, k) => {
      b.box(mx - 0.18, 0.95, mz + 1.35 + k * 0.22, 0.32, 0.68, 0.16, c);
    });
    nav.block(mx - 0.2, mz, ROOM_W, mz + 2.55);
    addInteract({
      id: 'wardrobe', kind: 'wardrobe', name: 'Wardrobe Mirror', verb: 'Change your look', x: mx + 0.2, z: mz + 0.5, y: 2.4, radius: 1.3,
      approach: { x: mx - 0.6, z: mz + 0.5, facing: FACE.E },
    });
    addWindow(wallE, 'E', 3.0, 4.6);
    plant(13.3, 0.9, 'monstera', 1.1);
    plant(15.2, 6.4, 'fern');
    plant(5.2, 10.4, 'ficus', 0.85);
  }

  // ------------------------------------------------------------ THEME EXTRAS
  themeExtras(theme, b, gb, nav, group, emitters, animators, wb(wallN), wb(wallW), plant, r);

  // ------------------------------------------------------------ bake meshes
  if (!b.isEmpty()) group.add(meshFrom(b));
  if (!gb.isEmpty()) { const m = meshFrom(gb, 'glow'); m.layers.set(LAYER_NO_OUTLINE); group.add(m); }
  for (const [g, e] of wallBuilders) {
    if (!e.b.isEmpty()) { const m = meshFrom(e.b); m.castShadow = false; g.add(m); }
    if (!e.gb.isEmpty()) { const m = meshFrom(e.gb, 'glow'); m.layers.set(LAYER_NO_OUTLINE); g.add(m); }
  }

  // ------------------------------------------------------------ lights
  const hemi = new THREE.HemisphereLight(theme.hemi.sky, theme.hemi.ground, theme.hemi.intensity * 1.55);
  group.add(hemi);
  const sun = new THREE.DirectionalLight(theme.sun.color, theme.sun.intensity);
  sun.position.set(ROOM_W / 2 + 7, 16, ROOM_D / 2 + 9);
  sun.target.position.set(ROOM_W / 2, 0, ROOM_D / 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera as THREE.OrthographicCamera;
  sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 50;
  sun.shadow.bias = -0.0015;
  sun.shadow.normalBias = 0.02;
  group.add(sun, sun.target);
  const points: THREE.PointLight[] = [];
  const pl = (x: number, y: number, z: number, k = 1, dist = 7) => {
    const l = new THREE.PointLight(theme.lamp, theme.lampIntensity * k * (night ? 1.3 : 0.9), dist, 1.2);
    l.position.set(x, y, z);
    group.add(l);
    points.push(l);
  };
  pl(2.4, 2.2, 2.6, 1.1);
  pl(18.8, 1.8, 3.2, 1.0, 6);
  pl(16.5, 1.8, 14.0, 1.0, 6);
  pl(10.5, 2.3, 8.2, 0.9, 8);
  if (theme.id === 'cafe') pl(21.2, 0.9, 8.0, 1.4, 5);

  const wanderPoints = [
    { x: 2.6, z: 4.4 }, { x: 6.6, z: 2.0 }, { x: 8.3, z: 1.6 }, { x: 11.2, z: 1.8 }, { x: 18.8, z: 1.7 },
    { x: 18.8, z: 5.6 }, { x: 13.5, z: 11.0 }, { x: 3.0, z: 9.5 }, { x: 9.0, z: 11.4 }, { x: 18.5, z: 10.0 },
    { x: 1.8, z: 6.0 }, { x: 16.0, z: 4.8 },
  ];

  return {
    group, nav, interactables, desks, walls, emitters, animators,
    lights: { hemi, sun, points },
    spawn: { x: 1.4, z: 13.7, facing: FACE.E },
    barista: { x: 2.6, z: 1.5, facing: FACE.S },
    whiteboardTex: { canvas: whiteboardCanvas, tex: whiteboardTexture3 },
    windows,
    wanderPoints,
  };
}

// ---------------------------------------------------------------- theme extras
function themeExtras(
  theme: RoomTheme,
  b: VoxBuilder,
  gb: VoxBuilder,
  nav: NavGrid,
  group: THREE.Group,
  emitters: Emitter[],
  animators: ((t: number, dt: number) => void)[],
  north: { b: VoxBuilder; gb: VoxBuilder },
  west: { b: VoxBuilder; gb: VoxBuilder },
  plant: (x: number, z: number, kind?: 'monstera' | 'ficus' | 'snake' | 'fern' | 'bonsai', s?: number) => void,
  r: () => number,
) {
  const W = theme.wood;
  switch (theme.id) {
    case 'office':
      plant(15.4, 10.4, 'ficus', 1.0);
      plant(5.3, 6.0, 'snake');
      break;
    case 'loft_office': {
      // exposed pipes + edison bulbs
      north.b.box(0, 3.05, 0.05, ROOM_W, 0.1, 0.1, '#5a5a66');
      west.b.box(0.05, 3.05, 0, 0.1, 0.1, ROOM_D, '#5a5a66');
      for (let i = 0; i < 5; i++) {
        const x = 7 + i * 2;
        b.cbox(x, 2.3, 11.2, 0.02, 1.1, 0.02, '#2a1a1f');
        gb.cbox(x, 2.18, 11.2, 0.1, 0.14, 0.1, '#ffc070');
      }
      plant(15.4, 10.4, 'snake');
      break;
    }
    case 'tech_hub': {
      // neon "BREW" sign over the window side
      const [n1] = theme.neon!;
      const letters = [
        [[0, 0, 1, 5], [1, 0, 2, 1], [1, 2, 2, 1], [1, 4, 2, 1], [3, 1, 1, 1], [3, 3, 1, 1]],
        [[0, 0, 1, 5], [1, 0, 2, 1], [3, 1, 1, 1], [1, 2, 2, 1], [2, 3, 1, 1], [3, 4, 1, 1]],
        [[0, 0, 1, 5], [1, 0, 3, 1], [1, 2, 2, 1], [1, 4, 3, 1]],
        [[0, 0, 1, 4], [4, 0, 1, 4], [1, 4, 1, 1], [3, 4, 1, 1], [2, 2, 1, 2]],
      ];
      let ox = 5.9;
      for (const L of letters) {
        for (const [x, y, w, h] of L) north.gb.box(ox + x * 0.08, 2.95 - (y + h) * 0.08, 0.04, w * 0.08, h * 0.08, 0.04, n1);
        ox += 0.5;
      }
      plant(15.4, 10.4, 'ficus');
      break;
    }
    case 'tea_loft': {
      // paper lanterns + rock garden + bonsai
      for (const [x, z] of [[8, 11.4], [12, 11.4], [3, 6.2], [18.8, 7.2]]) {
        b.cbox(x, 2.6, z, 0.02, 0.8, 0.02, '#2a1a1f');
        gb.cbox(x, 2.15, z, 0.36, 0.48, 0.36, '#ffd8a0');
        b.cbox(x, 2.1, z, 0.38, 0.05, 0.38, '#8a2f2f');
        b.cbox(x, 2.62, z, 0.38, 0.05, 0.38, '#8a2f2f');
      }
      b.box(12.6, 0, 12.0, 2.2, 0.12, 1.6, W.dark);
      b.box(12.7, 0.12, 12.1, 2.0, 0.02, 1.4, '#e8e0cc');
      for (let i = 0; i < 6; i++) b.box(12.75, 0.14, 12.2 + i * 0.22, 1.9, 0.005, 0.04, '#d4cab4');
      b.cbox(13.2, 0.12, 12.5, 0.3, 0.18, 0.24, '#7a8070');
      b.cbox(14.1, 0.12, 13.0, 0.22, 0.12, 0.2, '#8e9484');
      nav.block(12.6, 12.0, 14.8, 13.6);
      plant(5.3, 6.0, 'bonsai', 1.4);
      plant(15.4, 10.4, 'bonsai', 1.6);
      break;
    }
    case 'cafe': {
      // fireplace on the east wall (in front of the hidden side wall area)
      const fx = 21.4, fz = 8.6;
      b.box(fx - 0.2, 0, fz - 0.1, 0.8, 1.5, 1.6, '#6b3c28');
      b.box(fx - 0.3, 1.5, fz - 0.2, 0.9, 0.12, 1.8, '#4a2a1e');
      b.box(fx - 0.21, 0.15, fz + 0.3, 0.02, 0.8, 0.8, '#1d1416');
      gb.box(fx - 0.18, 0.2, fz + 0.4, 0.05, 0.4, 0.6, '#ff8a3a');
      gb.box(fx - 0.17, 0.22, fz + 0.5, 0.05, 0.6, 0.4, '#ffd27a');
      b.box(fx - 0.15, 0.15, fz + 0.35, 0.1, 0.08, 0.7, '#4a2a1e');
      emitters.push({ kind: 'fire', x: fx - 0.2, y: 0.5, z: fz + 0.7 });
      nav.block(fx - 0.3, fz - 0.1, ROOM_W, fz + 1.5);
      // candles on bistro tables
      gb.cbox(10.8, 0.76, 12.7, 0.04, 0.1, 0.04, '#ffd27a');
      plant(15.4, 10.4, 'fern');
      break;
    }
    case 'treehouse': {
      // tree trunks through the floor
      for (const [x, z] of [[5.2, 5.9], [15.4, 10.6], [13.0, 4.2]]) {
        b.cbox(x, 0, z, 0.7, 3.6, 0.7, '#5e3e22', { ao: 0.2 });
        b.cbox(x, 0, z, 0.9, 0.3, 0.9, '#4a3018');
        b.cbox(x + 0.3, 1.8, z, 0.5, 0.15, 0.2, '#5e3e22');
        for (let i = 0; i < 5; i++) b.cbox(x + (r() - 0.5) * 1.6, 3.2 + r() * 0.5, z + (r() - 0.5) * 1.6, 0.6, 0.4, 0.6, i % 2 ? '#3f6e30' : '#4a7a3a');
        nav.block(x - 0.45, z - 0.45, x + 0.45, z + 0.45);
      }
      // hanging vines on north wall
      for (let i = 0; i < 12; i++) {
        const x = 0.5 + i * 1.8;
        const len = 0.5 + r() * 1.2;
        north.b.box(x, WALL_H - len, 0.06, 0.06, len, 0.06, '#3f6e30');
        north.b.box(x - 0.06, WALL_H - len, 0.06, 0.18, 0.1, 0.08, '#62a356');
      }
      break;
    }
    case 'greenhouse': {
      for (const [x, z, k] of [[5.3, 6.0, 'monstera'], [15.4, 10.4, 'ficus'], [13.0, 11.8, 'fern'], [9.0, 15.4, 'monstera'], [21.5, 9.6, 'fern']] as const) {
        plant(x, z, k, 1.2);
      }
      for (let i = 0; i < 6; i++) {
        const x = 4 + i * 3;
        b.cbox(x, 2.6, 4.8, 0.02, 0.8, 0.02, '#2a1a1f');
        b.cbox(x, 2.35, 4.8, 0.3, 0.25, 0.3, '#b5523b');
        for (let k = 0; k < 4; k++) b.cbox(x + (k % 2 ? 0.15 : -0.15), 1.9 + k * 0.08, 4.8 + (k > 1 ? 0.12 : -0.12), 0.12, 0.45, 0.12, k % 2 ? '#62a356' : '#3f7d4a');
      }
      break;
    }
    case 'lilypad': {
      // water surrounding the dock
      const water = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: '#13204a' }));
      water.rotation.x = -Math.PI / 2;
      water.position.set(ROOM_W / 2, -0.7, ROOM_D / 2);
      group.add(water);
      for (let i = 0; i < 26; i++) {
        const a = r() * Math.PI * 2, d = 13 + r() * 9;
        const x = ROOM_W / 2 + Math.cos(a) * d, z = ROOM_D / 2 + Math.sin(a) * d * 0.8;
        b.cbox(x, -0.68, z, 0.7, 0.03, 0.6, '#2f6e4a');
        if (i % 3 === 0) gb.cbox(x, -0.65, z, 0.2, 0.14, 0.2, '#f0a8c8');
      }
      // paper lanterns
      for (const [x, z] of [[8, 11.4], [12, 11.4], [3, 6.2], [18.8, 7.2]]) {
        b.cbox(x, 2.6, z, 0.02, 0.8, 0.02, '#2a1a1f');
        gb.cbox(x, 2.15, z, 0.32, 0.4, 0.32, '#ffc890');
      }
      plant(15.4, 10.4, 'fern');
      break;
    }
    case 'arcade': {
      const [n1, n2] = theme.neon!;
      // extra cabinets along the south side
      for (let i = 0; i < 2; i++) {
        const x = 12.0 + i * 1.0, z = 15.0;
        b.box(x, 0, z, 0.85, 1.8, 0.85, i ? n2 : '#6e4a7a');
        b.box(x + 0.05, 1.0, z - 0.02, 0.75, 0.6, 0.04, '#1d1d24');
        gb.box(x + 0.1, 1.05, z - 0.03, 0.65, 0.5, 0.02, i ? n1 : '#ffd27a');
        gb.box(x + 0.05, 1.65, z - 0.03, 0.75, 0.12, 0.02, n2);
        nav.block(x, z, x + 0.85, z + 0.85);
      }
      // neon floor strips
      gb.box(0.1, 0.01, 0.1, ROOM_W - 0.2, 0.02, 0.05, n1);
      gb.box(0.1, 0.01, 0.1, 0.05, 0.02, ROOM_D - 0.2, n2);
      plant(15.4, 10.4, 'snake');
      break;
    }
  }
  void animators;
}
