import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  orderBy,
  limit,
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
