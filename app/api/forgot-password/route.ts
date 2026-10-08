import { NextResponse } from 'next/server';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const origin = new URL(req.url).origin;

    try {
      // Firebase sends its own reset email directly — no third-party email
      // provider needed. The link lands the user on our /reset-password
      // page with the oobCode it needs to verify/confirm the reset.
      await sendPasswordResetEmail(auth, email, {
        url: `${origin}/reset-password`,
        handleCodeInApp: true,
      });
    } catch (error: unknown) {
      // Same response whether the account exists or not, so this endpoint
      // can't be used to find out which emails have accounts. Still log the
      // real reason server-side for debugging.
      console.error('Forgot password error:', error);
    }

    return NextResponse.json({
      message: 'If an account exists for this email, a password reset link has been sent.',
    });
  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
