import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { PlaceContribution } from '@/lib/domain/models/placeContribution';

export async function GET() {
  try {
    const contributionsSnapshot = await adminDb.collection('contributions_places').get();

    const allContributions: PlaceContribution[] = [];

    contributionsSnapshot.forEach((doc) => {
      const data = doc.data();
      allContributions.push({
        contributionId: data.contributionId || doc.id,
        uid: data.uid || '',
        placeDraft: data.placeDraft || {},
        status: data.status || 'pending',
        reviewedBy: data.reviewedBy,
        reviewNote: data.reviewNote,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt,
      } as PlaceContribution);
    });

    return NextResponse.json(allContributions);
  } catch (error: unknown) {
    console.error('Get contributions error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch contributions';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
