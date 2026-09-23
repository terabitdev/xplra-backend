import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { AchievementDefinition } from '@/lib/domain/models/achievementDefinition';

// This handler reads no request data, so Next.js would otherwise cache it
// as a static response at build time on Vercel — freezing the list at
// whatever it was when the app was deployed. Force it dynamic so every
// request re-reads Firestore.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('achievementDefinitions').orderBy('sort_order', 'asc').get();

    const definitions: AchievementDefinition[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || '',
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || '',
      } as AchievementDefinition;
    });

    return NextResponse.json({ data: definitions });
  } catch (error: unknown) {
    console.error('Get achievement definitions error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch achievement definitions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
