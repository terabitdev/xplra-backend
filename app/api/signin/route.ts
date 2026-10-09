import { NextResponse } from 'next/server';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { adminDb } from '@/lib/firebase-admin';

// Initialize Firebase client app if not already initialized
if (!getApps().length) {
  const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
  initializeApp(firebaseConfig);
}

const auth = getAuth();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sign in with Firebase client SDK to get ID token
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    const uid = userCredential.user.uid;

    // This panel is admin-only — being a valid Firebase Auth user (e.g. a
    // mobile app player) isn't enough. Reject anyone whose Firestore
    // users/{uid} doc doesn't have type "Admin" before ever handing back a
    // usable token.
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userType = userDoc.data()?.type;
    if (userType?.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { error: 'This account does not have access to the admin panel.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      token: idToken,
      uid,
      email: userCredential.user.email
    });
  } catch (error: any) {
    console.error('Sign in error:', error);

    const errorMessages: Record<string, string> = {
      'auth/invalid-credential': 'Invalid email or password. Please try again.',
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Invalid email or password. Please try again.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/invalid-email': 'Please enter a valid email address.',
    };

    const friendlyMessage = errorMessages[error.code] ?? 'Something went wrong. Please try again.';

    return NextResponse.json(
      { error: friendlyMessage },
      { status: 401 }
    );
  }
}
