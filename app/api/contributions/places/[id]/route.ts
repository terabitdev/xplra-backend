import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { action, reviewNote, adminUid } = await req.json();
    const contributionId = params.id;

    const contributionRef = adminDb.collection('contributions_places').doc(contributionId);
    const contributionDoc = await contributionRef.get();

    if (!contributionDoc.exists) {
      return NextResponse.json(
        { error: 'Contribution not found' },
        { status: 404 }
      );
    }

    const contributionData = contributionDoc.data();

    if (action === 'approve') {
      // Create place in main places collection
      const placeId = `place_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const placeDraft = contributionData?.placeDraft || {};

      const newPlace = {
        placeId,
        name: placeDraft.name || '',
        geo: placeDraft.geo || { lat: 0, lng: 0 },
        geohash: '', // Would calculate geohash here
        categories: placeDraft.categories || [],
        address: placeDraft.address,
        source: 'user_contribution' as const,
        status: 'active' as const,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await adminDb.collection('places').doc(placeId).set(newPlace);

      // Update contribution status
      await contributionRef.update({
        status: 'approved',
        reviewedBy: adminUid,
        reviewNote: reviewNote || '',
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ message: 'Contribution approved and place created' });
    } else if (action === 'reject') {
      // Update contribution status
      await contributionRef.update({
        status: 'rejected',
        reviewedBy: adminUid,
        reviewNote: reviewNote || '',
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ message: 'Contribution rejected' });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('Review contribution error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to review contribution';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const contributionId = params.id;

    const contributionRef = adminDb.collection('contributions_places').doc(contributionId);
    const contributionDoc = await contributionRef.get();

    if (!contributionDoc.exists) {
      return NextResponse.json(
        { error: 'Contribution not found' },
        { status: 404 }
      );
    }

    await contributionRef.delete();

    return NextResponse.json({
      message: 'Contribution deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Delete contribution error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete contribution';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
