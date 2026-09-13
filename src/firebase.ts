import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocFromServer,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics safely
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  isAnalyticsSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch((err) => {
      console.warn('Firebase Analytics not supported in this environment:', err);
    });
}

// CRITICAL: Initialize Firestore with explicit firestoreDatabaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// --- Error Handling as defined in Firebase Skill ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Ensure anonymous auth if user is not signed in
export async function ensureAuthenticatedUser(): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Anonymous sign in notice:', err);
    if (auth.currentUser) return auth.currentUser;
    throw err;
  }
}

// Connection Validation on Boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is waiting:', error.message);
    }
    return false;
  }
}

// Boot connection test
testConnection();

// --- Auth Helpers ---
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function signUpWithEmail(email: string, pass: string, displayName: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export async function updateUserDisplayName(newDisplayName: string): Promise<void> {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: newDisplayName });
  }
}

export async function resetUserPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// --- Data Types & Firestore APIs ---

export interface FirebaseUserProfile {
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

export interface FirebaseBookshelfBook {
  userId: string;
  bookId: number;
  title: string;
  author: string;
  category?: string;
  status: 'want_to_read' | 'reading' | 'completed';
  notes?: string;
  claimedBonus?: boolean;
  updatedAt?: string;
  createdAt?: string;
}

export interface FirebaseCafeNote {
  id: string;
  userId: string;
  authorName: string;
  text: string;
  category?: string;
  createdAt?: string;
}

export interface FirebaseRoomPresence {
  presenceId?: string;
  roomId: string;
  userId: string;
  userName: string;
  avatarConfigJson?: string;
  deskConfigJson?: string;
  deskIndex: number;
  currentTask?: string;
  status?: string;
  focusMinutesToday?: number;
  tickets?: number;
  reactionEmoji?: string;
  reactionTimestamp?: number;
  lastSeen: string | number;
}

export interface FirebaseFriendship {
  userId: string;
  friendUserId: string;
  friendName: string;
  avatarConfigJson?: string;
  addedAt: string;
}

export interface FirebaseDirectMessage {
  id: string;
  messageId?: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  text: string;
  content?: string;
  timestamp?: number;
  createdAt: number;
  read?: boolean;
}

export interface FirebaseRoomChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  avatarSeed?: string;
  message: string;
  timestamp: number;
}

// --- User Profile APIs ---
export async function saveFirebaseUserProfile(profile: FirebaseUserProfile): Promise<void> {
  const path = `users/${profile.userId}`;
  try {
    const userDocRef = doc(db, 'users', profile.userId);
    await setDoc(userDocRef, {
      ...profile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getFirebaseUserProfile(userId: string): Promise<FirebaseUserProfile | null> {
  const path = `users/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      return docSnap.data() as FirebaseUserProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

// --- Bookshelf APIs ---
export async function saveBookToBookshelf(item: FirebaseBookshelfBook): Promise<void> {
  const path = `users/${item.userId}/books/${item.bookId}`;
  try {
    const bookDocRef = doc(db, 'users', item.userId, 'books', String(item.bookId));
    await setDoc(bookDocRef, {
      ...item,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function loadUserBookshelf(userId: string): Promise<FirebaseBookshelfBook[]> {
  const path = `users/${userId}/books`;
  try {
    const snapshot = await getDocs(collection(db, 'users', userId, 'books'));
    return snapshot.docs.map((d) => d.data() as FirebaseBookshelfBook);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function removeBookFromBookshelf(userId: string, bookId: number): Promise<void> {
  const path = `users/${userId}/books/${bookId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'books', String(bookId)));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Cafe Community Notes ---
export async function addCafeSharedNote(note: Omit<FirebaseCafeNote, 'id' | 'createdAt'>): Promise<void> {
  const id = `note-${Date.now()}`;
  const path = `cafe_notes/${id}`;
  try {
    await setDoc(doc(db, 'cafe_notes', id), {
      ...note,
      id,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// --- Multiplayer Room Presence APIs ---
export async function setRoomPresence(presence: FirebaseRoomPresence): Promise<void> {
  const presenceId = presence.presenceId || `${presence.roomId}_${presence.userId}`;
  const path = `room_presences/${presenceId}`;
  try {
    const docRef = doc(db, 'room_presences', presenceId);
    await setDoc(
      docRef,
      {
        ...presence,
        presenceId,
        lastSeen: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeRoomPresence(roomIdOrPresenceId: string, userId?: string): Promise<void> {
  const presenceId = userId ? `${roomIdOrPresenceId}_${userId}` : roomIdOrPresenceId;
  const path = `room_presences/${presenceId}`;
  try {
    await deleteDoc(doc(db, 'room_presences', presenceId));
  } catch (err) {
    console.warn('Could not remove presence cleanly:', err);
  }
}

export function listenRoomPresences(
  roomId: string,
  onUpdate: (presences: FirebaseRoomPresence[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, 'room_presences');
  const q = query(colRef, where('roomId', '==', roomId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as FirebaseRoomPresence);
      // Filter out stale presences older than 90 seconds
      const now = Date.now();
      const active = list.filter((p) => {
        if (!p.lastSeen) return true;
        const lastMs = typeof p.lastSeen === 'number' ? p.lastSeen : new Date(p.lastSeen).getTime();
        return now - lastMs < 90000;
      });
      onUpdate(active);
    },
    (err) => {
      if (onError) onError(err);
      else console.error('Presence snapshot error:', err);
    }
  );
}

// --- Friends APIs ---
export async function addFriend(friend: FirebaseFriendship): Promise<void> {
  const path = `users/${friend.userId}/friends/${friend.friendUserId}`;
  try {
    const docRef = doc(db, 'users', friend.userId, 'friends', friend.friendUserId);
    await setDoc(docRef, {
      ...friend,
      addedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeFriend(userId: string, friendUserId: string): Promise<void> {
  const path = `users/${userId}/friends/${friendUserId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'friends', friendUserId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function listenFriends(
  userId: string,
  onUpdate: (friends: FirebaseFriendship[]) => void
): () => void {
  const colRef = collection(db, 'users', userId, 'friends');
  return onSnapshot(
    colRef,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as FirebaseFriendship);
      onUpdate(list);
    },
    (err) => {
      console.warn('Friends listener warning:', err);
    }
  );
}

// --- Direct Messages (PMs) APIs ---
export async function sendDirectMessage(
  senderIdOrDm: string | Omit<FirebaseDirectMessage, 'id' | 'createdAt'>,
  senderName?: string,
  recipientId?: string,
  recipientName?: string,
  text?: string
): Promise<void> {
  const messageId = `dm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `direct_messages/${messageId}`;

  let dmData: FirebaseDirectMessage;
  if (typeof senderIdOrDm === 'object') {
    const txt = senderIdOrDm.text || senderIdOrDm.content || '';
    dmData = {
      id: messageId,
      messageId,
      senderId: senderIdOrDm.senderId,
      senderName: senderIdOrDm.senderName,
      recipientId: senderIdOrDm.recipientId,
      recipientName: senderIdOrDm.recipientName,
      text: txt,
      content: txt,
      createdAt: Date.now(),
      timestamp: Date.now(),
      read: false,
    };
  } else {
    const txt = text || '';
    dmData = {
      id: messageId,
      messageId,
      senderId: senderIdOrDm,
      senderName: senderName || 'User',
      recipientId: recipientId || '',
      recipientName: recipientName || '',
      text: txt,
      content: txt,
      createdAt: Date.now(),
      timestamp: Date.now(),
      read: false,
    };
  }

  try {
    const docRef = doc(db, 'direct_messages', messageId);
    await setDoc(docRef, dmData);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function listenUserDirectMessages(
  userId: string,
  onUpdate: (messages: FirebaseDirectMessage[]) => void
): () => void {
  const colRef = collection(db, 'direct_messages');
  const qSent = query(colRef, where('senderId', '==', userId));
  const qRecv = query(colRef, where('recipientId', '==', userId));

  let sentMsgs: FirebaseDirectMessage[] = [];
  let recvMsgs: FirebaseDirectMessage[] = [];

  const mergeAndEmit = () => {
    const map = new Map<string, FirebaseDirectMessage>();
    [...sentMsgs, ...recvMsgs].forEach((m) => {
      const key = m.id || m.messageId || `dm-${Math.random()}`;
      map.set(key, {
        ...m,
        id: key,
        messageId: key,
        text: m.text || m.content || '',
        content: m.text || m.content || '',
        createdAt: m.createdAt || m.timestamp || Date.now(),
        timestamp: m.timestamp || m.createdAt || Date.now(),
      });
    });
    const sorted = Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
    onUpdate(sorted);
  };

  const unsub1 = onSnapshot(qSent, (snap) => {
    sentMsgs = snap.docs.map((d) => d.data() as FirebaseDirectMessage);
    mergeAndEmit();
  }, (err) => console.warn('Sent DMs listener warning:', err));

  const unsub2 = onSnapshot(qRecv, (snap) => {
    recvMsgs = snap.docs.map((d) => d.data() as FirebaseDirectMessage);
    mergeAndEmit();
  }, (err) => console.warn('Recv DMs listener warning:', err));

  return () => {
    unsub1();
    unsub2();
  };
}

// --- Room Chat Messages APIs ---
export async function sendRoomChatMessage(msg: Omit<FirebaseRoomChatMessage, 'id' | 'timestamp'>): Promise<void> {
  const id = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const path = `room_chats/${id}`;
  try {
    const docRef = doc(db, 'room_chats', id);
    await setDoc(docRef, {
      ...msg,
      id,
      timestamp: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export type DirectMessage = FirebaseDirectMessage;
export type RoomPresence = FirebaseRoomPresence;
export type Friendship = FirebaseFriendship;

export async function saveFriendship(
  userId: string,
  userName: string,
  friendUserId: string,
  friendName: string
): Promise<void> {
  return addFriend({
    userId,
    friendUserId,
    friendName,
    addedAt: new Date().toISOString(),
  });
}

export async function deleteFriendship(userId: string, friendUserId: string): Promise<void> {
  return removeFriend(userId, friendUserId);
}

export async function getUserFriends(userId: string): Promise<FirebaseFriendship[]> {
  const colRef = collection(db, 'users', userId, 'friends');
  try {
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as FirebaseFriendship);
  } catch (err) {
    console.warn('Get user friends notice:', err);
    return [];
  }
}

