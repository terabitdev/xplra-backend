import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate the reset link server-side only — it must never reach the
    // client. Until an email service is wired up, this is logged for an
    // admin to relay manually; see TODO below.
    try {
      const resetLink = await adminAuth.generatePasswordResetLink(email);
      // TODO: send `resetLink` via an actual email provider once one is
      // chosen/configured. Logged server-side only in the meantime.
      console.log(`Password reset requested for ${email}: ${resetLink}`);
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
