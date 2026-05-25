import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snap = await adminDb.collection('events').count().get();
    return NextResponse.json({ count: snap.data().count });
  } catch (error: unknown) {
    console.error('Events count error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to count events';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
