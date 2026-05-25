import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source');
    const statusesCsv = searchParams.get('statuses');
    const status = searchParams.get('status');

    let query: FirebaseFirestore.Query = adminDb.collection('places');
    if (source) query = query.where('source', '==', source);
    if (status) query = query.where('status', '==', status);

    const statuses = statusesCsv
      ? statusesCsv.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    if (statuses && statuses.length > 0) {
      const counts = await Promise.all(
        statuses.map(async (st) => {
          let q: FirebaseFirestore.Query = adminDb.collection('places');
          if (source) q = q.where('source', '==', source);
          q = q.where('status', '==', st);
          const snap = await q.count().get();
          return snap.data().count;
        }),
      );
      const total = counts.reduce((sum, n) => sum + n, 0);
      return NextResponse.json({ count: total });
    }

    const snap = await query.count().get();
    return NextResponse.json({ count: snap.data().count });
  } catch (error: unknown) {
    console.error('Places count error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to count places';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
