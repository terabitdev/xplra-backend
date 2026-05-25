import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(_req: Request, { params }: { params: { uid: string } }) {
  try {
    const uid = params.uid;
    const snap = await adminDb.collection('users').doc(uid).get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = snap.data() || {};
    return NextResponse.json({
      uid,
      displayName: data.displayName || data.name || null,
      email: data.email || null,
      photoURL: data.photoURL || data.photoUrl || data.avatar || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || null,
    });
  } catch (error: unknown) {
    console.error('Get user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
