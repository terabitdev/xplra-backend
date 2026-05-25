import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const placeId = params.id;
    const body = await req.json();
    const rejectionReason = String(body?.rejectionReason || '').trim();

    if (!rejectionReason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const ref = adminDb.collection('places').doc(placeId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }
    const data = snap.data();
    if (data?.source !== 'user_contribution') {
      return NextResponse.json({ error: 'Place is not a user contribution' }, { status: 400 });
    }
    if (data?.status === 'rejected') {
      return NextResponse.json({ error: 'Already rejected' }, { status: 400 });
    }

    await ref.update({
      status: 'rejected',
      rejectionReason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ message: 'Contribution rejected', placeId });
  } catch (error: unknown) {
    console.error('Reject contribution error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to reject';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
