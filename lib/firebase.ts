import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const getFirebaseConfig = () => {
  // Try to parse JSON config if available (server-side or if exposed)
  if (process.env.FIREBASE_CONFIG) {
    try {
      return JSON.parse(process.env.FIREBASE_CONFIG);
    } catch (e) {
      console.error('Error parsing FIREBASE_CONFIG:', e);
    }
  }

  // Fallback to NEXT_PUBLIC_ env vars (standard for Next.js client)
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };
  }

  return {};
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

if (!firebaseConfig.apiKey) {
  console.error('Firebase configuration is missing or invalid. Please check your environment variables.');
  console.error('Expected either FIREBASE_CONFIG or NEXT_PUBLIC_FIREBASE_API_KEY etc.');
}

const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, storage };
