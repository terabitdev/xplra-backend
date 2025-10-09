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

    // Verify user credentials using Admin SDK
    const user = await adminAuth.getUserByEmail(email);

    // Create a custom token for the user
    const customToken = await adminAuth.createCustomToken(user.uid);

    return NextResponse.json({
      token: customToken,
      uid: user.uid,
      email: user.email
    });
  } catch (error: any) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: error.message || 'Invalid credentials' },
      { status: 401 }
    );
  }
}
