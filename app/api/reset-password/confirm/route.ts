import { NextResponse } from 'next/server';
import { confirmPasswordReset } from 'firebase/auth';
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
      case 'auth/weak-password':
        return 'Please choose a stronger password (at least 8 characters).';
    }
  }
  return 'Something went wrong. Please try again.';
}

export async function POST(req: Request) {
  try {
    const { oobCode, newPassword } = await req.json();

    if (!oobCode || typeof oobCode !== 'string') {
      return NextResponse.json({ error: 'Missing reset code' }, { status: 400 });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    await confirmPasswordReset(auth, oobCode, newPassword);
    return NextResponse.json({ message: 'Password has been reset successfully.' });
  } catch (error: unknown) {
    console.error('Confirm password reset error:', error);
    return NextResponse.json({ error: friendlyError(error) }, { status: 400 });
  }
}
