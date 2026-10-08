// Firebase client (lazy-loaded). Uses the existing Firestore collections and
// security rules from firestore.rules — no rule changes needed.
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail, signOut, onAuthStateChanged, type User,
} from 'firebase/auth';
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, onSnapshot, query, where, orderBy, limit, documentId,
} from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

const app = getApps().length ? getApp() : initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId);
const google = new GoogleAuthProvider();
google.setCustomParameters({ prompt: 'select_account' });

export type { User };

export const onAuth = (fn: (u: User | null) => void) => onAuthStateChanged(auth, fn);
export const signInGoogle = async () => (await signInWithPopup(auth, google)).user;
export const signInEmail = async (email: string, pass: string) => (await signInWithEmailAndPassword(auth, email, pass)).user;
export const signUpEmail = async (email: string, pass: string, name: string) => {
  const r = await createUserWithEmailAndPassword(auth, email, pass);
  if (name) await updateProfile(r.user, { displayName: name });
  return r.user;
};
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);
export const logOut = () => signOut(auth);

// ---------------------------------------------------------------- profile
export interface CloudProfile {
  userId: string;
  displayName: string;
  email?: string;
  tickets: number;
  totalMinutesFocused: number;
  currentActivity?: string;
  avatarConfigJson?: string;
  deskConfigJson?: string;
  unlockedItemsJson?: string;
  updatedAt?: string;
  createdAt?: string;
}

export async function loadProfile(uid: string): Promise<CloudProfile | null> {
  const s = await getDoc(doc(db, 'users', uid));
  return s.exists() ? (s.data() as CloudProfile) : null;
}

export async function saveProfile(p: CloudProfile) {
  await setDoc(doc(db, 'users', p.userId), { ...p, updatedAt: new Date().toISOString() }, { merge: true });
}

// ---------------------------------------------------------------- presence
export interface Presence {
  presenceId?: string;
  roomId: string;
  userId: string;
  userName: string;
  deskIndex: number; // 0..10 (10 = no desk)
  avatarConfigJson?: string;
  status?: string;
  currentTask?: string;
  focusMinutesToday?: number;
  tickets?: number;
  lastSeen: number;
  // extra fields (allowed by the rules) for spatial sync
  x?: number;
  z?: number;
  facing?: number;
  anim?: string;
  bubble?: string;
  bubbleAt?: number;
}

export async function writePresence(p: Presence) {
  const id = `${p.roomId}_${p.userId}`;
  await setDoc(doc(db, 'room_presences', id), { ...p, presenceId: id, lastSeen: Date.now() }, { merge: true });
}

export async function deletePresence(roomId: string, uid: string) {
  await deleteDoc(doc(db, 'room_presences', `${roomId}_${uid}`)).catch(() => undefined);
}

export function listenPresence(roomId: string, fn: (list: Presence[]) => void) {
  const q = query(collection(db, 'room_presences'), where('roomId', '==', roomId));
  return onSnapshot(q, (snap) => {
    const now = Date.now();
    fn(
      snap.docs
        .map((d) => d.data() as Presence)
        .filter((p) => {
          const t = typeof p.lastSeen === 'number' ? p.lastSeen : new Date(p.lastSeen as unknown as string).getTime();
          return now - t < 90_000;
        }),
    );
  }, (e) => console.warn('[presence]', e.message));
}

// ---------------------------------------------------------------- room chat
export interface RoomChat {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export async function sendRoomChat(m: Omit<RoomChat, 'id' | 'timestamp'>) {
  const id = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  await setDoc(doc(db, 'room_chats', id), { ...m, id, timestamp: Date.now() });
}

export function listenRoomChat(roomId: string, fn: (list: RoomChat[]) => void) {
  const base = collection(db, 'room_chats');
  let unsub = onSnapshot(
    query(base, where('roomId', '==', roomId), orderBy(documentId(), 'desc'), limit(40)),
    (snap) => fn(snap.docs.map((d) => d.data() as RoomChat).sort((a, b) => a.timestamp - b.timestamp)),
    () => {
      // fall back to an unordered query if the index is missing
      unsub = onSnapshot(query(base, where('roomId', '==', roomId)), (snap) =>
        fn(snap.docs.map((d) => d.data() as RoomChat).sort((a, b) => a.timestamp - b.timestamp).slice(-40)),
      );
    },
  );
  return () => unsub();
}

// ---------------------------------------------------------------- direct messages
export interface DM {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  text: string;
  createdAt: number;
  read?: boolean;
}

export async function sendDM(m: Omit<DM, 'id' | 'createdAt'>) {
  const id = `dm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await setDoc(doc(db, 'direct_messages', id), { ...m, id, messageId: id, content: m.text, createdAt: Date.now(), timestamp: Date.now(), read: false });
}

export async function markDMRead(id: string) {
  await setDoc(doc(db, 'direct_messages', id), { read: true }, { merge: true });
}

export function listenDMs(uid: string, fn: (list: DM[]) => void) {
  const col = collection(db, 'direct_messages');
  let sent: DM[] = [];
  let recv: DM[] = [];
  const emit = () => {
    const map = new Map<string, DM>();
    for (const m of [...sent, ...recv]) map.set(m.id, { ...m, text: m.text || (m as unknown as { content?: string }).content || '' });
    fn([...map.values()].sort((a, b) => a.createdAt - b.createdAt));
  };
  const u1 = onSnapshot(query(col, where('senderId', '==', uid)), (s) => { sent = s.docs.map((d) => d.data() as DM); emit(); }, () => undefined);
  const u2 = onSnapshot(query(col, where('recipientId', '==', uid)), (s) => { recv = s.docs.map((d) => d.data() as DM); emit(); }, () => undefined);
  return () => { u1(); u2(); };
}

// ---------------------------------------------------------------- café notes board (public read)
export interface CafeNote {
  id: string;
  userId: string;
  authorName: string;
  text: string;
  category?: string;
  createdAt: string;
}

export function listenNotes(fn: (list: CafeNote[]) => void) {
  return onSnapshot(collection(db, 'cafe_notes'), (snap) => {
    fn(snap.docs.map((d) => ({ ...(d.data() as CafeNote), id: d.id })).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)).slice(0, 40));
  }, (e) => console.warn('[notes]', e.message));
}

export async function addNote(n: Omit<CafeNote, 'id' | 'createdAt'>) {
  const id = `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  await setDoc(doc(db, 'cafe_notes', id), { ...n, createdAt: new Date().toISOString() });
}
