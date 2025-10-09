import { NextResponse } from 'next/server';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
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

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Create user using Firebase client SDK
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    const uid = userCredential.user.uid;

    // Create user document in Firestore users collection
    try {
      await adminDb.collection('users').doc(uid).set({
        uid,
        email: userCredential.user.email,
        displayName: email.split('@')[0], // Use email prefix as initial display name
        photoURL: null,
        type: 'Admin', // Set default type as Admin
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (firestoreError) {
      console.error('Error creating user document in Firestore:', firestoreError);
      // Continue even if Firestore fails - user is still created in Auth
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        token: idToken,
        uid,
        email: userCredential.user.email,
      }
    });
  } catch (error: any) {
    console.error('Sign up error:', error);

    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 400 }
    );
  }
}
