import { create } from 'zustand';
import { useApp, today } from '../state/store';
import { useUI, toast } from '../state/ui';
import { roomKey } from '../engine/themes';
import { game } from '../engine/gameRef';
import type { AnimState, AvatarConfig, PetKind } from '../engine/avatarTypes';
import type * as FB from './firebase';

// Multiplayer + cloud sync. Firebase loads lazily, so people who never sign
// in don't download the SDK and don't hit permission errors.

type FBMod = typeof FB;
let fbPromise: Promise<FBMod> | null = null;
export const loadFB = () => (fbPromise ??= import('./firebase'));

export interface NetUser {
  uid: string;
  name: string;
  email: string | null;
}

interface NetState {
  user: NetUser | null;
  ready: boolean;
  busy: boolean;
  dms: FB.DM[];
  notes: FB.CafeNote[];
  set: (p: Partial<NetState>) => void;
}

export const useNet = create<NetState>()((set) => ({
  user: null,
  ready: false,
  busy: false,
  dms: [],
  notes: [],
  set: (p) => set(p),
}));

const FLAG = 'cb:signed-in';
let presenceRoom: string | null = null;
let stopPresence: (() => void) | null = null;
let stopChat: (() => void) | null = null;
let stopDMs: (() => void) | null = null;
let loopTimer: ReturnType<typeof setInterval> | null = null;
let lastWrite = 0;
let lastSig = '';
let bubble: { text: string; at: number } | null = null;
let profileTimer: ReturnType<typeof setTimeout> | null = null;
let started = false;
let attached = false;
let unsubProfile: (() => void) | null = null;

export function initNet() {
  if (started) return;
  started = true;
  if (localStorage.getItem(FLAG)) void attach();
  else useNet.getState().set({ ready: true });
}

async function attach() {
  if (attached) return;
  attached = true;
  const fb = await loadFB();
  fb.onAuth(async (u) => {
    if (u) {
      localStorage.setItem(FLAG, '1');
      const user = { uid: u.uid, name: u.displayName || u.email?.split('@')[0] || 'Coworker', email: u.email };
      useNet.getState().set({ user, ready: true });
      useUI.getState().set({ online: { ...useUI.getState().online, signedIn: true } });
      await syncProfileOnSignIn(fb, user);
      startRoom(fb);
      stopDMs?.();
      stopDMs = fb.listenDMs(u.uid, (dms) => {
        const prev = useNet.getState().dms;
        const fresh = dms.filter((d) => d.recipientId === u.uid && !d.read && !prev.some((p) => p.id === d.id));
        if (prev.length && fresh.length) toast(`New message from ${fresh[fresh.length - 1].senderName} ✉️`, 'info');
        useNet.getState().set({ dms });
      });
    } else {
      localStorage.removeItem(FLAG);
      unsubProfile?.();
      unsubProfile = null;
      stopRoom();
      stopDMs?.();
      stopDMs = null;
      useNet.getState().set({ user: null, ready: true, dms: [] });
      useUI.getState().set({ online: { count: 0, signedIn: false } });
      game()?.setRemotes([]);
    }
  });
}

// ---------------------------------------------------------------- auth actions
export async function signIn(kind: 'google' | 'email' | 'signup', email?: string, pass?: string, name?: string) {
  useNet.getState().set({ busy: true });
  try {
    const fb = await loadFB();
    localStorage.setItem(FLAG, '1');
    void attach();
    if (kind === 'google') await fb.signInGoogle();
    else if (kind === 'email') await fb.signInEmail(email!, pass!);
    else await fb.signUpEmail(email!, pass!, name || '');
    toast('Signed in — your progress now syncs ☁️', 'success');
    return null;
  } catch (e) {
    localStorage.removeItem(FLAG);
    return friendlyError(e);
  } finally {
    useNet.getState().set({ busy: false });
  }
}

export async function resetPassword(email: string) {
  try {
    const fb = await loadFB();
    await fb.resetPassword(email);
    return null;
  } catch (e) {
    return friendlyError(e);
  }
}

export async function signOutNow() {
  const fb = await loadFB();
  const u = useNet.getState().user;
  if (u && presenceRoom) await fb.deletePresence(presenceRoom, u.uid);
  await fb.logOut();
  toast('Signed out', 'info');
}

function friendlyError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code.includes('popup-closed')) return 'Sign-in window was closed.';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'That email and password don’t match.';
  if (code.includes('user-not-found')) return 'No account with that email yet — try “Create account”.';
  if (code.includes('email-already-in-use')) return 'That email already has an account — sign in instead.';
  if (code.includes('weak-password')) return 'Password needs at least 6 characters.';
  if (code.includes('invalid-email')) return 'That email doesn’t look right.';
  if (code.includes('unauthorized-domain')) return 'This domain isn’t authorized for sign-in yet (add it in Firebase Auth settings).';
  if (code.includes('network')) return 'Network error — check your connection.';
  return (e as Error)?.message ?? 'Something went wrong.';
}

// ---------------------------------------------------------------- profile sync
async function syncProfileOnSignIn(fb: FBMod, user: NetUser) {
  try {
    const cloud = await fb.loadProfile(user.uid);
    const app = useApp.getState();
    const cloudAt = cloud?.updatedAt ? Date.parse(cloud.updatedAt) : 0;
    const localNewer = app.localChangedAt > cloudAt;
    if (cloud && localNewer) {
      // this browser has newer progress — keep it, merge unlocks, push it up
      const unlocked = safeJson<string[]>(cloud.unlockedItemsJson) ?? [];
      app.set({ unlocked: [...new Set([...app.unlocked, ...unlocked])], onboarded: true });
      await pushProfile(fb, user);
    } else if (cloud) {
      const av = safeJson<{ avatar?: AvatarConfig; pet?: PetKind; petName?: string }>(cloud.avatarConfigJson);
      const desk = safeJson<{ deskDecor?: string[]; wallpaper?: string }>(cloud.deskConfigJson);
      const unlocked = safeJson<string[]>(cloud.unlockedItemsJson) ?? [];
      app.set({
        name: cloud.displayName || app.name,
        tickets: Math.max(0, cloud.tickets ?? app.tickets),
        unlocked: [...new Set([...app.unlocked, ...unlocked])],
        ...(av?.avatar ? { avatar: { ...app.avatar, ...av.avatar } } : {}),
        ...(av?.pet ? { pet: av.pet, petName: av.petName ?? app.petName } : {}),
        ...(desk?.deskDecor ? { deskDecor: desk.deskDecor } : {}),
        ...(desk?.wallpaper ? { wallpaper: desk.wallpaper } : {}),
        onboarded: true,
      });
    } else {
      if (!app.name) app.set({ name: user.name });
      await pushProfile(fb, user);
    }
  } catch (e) {
    console.warn('[profile]', e);
  }
  // keep pushing local changes (debounced)
  unsubProfile?.();
  unsubProfile = useApp.subscribe((s, p) => {
    if (s.tickets !== p.tickets || s.avatar !== p.avatar || s.name !== p.name || s.unlocked !== p.unlocked || s.deskDecor !== p.deskDecor || s.pet !== p.pet || s.sessions !== p.sessions || s.wallpaper !== p.wallpaper) {
      if (profileTimer) clearTimeout(profileTimer);
      profileTimer = setTimeout(() => {
        profileTimer = null;
        const u = useNet.getState().user;
        if (u) void pushProfile(fb, u);
      }, 8000);
    }
  });
}

async function pushProfile(fb: FBMod, user: NetUser) {
  const s = useApp.getState();
  await fb.saveProfile({
    userId: user.uid,
    displayName: (s.name || user.name).slice(0, 80),
    ...(user.email ? { email: user.email.slice(0, 120) } : {}),
    tickets: Math.max(0, Math.floor(s.tickets)),
    totalMinutesFocused: s.sessions.reduce((a, x) => a + x.minutes, 0),
    currentActivity: (s.tasks.find((t) => t.id === s.focus.taskId)?.title ?? '').slice(0, 80),
    avatarConfigJson: JSON.stringify({ avatar: s.avatar, pet: s.pet, petName: s.petName }).slice(0, 2048),
    deskConfigJson: JSON.stringify({ deskDecor: s.deskDecor, wallpaper: s.wallpaper }).slice(0, 2048),
    unlockedItemsJson: JSON.stringify(s.unlocked).slice(0, 4096),
  }).catch((e) => console.warn('[profile save]', e));
}

function safeJson<T>(s?: string): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

// ---------------------------------------------------------------- room presence + chat
function currentRoomKey() {
  const s = useApp.getState();
  return roomKey(s.theme, s.server);
}

function startRoom(fb: FBMod) {
  const key = currentRoomKey();
  if (presenceRoom === key && stopPresence) return;
  stopRoom();
  presenceRoom = key;
  const me = useNet.getState().user!;
  stopPresence = fb.listenPresence(key, (list) => {
    const others = list.filter((p) => p.userId !== me.uid);
    useUI.getState().set({ online: { count: list.length || 1, signedIn: true } });
    const g = game();
    if (!g) return;
    g.setRemotes(others.map((p) => {
      const av = safeJson<{ avatar?: AvatarConfig; pet?: PetKind; petName?: string }>(p.avatarConfigJson);
      return {
        id: p.userId,
        name: p.userName,
        kind: 'remote' as const,
        avatar: av?.avatar ?? useApp.getState().avatar,
        pet: av?.pet ?? 'none',
        deskIndex: p.deskIndex >= 0 && p.deskIndex <= 7 ? p.deskIndex : undefined,
        status: p.status ?? '',
        x: p.x ?? 2, z: p.z ?? 13, facing: p.facing ?? 0,
        anim: (p.anim as AnimState) ?? 'idle',
        bubble: p.bubble && p.bubbleAt && Date.now() - p.bubbleAt < 6000 ? p.bubble : undefined,
      };
    }));
  });
  stopChat = fb.listenRoomChat(key, (msgs) => {
    const ui = useUI.getState();
    for (const m of msgs) {
      if (Date.now() - m.timestamp > 60 * 60_000) continue;
      if (ui.chat.some((c) => c.id === m.id)) continue;
      ui.pushChat({ id: m.id, from: m.senderName, fromId: m.senderId, text: m.message, at: m.timestamp });
    }
  });
  if (!loopTimer) loopTimer = setInterval(() => void presenceTick(), 1000);
}

function stopRoom() {
  const u = useNet.getState().user;
  const oldRoom = presenceRoom;
  if (oldRoom && u) void loadFB().then((fb) => fb.deletePresence(oldRoom, u.uid));
  stopPresence?.();
  stopChat?.();
  stopPresence = null;
  stopChat = null;
  presenceRoom = null;
  lastSig = '';
}

async function presenceTick() {
  const u = useNet.getState().user;
  const g = game();
  if (!u || !g?.player) return;
  const fb = await loadFB();
  if (presenceRoom !== currentRoomKey()) {
    startRoom(fb);
    useUI.getState().set({ chat: [] });
  }
  const s = useApp.getState();
  const snap = g.playerSnapshot();
  const task = s.tasks.find((t) => t.id === s.focus.taskId);
  const status = s.focus.running && s.focus.mode === 'focus' ? `Focusing${task ? ` · ${task.title}` : ''}` : s.focus.running ? 'On a break ☕' : '';
  const b = bubble && Date.now() - bubble.at < 6000 ? bubble : null;
  const sig = JSON.stringify([snap.x, snap.z, snap.facing, snap.anim, status, s.name, s.avatar, s.pet, s.deskIndex, b?.at]);
  const now = Date.now();
  if (sig === lastSig && now - lastWrite < 25_000) return;
  if (now - lastWrite < 900) return;
  lastSig = sig;
  lastWrite = now;
  const minutesToday = s.sessions.filter((x) => new Date(x.at).toDateString() === new Date().toDateString()).reduce((a, x) => a + x.minutes, 0);
  await fb.writePresence({
    roomId: presenceRoom!,
    userId: u.uid,
    userName: (s.name || u.name).slice(0, 80) || 'Coworker',
    deskIndex: s.deskIndex ?? 10,
    avatarConfigJson: JSON.stringify({ avatar: s.avatar, pet: s.pet, petName: s.petName }).slice(0, 2048),
    status: status.slice(0, 120),
    currentTask: (task?.title ?? '').slice(0, 120),
    focusMinutesToday: minutesToday,
    tickets: Math.floor(s.tickets),
    lastSeen: now,
    x: snap.x, z: snap.z, facing: snap.facing, anim: snap.anim,
    ...(b ? { bubble: b.text.slice(0, 120), bubbleAt: b.at } : {}),
  }).catch((e) => console.warn('[presence write]', (e as Error).message));
}

export async function publishChat(text: string) {
  bubble = { text, at: Date.now() };
  const u = useNet.getState().user;
  if (!u || !presenceRoom) return false;
  const fb = await loadFB();
  await fb.sendRoomChat({ roomId: presenceRoom, senderId: u.uid, senderName: (useApp.getState().name || u.name).slice(0, 80), message: text.slice(0, 500) }).catch(() => undefined);
  return true;
}

export async function sendDirect(toId: string, toName: string, text: string) {
  const u = useNet.getState().user;
  if (!u) return 'Sign in to send messages.';
  const fb = await loadFB();
  try {
    await fb.sendDM({ senderId: u.uid, senderName: (useApp.getState().name || u.name).slice(0, 80), recipientId: toId, recipientName: toName.slice(0, 80), text: text.slice(0, 1000) });
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

export async function markRead(id: string) {
  const fb = await loadFB();
  await fb.markDMRead(id).catch(() => undefined);
}

export async function watchNotes() {
  const fb = await loadFB();
  return fb.listenNotes((notes) => useNet.getState().set({ notes }));
}

export async function postNote(text: string, category: string) {
  const u = useNet.getState().user;
  if (!u) return 'Sign in to pin a note.';
  const fb = await loadFB();
  try {
    await fb.addNote({ userId: u.uid, authorName: (useApp.getState().name || u.name).slice(0, 80), text: text.slice(0, 500), category: category.slice(0, 50) });
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

// leave the room cleanly and flush unsaved profile changes when the tab goes away
function flushProfile() {
  const u = useNet.getState().user;
  if (!u || !profileTimer || !fbPromise) return;
  clearTimeout(profileTimer);
  profileTimer = null;
  void fbPromise.then((fb) => pushProfile(fb, u));
}
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushProfile(); });
  window.addEventListener('pagehide', () => {
    flushProfile();
    const u = useNet.getState().user;
    const room = presenceRoom;
    if (u && room && fbPromise) void fbPromise.then((fb) => fb.deletePresence(room, u.uid));
  });
}

void today;
