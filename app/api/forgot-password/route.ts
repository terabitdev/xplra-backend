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

    // Generate password reset link
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    // In production, you would send this link via email
    // For now, we'll just return it
    return NextResponse.json({
      message: 'Password reset link generated',
      resetLink, // Remove this in production, send via email instead
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);

    if (error.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'No user found with this email' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate reset link' },
      { status: 400 }
    );
  }
}
