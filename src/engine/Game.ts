import * as THREE from 'three';
import { PixelPipeline } from './pipeline';
import { buildRoom, ROOM_W, ROOM_D, FACE, type RoomBuild, type Interactable, type Seat } from './room';
import { buildAvatar, animateAvatar, setHeld, disposeAvatar, type AvatarRig } from './avatar';
import { buildPet, animatePet, type PetRig } from './pets';
import { Particles } from './particles';
import { THEME_BY_ID, type ThemeId, type RoomTheme } from './themes';
import type { AvatarConfig, PetKind, AnimState } from './avatarTypes';
import { screenTexture, whiteboardTexture } from './textures';
import { VoxBuilder, meshFrom, glowMat, toonMat, glassMat } from './vox';
import { LAYER_NO_OUTLINE } from './pipeline';
import { randomAvatar, NPC_PROFILES } from './npcs';

export interface ActorInit {
  id: string;
  name: string;
  avatar: AvatarConfig;
  pet?: PetKind;
  petName?: string;
  kind: 'player' | 'bot' | 'npc' | 'remote' | 'barista';
  deskIndex?: number;
  status?: string;
}

interface Actor extends ActorInit {
  rig: AvatarRig;
  x: number;
  z: number;
  facing: number;
  path: { x: number; z: number }[];
  speed: number;
  seat: Seat | null;
  seatId: string | null;
  sitBlend: number;
  pendingSeat: { seat: Seat; id: string } | null;
  pendingInteract: Interactable | null;
  petRig?: PetRig;
  labelEl: HTMLDivElement;
  bubbleEl: HTMLDivElement;
  bubbleUntil: number;
  statusText: string;
  brain?: Brain;
  // remote interpolation targets
  tx?: number;
  tz?: number;
  tfacing?: number;
  tanim?: AnimState;
  moving: boolean;
  avatarKey: string;
}

interface Brain {
  mode: 'work' | 'trip' | 'returning' | 'lounge';
  timer: number;
  homeDesk: number;
  lines: string[];
}

export type GameEvent =
  | { type: 'near'; target: Interactable | null }
  | { type: 'interact'; target: Interactable }
  | { type: 'zone'; zone: string }
  | { type: 'sat'; seatId: string; deskIndex?: number }
  | { type: 'stood' }
  | { type: 'proximity'; music: number; cafe: number; fire: number; focus: boolean }
  | { type: 'actorClick'; actorId: string; name: string; kind: ActorInit['kind'] }
  | { type: 'step' }
  | { type: 'ready' };

const ZONES: { name: string; test: (x: number, z: number) => boolean }[] = [
  { name: 'Coffee Bar', test: (x, z) => x < 5.6 && z < 4.6 },
  { name: 'Snack Nook', test: (x, z) => x < 9.2 && z < 3 },
  { name: 'Whiteboard', test: (x, z) => x < 13.4 && z < 3 },
  { name: 'Library', test: (x, z) => x > 15.2 && z < 6 },
  { name: 'Desks', test: (x, z) => x > 5.2 && x < 15.6 && z > 5.4 && z < 10.8 },
  { name: 'Lounge', test: (x, z) => x > 14 && z > 9.6 },
  { name: 'Entrance', test: (x, z) => x < 2.4 && z > 11.6 },
  { name: 'Café Tables', test: (x, z) => z > 10.8 },
  { name: 'Copier', test: (x, z) => x < 2.6 && z > 4.6 && z < 8 },
];

const v3 = new THREE.Vector3();

export class Game {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  labelLayer: HTMLDivElement;
  pipeline: PixelPipeline;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 120);
  room!: RoomBuild;
  theme!: RoomTheme;
  particles = new Particles(700, 2);
  actors = new Map<string, Actor>();
  player!: Actor;
  listeners = new Set<(e: GameEvent) => void>();
  marker: THREE.Mesh;

  // camera state
  azimuthIndex = 0;
  azimuth = Math.PI / 4;
  targetAzimuth = Math.PI / 4;
  elevation = Math.atan(1 / Math.SQRT2) * 0.95;
  camTarget = new THREE.Vector3(10, 0, 10);
  pixelSize = 3;
  ppu = 16;
  subOffset = new THREE.Vector2();
  rt = { w: 1, h: 1 };

  keys = new Set<string>();
  inputEnabled = true;
  near: Interactable | null = null;
  zone = '';
  t = 0;
  acc = 0;
  last = performance.now();
  raf = 0;
  disposed = false;
  npcsEnabled = true;
  private npcsSeeded = false;
  focus = { running: false, progress: 0, label: '' };
  hovered: Interactable | null = null;
  private resizeObs: ResizeObserver;
  private proxTimer = 0;
  private stepTimer = 0;
  private screenTimer = 0;
  private emitTimers: number[] = [];
  private occupiedDesks = new Set<number>();

  constructor(container: HTMLElement) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cb-canvas';
    container.appendChild(this.canvas);
    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'cb-labels';
    container.appendChild(this.labelLayer);
    this.pipeline = new PixelPipeline(this.canvas);
    this.camera.layers.enable(LAYER_NO_OUTLINE);

    // bobbing marker over the nearest interactable
    const mb = new VoxBuilder();
    mb.box(-0.09, 0.12, -0.09, 0.18, 0.18, 0.18, '#ffe27a');
    mb.box(-0.05, 0.0, -0.05, 0.1, 0.12, 0.1, '#ffe27a');
    mb.box(-0.13, 0.17, -0.03, 0.26, 0.08, 0.06, '#fff6c8');
    this.marker = meshFrom(mb, 'glow');
    this.marker.layers.set(LAYER_NO_OUTLINE);
    this.marker.visible = false;
    this.scene.add(this.marker);
    this.scene.add(this.particles.points);

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(container);
    this.bindInput();
    this.resize();
  }

  on(fn: (e: GameEvent) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit(e: GameEvent) {
    for (const l of this.listeners) l(e);
  }

  // ------------------------------------------------------------ room
  loadRoom(themeId: ThemeId) {
    if (this.room) {
      this.scene.remove(this.room.group);
      const shared = new Set<THREE.Material>([toonMat(), glowMat(), glassMat()]);
      this.room.group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        m.geometry.dispose();
        for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
          if (shared.has(mat)) continue;
          const map = (mat as THREE.MeshBasicMaterial).map;
          if (map) map.dispose();
          mat.dispose();
        }
      });
    }
    this.theme = THEME_BY_ID[themeId];
    this.room = buildRoom(this.theme);
    this.scene.add(this.room.group);
    this.scene.background = new THREE.Color(this.theme.bg);
    this.scene.fog = null;
    this.pipeline.setTint(1, 1, 1);
    // reset actors' positions to spawn / seats
    for (const a of this.actors.values()) {
      if (a.kind === 'player') {
        const wasSeated = !!a.seat;
        a.seat = null; a.seatId = null; a.sitBlend = 0;
        a.pendingInteract = null; a.pendingSeat = null;
        a.rig.state = 'idle';
        this.placeAt(a, this.room.spawn.x, this.room.spawn.z, this.room.spawn.facing);
        if (wasSeated) this.emit({ type: 'stood' });
      }
    }
    this.refreshNpcs();
    this.updateWhiteboard([]);
    this.camTarget.set(this.room.spawn.x + 4, 0, this.room.spawn.z - 3);
  }

  // ------------------------------------------------------------ actors
  private makeActor(init: ActorInit): Actor {
    const rig = buildAvatar(init.avatar);
    this.scene.add(rig.root);
    const labelEl = document.createElement('div');
    labelEl.className = `cb-label cb-label-${init.kind}`;
    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'cb-bubble';
    bubbleEl.style.display = 'none';
    this.labelLayer.appendChild(labelEl);
    this.labelLayer.appendChild(bubbleEl);
    const a: Actor = {
      ...init,
      rig,
      x: 0, z: 0, facing: 0,
      path: [],
      speed: init.kind === 'player' ? 3.3 : 2.1,
      seat: null, seatId: null, sitBlend: 0,
      pendingSeat: null, pendingInteract: null,
      labelEl, bubbleEl, bubbleUntil: 0,
      statusText: init.status ?? '',
      moving: false,
      avatarKey: JSON.stringify(init.avatar),
    };
    if (init.pet && init.pet !== 'none') this.attachPet(a, init.pet);
    this.renderLabel(a);
    this.actors.set(init.id, a);
    return a;
  }

  private attachPet(a: Actor, kind: PetKind) {
    if (a.petRig) {
      this.scene.remove(a.petRig.root);
      a.petRig = undefined;
    }
    if (kind === 'none') return;
    const p = buildPet(kind);
    p.x = a.x - 0.6;
    p.z = a.z + 0.4;
    p.root.position.set(p.x, 0, p.z);
    this.scene.add(p.root);
    a.petRig = p;
  }

  private renderLabel(a: Actor) {
    const badge =
      a.kind === 'player' ? '<span class="cb-badge cb-badge-you">you</span>'
      : a.kind === 'bot' ? '<span class="cb-badge cb-badge-bot">study bot</span>'
      : a.kind === 'npc' ? '<span class="cb-badge cb-badge-npc">regular</span>'
      : a.kind === 'barista' ? '<span class="cb-badge cb-badge-npc">barista</span>' : '';
    const status = a.statusText ? `<div class="cb-status">${escapeHtml(a.statusText)}</div>` : '';
    a.labelEl.innerHTML = `<div class="cb-name">${escapeHtml(a.name)}${badge}</div>${status}`;
  }

  setPlayer(init: Omit<ActorInit, 'kind' | 'id'> & { id?: string }) {
    const id = init.id ?? 'me';
    let a = this.player;
    const prevDesk = a?.deskIndex;
    const key = JSON.stringify(init.avatar);
    if (!a) {
      a = this.makeActor({ ...init, id, kind: 'player' });
      this.player = a;
      if (this.room) this.placeAt(a, this.room.spawn.x, this.room.spawn.z, this.room.spawn.facing);
    } else {
      if (a.avatarKey !== key) this.rebuildRig(a, init.avatar);
      if ((a.petRig?.kind ?? 'none') !== (init.pet ?? 'none')) this.attachPet(a, init.pet ?? 'none');
      a.name = init.name;
      a.deskIndex = init.deskIndex;
      this.renderLabel(a);
    }
    const deskChanged = prevDesk !== init.deskIndex || !this.npcsSeeded;
    a.deskIndex = init.deskIndex;
    if (deskChanged) {
      this.npcsSeeded = true;
      this.refreshNpcs();
    }
  }

  private rebuildRig(a: Actor, avatar: AvatarConfig) {
    const held = a.rig.heldKind;
    const st = a.rig.state;
    this.scene.remove(a.rig.root);
    disposeAvatar(a.rig);
    a.rig = buildAvatar(avatar);
    a.rig.state = st;
    setHeld(a.rig, held);
    this.scene.add(a.rig.root);
    a.avatar = avatar;
    a.avatarKey = JSON.stringify(avatar);
    this.syncRig(a);
  }

  private removeActor(id: string) {
    const a = this.actors.get(id);
    if (!a) return;
    this.scene.remove(a.rig.root);
    disposeAvatar(a.rig);
    if (a.petRig) {
      this.scene.remove(a.petRig.root);
      a.petRig.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose(); });
    }
    a.labelEl.remove();
    a.bubbleEl.remove();
    this.actors.delete(id);
  }

  private placeAt(a: Actor, x: number, z: number, facing: number) {
    a.x = x; a.z = z; a.facing = facing; a.path = [];
    this.syncRig(a);
  }

  private syncRig(a: Actor) {
    const seatY = a.seat ? a.seat.y * a.sitBlend : 0;
    a.rig.root.position.set(a.x, seatY, a.z);
    a.rig.root.rotation.y = a.facing;
  }

  setHeld(kind: string | null) {
    if (this.player) setHeld(this.player.rig, kind);
  }

  setPlayerStatus(text: string) {
    if (!this.player) return;
    if (this.player.statusText === text) return;
    this.player.statusText = text;
    this.renderLabel(this.player);
  }

  say(actorId: string, text: string, ms = 4500) {
    const a = this.actors.get(actorId);
    if (!a) return;
    a.bubbleEl.textContent = text;
    a.bubbleEl.style.display = 'block';
    a.bubbleUntil = this.t + ms / 1000;
  }

  /** Straight-line walk for scripted NPC moments (e.g. the barista brewing). */
  walkActor(id: string, x: number, z: number) {
    const a = this.actors.get(id);
    if (a) a.path = [{ x, z }];
  }

  /** Pixel confetti burst over the player (session complete, purchases…). */
  celebrate() {
    const p = this.player;
    if (!p) return;
    const cols = ['#ffd27a', '#f0a8a8', '#8fe3c4', '#8cb4dc', '#d9734e', '#ffffff'].map((c) => new THREE.Color(c));
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 1.6;
      this.particles.spawn(p.x, 1.6, p.z, Math.cos(a) * sp, 1.2 + Math.random() * 2.2, Math.sin(a) * sp, 1.2 + Math.random() * 0.8, cols[i % cols.length], 4.5);
    }
  }

  wave() {
    if (!this.player || this.player.seat) return;
    this.player.rig.state = 'wave';
    this.player.rig.stateT = 0;
  }

  // ------------------------------------------------------------ NPCs (study bot, barista, regulars)
  setNpcsEnabled(on: boolean) {
    this.npcsEnabled = on;
    this.refreshNpcs();
  }

  private refreshNpcs() {
    if (!this.room || !this.theme) return;
    // barista
    const baristaId = 'barista';
    if (!this.actors.has(baristaId)) {
      const ba = this.makeActor({
        id: baristaId, name: 'Bea', kind: 'barista', status: '',
        avatar: { ...randomAvatar(42), top: 'apron', topColor: '#3f7d4a', hat: 'cap', hatColor: '#3f7d4a', hair: 'ponytail', hairColor: '#7a4a2a' },
      });
      this.placeAt(ba, this.room.barista.x, this.room.barista.z, this.room.barista.facing);
    } else {
      const ba = this.actors.get(baristaId)!;
      this.placeAt(ba, this.room.barista.x, this.room.barista.z, this.room.barista.facing);
    }

    // study bot always at desk 0
    const botId = 'bot';
    const bot = this.actors.get(botId);
    if (bot && bot.name !== this.theme.bot.name) this.removeActor(botId);
    if (!this.actors.has(botId)) {
      const a = this.makeActor({
        id: botId, name: this.theme.bot.name, kind: 'bot', deskIndex: 0, status: this.theme.bot.status,
        avatar: randomAvatar(this.theme.id.length * 7 + 3),
      });
      a.brain = { mode: 'work', timer: 50 + Math.random() * 60, homeDesk: 0, lines: ['Back to it!', 'Coffee break ☕', 'Deep work mode.'] };
      this.seatActorAtDesk(a, 0);
    } else {
      this.seatActorAtDesk(this.actors.get(botId)!, 0);
    }

    // café regulars fill a few desks when enabled
    for (const a of [...this.actors.values()]) if (a.kind === 'npc') this.removeActor(a.id);
    if (this.npcsEnabled) {
      const taken = new Set<number>([0]);
      if (this.player?.deskIndex != null) taken.add(this.player.deskIndex);
      for (const a of this.actors.values()) if (a.kind === 'remote' && a.deskIndex != null) taken.add(a.deskIndex);
      const remoteCount = [...this.actors.values()].filter((a) => a.kind === 'remote').length;
      const want = Math.max(0, 3 - remoteCount);
      const free = [5, 2, 7, 3, 6, 4, 1].filter((d) => !taken.has(d));
      const seed = this.theme.id.length;
      for (let k = 0; k < Math.min(want, free.length); k++) {
        const prof = NPC_PROFILES[(seed + k * 3) % NPC_PROFILES.length];
        const a = this.makeActor({
          id: `npc-${k}`, name: prof.name, kind: 'npc', deskIndex: free[k], status: prof.status,
          avatar: randomAvatar(seed * 13 + k * 101), pet: k === 1 ? (['cat', 'shiba', 'bunny'] as PetKind[])[seed % 3] : 'none',
        });
        a.brain = { mode: 'work', timer: 20 + Math.random() * 70, homeDesk: free[k], lines: prof.lines };
        this.seatActorAtDesk(a, free[k]);
      }
    }
    this.recomputeOccupancy();
  }

  private recomputeOccupancy() {
    this.occupiedDesks.clear();
    for (const a of this.actors.values()) if (a.kind !== 'player' && a.deskIndex != null) this.occupiedDesks.add(a.deskIndex);
  }

  deskOwner(index: number): { id: string; name: string; kind: ActorInit['kind'] } | null {
    for (const a of this.actors.values()) if (a.deskIndex === index && a.kind !== 'player') return { id: a.id, name: a.name, kind: a.kind };
    return null;
  }

  private seatActorAtDesk(a: Actor, index: number) {
    const d = this.room.desks[index];
    if (!d) return;
    a.seat = d.seat;
    a.seatId = `desk-${index}`;
    a.sitBlend = 1;
    a.x = d.seat.x; a.z = d.seat.z; a.facing = d.seat.facing;
    a.rig.state = d.seat.pose;
    this.syncRig(a);
  }

  private updateBrain(a: Actor, dt: number) {
    const br = a.brain!;
    br.timer -= dt;
    if (br.mode === 'work') {
      if (br.timer <= 0) {
        // take a trip somewhere
        const opts = ['coffee', 'cooler', 'library', 'vending', 'wander', 'lounge'];
        const pick = opts[Math.floor(Math.random() * opts.length)];
        let dest: { x: number; z: number } | null = null;
        if (pick === 'wander' || pick === 'lounge') {
          const wp = this.room.wanderPoints;
          dest = wp[Math.floor(Math.random() * wp.length)];
        } else {
          const it = this.room.interactables.find((i) => i.id === pick);
          if (it) dest = { x: it.approach.x + (Math.random() - 0.5) * 0.8, z: it.approach.z + 0.3 + Math.random() * 0.5 };
        }
        if (dest) {
          this.standUp(a);
          this.pathTo(a, dest.x, dest.z);
          br.mode = 'trip';
          br.timer = 60;
          if (Math.random() < 0.5) this.say(a.id, br.lines[Math.floor(Math.random() * br.lines.length)]);
        } else br.timer = 30;
      }
    } else if (br.mode === 'trip') {
      if (!a.path.length) {
        br.mode = 'lounge';
        br.timer = 6 + Math.random() * 10;
        if (Math.random() < 0.3) setHeld(a.rig, 'cup:#fbf1dc:#8a5234');
      }
    } else if (br.mode === 'lounge') {
      if (br.timer <= 0) {
        const d = this.room.desks[br.homeDesk];
        a.pendingSeat = { seat: d.seat, id: `desk-${br.homeDesk}` };
        this.pathTo(a, d.seat.x, d.seat.z);
        br.mode = 'returning';
        br.timer = 60;
      }
    } else if (br.mode === 'returning') {
      if (a.seat || br.timer <= 0) {
        if (!a.seat) this.seatActorAtDesk(a, br.homeDesk);
        br.mode = 'work';
        br.timer = 70 + Math.random() * 120;
      }
    }
  }

  // ------------------------------------------------------------ remote players
  setRemotes(list: (ActorInit & { x: number; z: number; facing: number; anim: AnimState; bubble?: string })[]) {
    const seen = new Set<string>();
    for (const r of list) {
      const id = `remote-${r.id}`;
      seen.add(id);
      let a = this.actors.get(id);
      if (!a) {
        a = this.makeActor({ ...r, id, kind: 'remote' });
        this.placeAt(a, r.x, r.z, r.facing);
      } else {
        const key = JSON.stringify(r.avatar);
        if (key !== a.avatarKey) this.rebuildRig(a, r.avatar);
        if ((a.petRig?.kind ?? 'none') !== (r.pet ?? 'none')) this.attachPet(a, r.pet ?? 'none');
        if (a.statusText !== (r.status ?? '') || a.name !== r.name) {
          a.statusText = r.status ?? '';
          a.name = r.name;
          this.renderLabel(a);
        }
      }
      a.deskIndex = r.deskIndex;
      a.tx = r.x; a.tz = r.z; a.tfacing = r.facing; a.tanim = r.anim;
      if (r.bubble && a.bubbleEl.textContent !== r.bubble) this.say(id, r.bubble);
    }
    for (const a of [...this.actors.values()]) if (a.kind === 'remote' && !seen.has(a.id)) this.removeActor(a.id);
    const npcCount = [...this.actors.values()].filter((a) => a.kind === 'npc').length;
    const remoteCount = seen.size;
    if (this.npcsEnabled && npcCount + remoteCount !== Math.max(3, remoteCount)) this.refreshNpcs();
    this.recomputeOccupancy();
  }

  playerSnapshot() {
    const p = this.player;
    return {
      x: Math.round(p.x * 100) / 100,
      z: Math.round(p.z * 100) / 100,
      facing: Math.round(p.facing * 100) / 100,
      anim: p.rig.state,
      seatId: p.seatId,
    };
  }

  // ------------------------------------------------------------ movement
  pathTo(a: Actor, x: number, z: number) {
    const path = this.room.nav.findPath(a.x, a.z, x, z);
    a.path = path ?? [];
  }

  private standUp(a: Actor) {
    if (!a.seat) return;
    const s = a.seat;
    const back = { x: s.x - Math.sin(s.facing) * 0.55, z: s.z - Math.cos(s.facing) * 0.55 };
    let nx = back.x, nz = back.z;
    if (!this.room.nav.canStand(nx, nz, 0.18)) {
      // search nearby open spot
      outer: for (let rad = 0.3; rad < 2; rad += 0.2) {
        for (let k = 0; k < 12; k++) {
          const ang = (k / 12) * Math.PI * 2;
          const tx = s.x + Math.cos(ang) * rad, tz = s.z + Math.sin(ang) * rad;
          if (this.room.nav.canStand(tx, tz, 0.18)) { nx = tx; nz = tz; break outer; }
        }
      }
    }
    a.x = nx; a.z = nz;
    a.seat = null;
    a.seatId = null;
    a.sitBlend = 0;
    a.rig.state = 'idle';
    if (a === this.player) this.emit({ type: 'stood' });
  }

  private sit(a: Actor, seat: Seat, id: string) {
    a.seat = seat;
    a.seatId = id;
    a.x = seat.x; a.z = seat.z; a.facing = seat.facing;
    a.path = [];
    a.sitBlend = 0;
    a.rig.state = seat.pose;
    if (a === this.player) {
      const deskIndex = id.startsWith('desk-') ? Number(id.slice(5)) : undefined;
      this.emit({ type: 'sat', seatId: id, deskIndex });
    }
  }

  playerStand() {
    if (this.player?.seat) this.standUp(this.player);
  }

  isSeatTaken(id: string) {
    for (const a of this.actors.values()) {
      if (a === this.player) continue;
      if (a.seatId === id) return true;
      if (a.pendingSeat?.id === id) return true;
      if (id.startsWith('desk-') && a.deskIndex === Number(id.slice(5)) && a.kind !== 'player') return true;
    }
    return false;
  }

  /** Walk to an interactable and use it when you arrive. */
  goTo(target: Interactable) {
    const p = this.player;
    if (!p) return;
    if (p.seatId && target.seat && p.seatId === target.id) {
      this.emit({ type: 'interact', target });
      return;
    }
    if (p.seat) this.standUp(p);
    p.pendingInteract = target;
    p.pendingSeat = null;
    const dist = Math.hypot(p.x - target.approach.x, p.z - target.approach.z);
    if (dist < 0.25) {
      this.arrive(p);
      return;
    }
    this.pathTo(p, target.approach.x, target.approach.z);
    if (!p.path.length) this.arrive(p);
  }

  goToId(id: string) {
    const t = this.room.interactables.find((i) => i.id === id);
    if (t) this.goTo(t);
  }

  goToDesk(index: number) {
    this.goToId(`desk-${index}`);
  }

  private arrive(a: Actor) {
    if (a.pendingSeat) {
      const { seat, id } = a.pendingSeat;
      a.pendingSeat = null;
      this.sit(a, seat, id);
      return;
    }
    if (a === this.player && a.pendingInteract) {
      const t = a.pendingInteract;
      a.pendingInteract = null;
      a.facing = t.approach.facing;
      if (t.seat) {
        if (t.kind === 'desk' && this.isSeatTaken(t.id)) {
          this.emit({ type: 'interact', target: t });
          return;
        }
        if (this.isSeatTaken(t.id)) { this.emit({ type: 'interact', target: t }); return; }
        this.sit(a, t.seat, t.id);
        if (t.kind !== 'desk') this.emit({ type: 'interact', target: t });
      } else {
        this.emit({ type: 'interact', target: t });
      }
    }
  }

  interact() {
    if (!this.inputEnabled || !this.player) return;
    if (this.near) this.goTo(this.near);
  }

  // ------------------------------------------------------------ camera
  rotate(dir: 1 | -1) {
    this.azimuthIndex = (this.azimuthIndex + dir + 4) % 4;
    this.targetAzimuth += dir * (Math.PI / 2);
  }

  setZoom(pixelSize: number) {
    this.pixelSize = Math.max(2, Math.min(6, Math.round(pixelSize)));
    this.resize();
  }

  zoomBy(d: number) {
    this.setZoom(this.pixelSize + d);
  }

  private resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.rt = this.pipeline.setSize(w, h, this.pixelSize);
    this.particles.setSize(Math.max(1, Math.round(this.pixelSize / 2)) * 0 + 1.6);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  private updateCamera(dt: number) {
    this.azimuth += (this.targetAzimuth - this.azimuth) * Math.min(1, dt * 8);
    if (Math.abs(this.targetAzimuth - this.azimuth) < 0.001) this.azimuth = this.targetAzimuth;
    const p = this.player;
    if (p) {
      const tx = Math.max(2, Math.min(ROOM_W - 2, p.x));
      const tz = Math.max(2, Math.min(ROOM_D - 2, p.z));
      const k = Math.min(1, dt * 4);
      this.camTarget.x += (tx - this.camTarget.x) * k;
      this.camTarget.z += (tz - this.camTarget.z) * k;
      this.camTarget.y = 0.6;
    }
    const cam = this.camera;
    const halfW = this.rt.w / 2 / this.ppu;
    const halfH = this.rt.h / 2 / this.ppu;
    cam.left = -halfW; cam.right = halfW; cam.top = halfH; cam.bottom = -halfH;
    cam.updateProjectionMatrix();

    const dist = 40;
    const ce = Math.cos(this.elevation), se = Math.sin(this.elevation);
    const dir = new THREE.Vector3(Math.sin(this.azimuth) * ce, se, Math.cos(this.azimuth) * ce);
    cam.position.copy(this.camTarget).addScaledVector(dir, dist);
    cam.lookAt(this.camTarget);
    cam.updateMatrixWorld();

    // snap to texel grid along the camera's right/up axes
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    const pr = cam.position.dot(right) * this.ppu;
    const pu = cam.position.dot(up) * this.ppu;
    const sr = Math.round(pr), su = Math.round(pu);
    cam.position.addScaledVector(right, (sr - pr) / this.ppu).addScaledVector(up, (su - pu) / this.ppu);
    cam.updateMatrixWorld();
    this.subOffset.set(pr - sr, pu - su);

    // wall cutaway: hide walls between camera and room
    const hz = new THREE.Vector2(Math.sin(this.azimuth), Math.cos(this.azimuth));
    for (const w of this.room.walls) {
      const hide = w.normal.dot(hz) > 0.15;
      w.group.visible = !hide;
      w.stub.visible = hide;
    }
  }

  /** Project a world point to CSS pixels within the container. */
  project(x: number, y: number, z: number): { x: number; y: number; visible: boolean } {
    v3.set(x, y, z).project(this.camera);
    const tx = (v3.x * 0.5 + 0.5) * this.rt.w;
    const ty = (v3.y * 0.5 + 0.5) * this.rt.h;
    const sx = (tx - 1 - this.subOffset.x) * this.pixelSize;
    const syUp = (ty - 1 - this.subOffset.y) * this.pixelSize;
    const sy = this.pipeline.screenH - syUp;
    return { x: sx, y: sy, visible: v3.z < 1 && v3.z > -1 };
  }

  // ------------------------------------------------------------ input
  private onKeyDown = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
    if (!this.inputEnabled) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (k === 'e' || k === ' ' || k === 'enter') {
      if (k === 'enter') return; // enter opens chat (handled by UI)
      this.interact();
      return;
    }
    if (k === 'q') { this.rotate(-1); return; }
    if (k === 'r') { this.rotate(1); return; }
    if (k === '=' || k === '+') { this.zoomBy(1); return; }
    if (k === '-' || k === '_') { this.zoomBy(-1); return; }
    this.keys.add(k);
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };
  private onBlur = () => this.keys.clear();

  private pointerDown: { x: number; y: number } | null = null;
  private onPointerDown = (e: PointerEvent) => {
    this.pointerDown = { x: e.clientX, y: e.clientY };
  };
  private onPointerUp = (e: PointerEvent) => {
    if (!this.pointerDown || !this.inputEnabled) return;
    const moved = Math.hypot(e.clientX - this.pointerDown.x, e.clientY - this.pointerDown.y);
    this.pointerDown = null;
    if (moved > 8) return;
    const rect = this.container.getBoundingClientRect();
    this.handleClick(e.clientX - rect.left, e.clientY - rect.top);
  };
  private onPointerMove = (e: PointerEvent) => {
    const rect = this.container.getBoundingClientRect();
    const hit = this.pickInteractable(e.clientX - rect.left, e.clientY - rect.top);
    this.hovered = hit;
    this.canvas.style.cursor = hit ? 'pointer' : 'default';
  };
  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.zoomBy(e.deltaY < 0 ? 1 : -1);
  };

  private bindInput() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private pickActor(sx: number, sy: number): Actor | null {
    let best: Actor | null = null, bd = 30;
    for (const a of this.actors.values()) {
      if (a === this.player) continue;
      const p = this.project(a.rig.root.position.x, a.rig.root.position.y + 0.7, a.rig.root.position.z);
      const d = Math.hypot(p.x - sx, (p.y - sy) * 0.7);
      if (d < bd) { bd = d; best = a; }
    }
    return best;
  }

  private pickInteractable(sx: number, sy: number): Interactable | null {
    let best: Interactable | null = null, bd = 34;
    for (const it of this.room?.interactables ?? []) {
      if (it.kind === 'seat') continue;
      const p = this.project(it.x, Math.min(it.y, 1.2) * 0.6, it.z);
      const d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bd) { bd = d; best = it; }
    }
    if (!best) {
      bd = 22;
      for (const it of this.room?.interactables ?? []) {
        if (it.kind !== 'seat' || !it.seat) continue;
        const p = this.project(it.seat.x, 0.5, it.seat.z);
        const d = Math.hypot(p.x - sx, p.y - sy);
        if (d < bd) { bd = d; best = it; }
      }
    }
    return best;
  }

  private raycaster = new THREE.Raycaster();
  private handleClick(sx: number, sy: number) {
    const actor = this.pickActor(sx, sy);
    if (actor && actor.kind !== 'barista') {
      this.emit({ type: 'actorClick', actorId: actor.id, name: actor.name, kind: actor.kind });
      return;
    }
    const it = this.pickInteractable(sx, sy);
    if (it) {
      this.goTo(it);
      return;
    }
    // floor point
    // inverse of the composite mapping: screen px -> texel -> NDC
    const ndc = new THREE.Vector2();
    const sxTex = sx / this.pixelSize + this.subOffset.x + 1;
    const syTex = (this.pipeline.screenH - sy) / this.pixelSize + this.subOffset.y + 1;
    ndc.set((sxTex / this.rt.w) * 2 - 1, (syTex / this.rt.h) * 2 - 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(plane, hit)) {
      const p = this.player;
      if (!p) return;
      if (p.seat) this.standUp(p);
      p.pendingInteract = null;
      p.pendingSeat = null;
      this.pathTo(p, Math.max(0.3, Math.min(ROOM_W - 0.3, hit.x)), Math.max(0.3, Math.min(ROOM_D - 0.3, hit.z)));
      this.spawnClickPuff(hit.x, hit.z);
    }
  }

  private spawnClickPuff(x: number, z: number) {
    const c = new THREE.Color('#fff6c8');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.particles.spawn(x, 0.05, z, Math.cos(a) * 0.9, 0.3, Math.sin(a) * 0.9, 0.35, c);
    }
  }

  setInputEnabled(on: boolean) {
    this.inputEnabled = on;
    if (!on) this.keys.clear();
  }

  // ------------------------------------------------------------ world state hooks from UI
  setFocusVisual(running: boolean, progress: number, label: string) {
    this.focus = { running, progress, label };
  }

  updateWhiteboard(columns: { title: string; cards: string[] }[]) {
    if (!this.room) return;
    const cols = columns.length ? columns : [
      { title: 'TODO', cards: ['a', 'b'] }, { title: 'DOING', cards: ['a'] }, { title: 'DONE', cards: ['a', 'b', 'c'] },
    ];
    const fresh = whiteboardTexture(cols);
    const ctx = this.room.whiteboardTex.canvas.getContext('2d')!;
    ctx.clearRect(0, 0, fresh.width, fresh.height);
    ctx.drawImage(fresh, 0, 0);
    this.room.whiteboardTex.tex.needsUpdate = true;
  }

  /** Desk decor items placed on the player's desk (and visible to everyone locally). */
  setDeskDecor(index: number | undefined, items: string[]) {
    if (!this.room) return;
    for (const d of this.room.desks) {
      if (d.index === index) continue;
      if (d.decor.userData.owner === 'me') { d.decor.clear(); d.decor.userData.owner = null; }
    }
    if (index == null) return;
    const d = this.room.desks[index];
    if (!d) return;
    d.decor.clear();
    d.decor.userData.owner = 'me';
    const b = new VoxBuilder();
    const gb = new VoxBuilder();
    const left = d.center.x - 0.8, right = d.center.x + 0.75;
    const zBack = d.center.z + (d.facingSign === 1 ? 0.25 : -0.25);
    const y = d.topY;
    for (const item of items) {
      switch (item) {
        case 'mug': b.cbox(right, y, zBack - 0.1 * d.facingSign, 0.1, 0.12, 0.1, '#d9734e'); break;
        case 'succulent':
          b.cbox(left, y, zBack, 0.16, 0.12, 0.16, '#b5523b');
          b.cbox(left, y + 0.12, zBack, 0.2, 0.08, 0.2, '#62a356');
          b.cbox(left, y + 0.2, zBack, 0.1, 0.06, 0.1, '#9cc96a');
          break;
        case 'lamp':
          b.cbox(left + 0.25, y, zBack, 0.14, 0.03, 0.14, '#3a3a44');
          b.cbox(left + 0.25, y, zBack, 0.03, 0.4, 0.03, '#3a3a44');
          gb.cbox(left + 0.25, y + 0.36, zBack - 0.06 * d.facingSign, 0.18, 0.1, 0.14, '#ffd27a');
          break;
        case 'lava':
          b.cbox(right - 0.25, y, zBack, 0.12, 0.06, 0.12, '#c9ccd2');
          gb.cbox(right - 0.25, y + 0.06, zBack, 0.08, 0.24, 0.08, '#ff6fa8');
          b.cbox(right - 0.25, y + 0.3, zBack, 0.1, 0.04, 0.1, '#c9ccd2');
          break;
        case 'gameboy':
          b.cbox(right - 0.45, y, zBack - 0.2 * d.facingSign, 0.14, 0.03, 0.2, '#b8b8be');
          gb.cbox(right - 0.45, y + 0.031, zBack - 0.17 * d.facingSign, 0.09, 0.005, 0.08, '#9cc96a');
          break;
        case 'catfig':
          b.cbox(left + 0.5, y, zBack, 0.1, 0.12, 0.1, '#2a1a1f');
          b.cbox(left + 0.47, y + 0.12, zBack, 0.03, 0.04, 0.03, '#2a1a1f');
          b.cbox(left + 0.53, y + 0.12, zBack, 0.03, 0.04, 0.03, '#2a1a1f');
          break;
        case 'bonsai':
          b.cbox(left, y, zBack, 0.24, 0.07, 0.16, '#3a3a44');
          b.cbox(left, y + 0.07, zBack, 0.03, 0.12, 0.03, '#4a2a1e');
          b.cbox(left - 0.02, y + 0.17, zBack, 0.22, 0.08, 0.16, '#3f7d4a');
          break;
        case 'crystal':
          gb.cbox(right - 0.2, y, zBack, 0.06, 0.18, 0.06, '#c8a8ff');
          gb.cbox(right - 0.14, y, zBack + 0.03, 0.04, 0.12, 0.04, '#a8d8ff');
          break;
        case 'books':
          b.cbox(left + 0.1, y, zBack - 0.15 * d.facingSign, 0.3, 0.05, 0.2, '#3f5f8f');
          b.cbox(left + 0.1, y + 0.05, zBack - 0.15 * d.facingSign, 0.28, 0.05, 0.19, '#e2b04a');
          b.cbox(left + 0.1, y + 0.1, zBack - 0.15 * d.facingSign, 0.26, 0.04, 0.18, '#b5463b');
          break;
        case 'neon':
          gb.cbox(d.center.x, y + 0.75, d.center.z + (d.facingSign === 1 ? 0.42 : -0.42), 0.5, 0.06, 0.02, '#ff6fa8');
          break;
      }
    }
    if (!b.isEmpty()) d.decor.add(meshFrom(b));
    if (!gb.isEmpty()) { const m = meshFrom(gb, 'glow'); m.material = glowMat(); m.layers.set(LAYER_NO_OUTLINE); d.decor.add(m); }
  }

  // ------------------------------------------------------------ loop
  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      this.acc += dt;
      const step = 1 / 60;
      let n = 0;
      while (this.acc >= step && n < 6) {
        this.update(step);
        this.acc -= step;
        n++;
      }
      if (n === 6) this.acc = 0;
      this.render(dt);
    };
    this.raf = requestAnimationFrame(loop);
    this.emit({ type: 'ready' });
  }

  private update(dt: number) {
    this.t += dt;
    if (!this.room) return;
    const p = this.player;

    // keyboard movement for the player
    if (p && this.inputEnabled) {
      let ix = 0, iz = 0;
      if (this.keys.has('w') || this.keys.has('arrowup')) iz -= 1;
      if (this.keys.has('s') || this.keys.has('arrowdown')) iz += 1;
      if (this.keys.has('a') || this.keys.has('arrowleft')) ix -= 1;
      if (this.keys.has('d') || this.keys.has('arrowright')) ix += 1;
      if (ix || iz) {
        if (p.seat) this.standUp(p);
        p.path = [];
        p.pendingInteract = null;
        p.pendingSeat = null;
        const az = this.azimuth;
        const fx = -Math.sin(az), fz = -Math.cos(az);
        const rx = Math.cos(az), rz = -Math.sin(az);
        let mx = rx * ix + fx * -iz, mz = rz * ix + fz * -iz;
        const len = Math.hypot(mx, mz);
        mx /= len; mz /= len;
        this.moveActor(p, mx, mz, dt);
      } else if (!p.path.length) {
        p.moving = false;
      }
    }

    for (const a of this.actors.values()) {
      if (a.kind === 'remote') this.updateRemote(a, dt);
      else {
        if (a.brain && this.inputEnabled !== null) this.updateBrain(a, dt);
        this.followPath(a, dt);
      }
      // seat blend
      if (a.seat) a.sitBlend = Math.min(1, a.sitBlend + dt * 6);
      if (a.rig.state === 'wave' && a.rig.stateT > 1.6) a.rig.state = 'idle';
      if (!a.seat && a.kind !== 'remote') {
        if (a.moving) a.rig.state = 'walk';
        else if (a.rig.state === 'walk') a.rig.state = 'idle';
      }
      animateAvatar(a.rig, dt, a.moving ? 1 : 0, this.t);
      this.syncRig(a);
      if (a.petRig) this.updatePet(a, dt);
    }

    // barista shuffles behind the counter
    const ba = this.actors.get('barista');
    if (ba && !ba.path.length && Math.random() < dt * 0.08) {
      const x = 0.9 + Math.random() * 3.4;
      ba.path = [{ x, z: 1.5 }];
    }
    if (ba && !ba.path.length && !ba.moving) ba.facing += (FACE.S - ba.facing) * Math.min(1, dt * 4);

    this.updateNear();
    this.updateEmitters(dt);
    this.particles.update(dt, this.t);
    for (const fn of this.room.animators) fn(this.t, dt);

    // footsteps
    if (p?.moving) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) { this.stepTimer = 0.36; this.emit({ type: 'step' }); }
    } else this.stepTimer = 0.1;

    // zone + proximity events
    if (p) {
      const zone = ZONES.find((z) => z.test(p.x, p.z))?.name ?? 'Main Floor';
      if (zone !== this.zone) { this.zone = zone; this.emit({ type: 'zone', zone }); }
      this.proxTimer -= dt;
      if (this.proxTimer <= 0) {
        this.proxTimer = 0.15;
        const d = (x: number, z: number) => Math.hypot(p.x - x, p.z - z);
        const falloff = (dist: number, near: number, far: number) => Math.max(0, Math.min(1, 1 - (dist - near) / (far - near)));
        const music = 0.35 + 0.65 * falloff(d(21.5, 11.4), 1.5, 12);
        const cafe = falloff(d(2.4, 2.0), 2, 13);
        const fire = this.theme.id === 'cafe' ? falloff(d(21.2, 9.3), 1, 8) : 0;
        const focus = !!(p.seatId?.startsWith('desk-'));
        this.emit({ type: 'proximity', music, cafe, fire, focus });
      }
    }

    // my desk screen
    this.screenTimer -= dt;
    if (this.screenTimer <= 0 && p?.deskIndex != null) {
      this.screenTimer = 1;
      const d = this.room.desks[p.deskIndex];
      if (d) {
        const fresh = screenTexture(this.focus.running ? 'focus' : p.seatId === `desk-${p.deskIndex}` ? 'code' : 'idle', Math.floor(this.t / 3), this.focus.progress);
        const ctx = d.screenCanvas.getContext('2d')!;
        ctx.drawImage(fresh, 0, 0);
        d.screenTex.needsUpdate = true;
      }
    }
  }

  private moveActor(a: Actor, mx: number, mz: number, dt: number) {
    const sp = a.speed * dt;
    const nav = this.room.nav;
    const nx = a.x + mx * sp, nz = a.z + mz * sp;
    let moved = false;
    if (nav.canStand(nx, a.z, 0.2)) { a.x = nx; moved = true; }
    if (nav.canStand(a.x, nz, 0.2)) { a.z = nz; moved = true; }
    a.moving = moved;
    if (moved || true) {
      const target = Math.atan2(mx, mz);
      a.facing = lerpAngle(a.facing, target, Math.min(1, dt * 14));
    }
  }

  private followPath(a: Actor, dt: number) {
    if (!a.path.length) {
      if (a.kind !== 'player' || !this.keysDown()) a.moving = false;
      return;
    }
    const wp = a.path[0];
    const dx = wp.x - a.x, dz = wp.z - a.z;
    const dist = Math.hypot(dx, dz);
    const sp = a.speed * dt;
    if (dist <= sp + 0.01) {
      a.x = wp.x; a.z = wp.z;
      a.path.shift();
      if (!a.path.length) {
        a.moving = false;
        this.arrive(a);
      }
      return;
    }
    a.x += (dx / dist) * sp;
    a.z += (dz / dist) * sp;
    a.facing = lerpAngle(a.facing, Math.atan2(dx, dz), Math.min(1, dt * 12));
    a.moving = true;
  }

  private keysDown() {
    return ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].some((k) => this.keys.has(k));
  }

  private updateRemote(a: Actor, dt: number) {
    if (a.tx == null || a.tz == null) return;
    const dx = a.tx - a.x, dz = a.tz - a.z;
    const dist = Math.hypot(dx, dz);
    const sitting = a.tanim === 'type' || a.tanim === 'sitIdle' || a.tanim === 'read' || a.tanim === 'sleep';
    if (dist > 6) { a.x = a.tx; a.z = a.tz; }
    else if (dist > 0.02) {
      const sp = Math.min(dist, 3.3 * dt * (dist > 1 ? 1.5 : 1));
      a.x += (dx / dist) * sp;
      a.z += (dz / dist) * sp;
      if (!sitting) a.facing = lerpAngle(a.facing, Math.atan2(dx, dz), Math.min(1, dt * 12));
    }
    a.moving = dist > 0.05 && !sitting;
    if (sitting) {
      a.facing = lerpAngle(a.facing, a.tfacing ?? a.facing, Math.min(1, dt * 10));
      a.seat = { x: a.x, z: a.z, y: 0.1, facing: a.facing, pose: a.tanim as Seat['pose'] };
      a.sitBlend = 1;
      a.rig.state = a.tanim!;
    } else {
      a.seat = null;
      a.sitBlend = 0;
      a.rig.state = a.moving ? 'walk' : (a.tanim === 'wave' ? 'wave' : 'idle');
    }
  }

  private updatePet(a: Actor, dt: number) {
    const pet = a.petRig!;
    let tx: number, tz: number;
    if (a.seat) {
      tx = a.x + Math.cos(a.facing) * 0.7;
      tz = a.z - Math.sin(a.facing) * 0.7;
    } else {
      tx = a.x - Math.sin(a.facing) * 0.75 + Math.cos(a.facing) * 0.35;
      tz = a.z - Math.cos(a.facing) * 0.75 - Math.sin(a.facing) * 0.35;
    }
    const dx = tx - pet.x, dz = tz - pet.z;
    const dist = Math.hypot(dx, dz);
    let moving = false;
    if (dist > 0.35) {
      const sp = Math.min(dist, (dist > 2 ? 5 : 2.6) * dt);
      const nx = pet.x + (dx / dist) * sp, nz = pet.z + (dz / dist) * sp;
      if (this.room.nav.canStand(nx, nz, 0.08) || dist > 2.5) { pet.x = nx; pet.z = nz; }
      pet.facing = lerpAngle(pet.facing, Math.atan2(dx, dz), Math.min(1, dt * 10));
      moving = true;
    } else {
      pet.facing = lerpAngle(pet.facing, Math.atan2(a.x - pet.x, a.z - pet.z), Math.min(1, dt * 3));
    }
    pet.root.position.set(pet.x, 0, pet.z);
    pet.root.rotation.y = pet.facing;
    animatePet(pet, dt, moving, this.t);
  }

  private updateNear() {
    const p = this.player;
    if (!p) return;
    let best: Interactable | null = null;
    let bd = Infinity;
    for (const it of this.room.interactables) {
      if (it.kind === 'seat') continue;
      const dx = it.approach.x - p.x, dz = it.approach.z - p.z;
      const d = Math.hypot(dx, dz);
      const d2 = Math.hypot(it.x - p.x, it.z - p.z);
      const dd = Math.min(d, d2);
      if (dd < it.radius && dd < bd) { bd = dd; best = it; }
    }
    if (p.seat && p.seatId?.startsWith('desk-')) best = this.room.interactables.find((i) => i.id === p.seatId) ?? best;
    if (best !== this.near) {
      this.near = best;
      this.emit({ type: 'near', target: best });
    }
    const show = this.hovered ?? this.near;
    if (show && !p.seat) {
      this.marker.visible = true;
      this.marker.position.set(show.x, show.y + Math.sin(this.t * 4) * 0.06, show.z);
      this.marker.rotation.y = this.t * 1.5;
    } else this.marker.visible = false;
  }

  private updateEmitters(dt: number) {
    const steam = new THREE.Color('#f4f0e8');
    const ember = new THREE.Color('#ffb060');
    this.room.emitters.forEach((e, i) => {
      this.emitTimers[i] = (this.emitTimers[i] ?? Math.random()) - dt;
      if (this.emitTimers[i] > 0) return;
      if (e.kind === 'steam') {
        this.emitTimers[i] = 0.35 + Math.random() * 0.4;
        this.particles.spawn(e.x + (Math.random() - 0.5) * 0.05, e.y, e.z, 0, 0.32, 0, 1.4, steam);
      } else {
        this.emitTimers[i] = 0.08;
        this.particles.spawn(e.x, e.y, e.z + (Math.random() - 0.5) * 0.5, 0, 0.7 + Math.random() * 0.4, 0, 0.6, ember);
      }
    });
    // ambient particles: dust in day, fireflies at night, rain drops by windows
    const tod = this.theme.timeOfDay;
    if (Math.random() < dt * (tod === 'night' ? 6 : 1.5)) {
      const x = 1 + Math.random() * (ROOM_W - 2), z = 1 + Math.random() * (ROOM_D - 2);
      if (tod === 'night') this.particles.spawn(x, 0.5 + Math.random() * 1.5, z, (Math.random() - 0.5) * 0.3, 0.05, (Math.random() - 0.5) * 0.3, 3, new THREE.Color('#e8ff8a'));
      else this.particles.spawn(x, 1 + Math.random() * 1.6, z, 0.05, -0.02, 0.03, 4, new THREE.Color(tod === 'sunset' ? '#ffcf9a' : '#fff6d8'));
    }
  }

  private render(dt: number) {
    if (!this.room) return;
    this.updateCamera(dt);
    this.pipeline.render(this.scene, this.camera, this.subOffset);
    this.updateLabels();
  }

  private updateLabels() {
    for (const a of this.actors.values()) {
      const head = a.rig.root.position;
      const yTop = head.y + (a.seat ? 1.45 : 1.55);
      const p = this.project(head.x, yTop, head.z);
      const tx = Math.round(p.x), ty = Math.round(p.y);
      a.labelEl.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -100%)`;
      if (a.bubbleUntil > this.t) {
        a.bubbleEl.style.transform = `translate(${tx}px, ${ty - (a.statusText ? 34 : 22)}px) translate(-50%, -100%)`;
      } else if (a.bubbleEl.style.display !== 'none') {
        a.bubbleEl.style.display = 'none';
      }
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.pipeline.dispose();
    this.container.innerHTML = '';
  }
}

function lerpAngle(a: number, b: number, t: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
