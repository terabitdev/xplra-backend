import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const placeId = params.id;
    const body = await req.json();
    const contributionXp = Number(body?.contributionXp);

    if (!Number.isFinite(contributionXp) || contributionXp < 0) {
      return NextResponse.json({ error: 'Invalid contributionXp' }, { status: 400 });
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
      return NextResponse.json({ error: 'Rejected contributions cannot be approved' }, { status: 400 });
    }

    await ref.update({
      status: 'approved',
      contributionXp,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ message: 'Contribution approved', placeId, contributionXp });
  } catch (error: unknown) {
    console.error('Approve contribution error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to approve';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
