
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, getDocs, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const getFirebaseErrorCode = (error: unknown) => {
  return typeof error === 'object' && error !== null && 'code' in error
    ? (error as { code?: string }).code
    : null;
};

const REDIRECT_FALLBACK_ERROR_CODES = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
]);

export const getAuthErrorMessage = (error: unknown) => {
  const code = getFirebaseErrorCode(error);

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'La ventana de acceso fue cerrada. Por favor, intenta de nuevo.';
    case 'auth/cancelled-popup-request':
    case 'auth/cancelled-by-user':
      return 'El inicio de sesión fue cancelado.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana emergente. Permite las ventanas emergentes para este sitio o intenta de nuevo.';
    case 'auth/unauthorized-domain':
      return `Este dominio no está autorizado para iniciar sesión con Google. Agrega ${window.location.hostname} en Firebase Authentication > Settings > Authorized domains.`;
    case 'auth/operation-not-supported-in-this-environment':
      return 'Este navegador no permite completar el inicio de sesión con ventana emergente. Intenta de nuevo para usar redirección.';
    case 'auth/network-request-failed':
      return 'No se pudo conectar con Firebase Auth. Revisa tu conexión e intenta de nuevo.';
    default:
      return 'Ocurrió un error al iniciar sesión. Inténtalo de nuevo.';
  }
};

const saveUserProfile = async (user: User) => {
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
    photoURL: user.photoURL || null,
    updatedAt: Date.now(),
    settings: {
      accentColor: 'blue',
      language: 'es'
    }
  }, { merge: true });
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/* 
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
*/

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await saveUserProfile(user);
    
    return user;
  } catch (error) {
    const code = getFirebaseErrorCode(error);
    if (code && REDIRECT_FALLBACK_ERROR_CODES.has(code)) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const completeGoogleRedirectSignIn = async () => {
  const result = await getRedirectResult(auth);
  if (!result?.user) return null;

  await saveUserProfile(result.user);
  return result.user;
};
