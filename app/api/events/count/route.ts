import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/utils/requireAdmin';

export async function GET(req: Request) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const snap = await adminDb.collection('events').count().get();
    return NextResponse.json({ count: snap.data().count });
  } catch (error: unknown) {
    console.error('Events count error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to count events';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
