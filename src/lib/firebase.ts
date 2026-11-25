import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseAppletConfig {
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

const config = firebaseConfig as FirebaseAppletConfig;

export const isFirebaseGoogleConfigured = Boolean(
  config?.apiKey &&
    config?.projectId &&
    config.projectId !== 'remixed-project-id' &&
    config?.authDomain
);

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

function getFirebaseAuthInstance(): Auth {
  if (!isFirebaseGoogleConfigured) {
    throw new Error('Firebase Authentication is not configured for this workspace.');
  }
  if (!cachedApp) {
    cachedApp = getApps().length ? getApp() : initializeApp(config);
  }
  if (!cachedAuth) {
    cachedAuth = getAuth(cachedApp);
  }
  return cachedAuth;
}

export async function signInWithGooglePopup(): Promise<string> {
  const auth = getFirebaseAuthInstance();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();

  // Application sessions are managed via the server-issued JOBSHIELD bearer token.
  await signOut(auth).catch(() => {});
  return idToken;
}
