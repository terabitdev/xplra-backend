import { NextResponse } from 'next/server';
import { verifyPasswordResetCode } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/lib/firebase';

function friendlyError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/expired-action-code':
        return 'This reset link has expired. Please request a new one.';
      case 'auth/invalid-action-code':
        return 'This reset link is invalid or has already been used.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'We could not find an account for this reset link.';
    }
  }
  return 'This reset link is invalid or has expired.';
}

export async function POST(req: Request) {
  try {
    const { oobCode } = await req.json();

    if (!oobCode || typeof oobCode !== 'string') {
      return NextResponse.json({ error: 'Missing reset code' }, { status: 400 });
    }

    const email = await verifyPasswordResetCode(auth, oobCode);
    return NextResponse.json({ email });
  } catch (error: unknown) {
    console.error('Verify reset code error:', error);
    return NextResponse.json({ error: friendlyError(error) }, { status: 400 });
  }
}
