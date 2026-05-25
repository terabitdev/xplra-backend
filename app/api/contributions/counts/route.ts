import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const APPROVED_TAB_STATUSES = ['approved', 'active', 'hidden'];

async function countFor(filter: 'all' | 'pending' | 'approved' | 'rejected'): Promise<number> {
  let q: FirebaseFirestore.Query = adminDb
    .collection('places')
    .where('source', '==', 'user_contribution');
  if (filter === 'pending') q = q.where('status', '==', 'pending');
  else if (filter === 'rejected') q = q.where('status', '==', 'rejected');
  else if (filter === 'approved') q = q.where('status', 'in', APPROVED_TAB_STATUSES);
  const snap = await q.count().get();
  return snap.data().count;
}

export async function GET() {
  try {
    const [all, pending, approved, rejected] = await Promise.all([
      countFor('all'),
      countFor('pending'),
      countFor('approved'),
      countFor('rejected'),
    ]);
    return NextResponse.json({ all, pending, approved, rejected });
  } catch (error: unknown) {
    console.error('Contributions counts error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to load counts';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
