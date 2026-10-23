import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, inMemoryPersistence, initializeAuth, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-spv-booklet';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

// Persistent cache: attendance sheets and grids remain usable offline at the fire station.
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Secondary, non-persisted Auth instance used by the administrator to create accounts
// without being signed out of their own session (no Admin SDK on the free Spark plan).
export const accountCreationAuth: Auth = initializeAuth(initializeApp(firebaseConfig, 'account-creation'), {
  persistence: inMemoryPersistence,
});

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectAuthEmulator(accountCreationAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
