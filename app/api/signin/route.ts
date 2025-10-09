import { NextResponse } from 'next/server';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';

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

    return NextResponse.json({
      token: idToken,
      uid: userCredential.user.uid,
      email: userCredential.user.email
    });
  } catch (error: any) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: error.message || 'Invalid credentials' },
      { status: 401 }
    );
  }
}
