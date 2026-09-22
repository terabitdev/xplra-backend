import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { AchievementDefinition } from '@/lib/domain/models/achievementDefinition';

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
