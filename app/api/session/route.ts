import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(token);

    return NextResponse.json({
      valid: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
    });
  } catch (error: any) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token', valid: false },
      { status: 401 }
    );
  }
}
