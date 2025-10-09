import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

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

    // Create user using Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: false,
    });

    // Create a custom token for immediate login
    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    return NextResponse.json({
      message: 'User created successfully',
      token: customToken,
      uid: userRecord.uid,
      email: userRecord.email,
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
