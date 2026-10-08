import { initializeApp } from 'firebase/app';
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, User, linkWithPopup, signOut 
} from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, getDocFromServer, FirestoreError, deleteDoc, getDocs, updateDoc, limit } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

let writeBackoffUntil = 0;

export function isWriteBackoffActive(): boolean {
  return Date.now() < writeBackoffUntil;
}

export function triggerWriteBackoff(delayMs = 45000) {
  writeBackoffUntil = Math.max(writeBackoffUntil, Date.now() + delayMs);
  console.warn(`[Firestore] Write stream circuit breaker active for ${Math.round(delayMs / 1000)}s.`);
}

export function cleanFirestoreData<T>(input: T): T {
  if (input === undefined) {
    return null as unknown as T;
  }
  if (input === null || typeof input !== 'object') {
    // Truncate excessively large base64 data URLs to prevent exceeding 1MB document limits
    if (typeof input === 'string' && input.length > 500000 && input.startsWith('data:')) {
      return '' as unknown as T;
    }
    return input;
  }
  // Preserve Date instances
  if (input instanceof Date) {
    return input;
  }
  // Preserve Firestore FieldValue tokens (serverTimestamp, deleteField, arrayUnion, etc.)
  if ((input as any)?._methodName || (input as any)?.toMillis || (input as any)?.isEqual) {
    return input;
  }
  if (Array.isArray(input)) {
    return input
      .filter(item => item !== undefined)
      .map(item => cleanFirestoreData(item)) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(input as Record<string, any>)) {
    if (val !== undefined) {
      cleaned[key] = cleanFirestoreData(val);
    }
  }
  return cleaned as T;
}

export async function safeSetDoc(docRef: any, data: any, options: any = { merge: true }): Promise<boolean> {
  if (isWriteBackoffActive()) {
    return false;
  }
  try {
    const cleaned = cleanFirestoreData(data);
    await setDoc(docRef, cleaned, options);
    return true;
  } catch (err: any) {
    const msg = err?.message || String(err);
    const code = err?.code || '';
    if (code === 'resource-exhausted' || msg.includes('resource-exhausted') || msg.includes('backoff') || msg.includes('Write stream exhausted')) {
      triggerWriteBackoff(60000);
      return false;
    }
    console.warn('[Firestore safeSetDoc caught]:', msg);
    return false;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();


export { 
  signInWithPopup, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, collection, doc, getDoc, setDoc, onSnapshot, query, where, orderBy, addDoc, 
  serverTimestamp, deleteDoc, linkWithPopup, getDocs, updateDoc, limit, signOut
};
export type { User, FirestoreError };
