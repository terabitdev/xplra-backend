import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Quest } from '@/lib/domain/models/quest';

export async function GET() {
  try {
    // Get all quest documents from adminQuests collection
    const questsSnapshot = await adminDb.collection('adminQuests').get();

    const allQuests: Quest[] = [];

    // Each document is now a quest
    questsSnapshot.forEach((doc) => {
      const data = doc.data();
      allQuests.push({
        questId: data.questId || doc.id,
        placeId: data.placeId || null,
        title: data.title || '',
        description: data.description || '',
        type: data.type || 'checkin_time',
        requirements: data.requirements || {},
        xpReward: data.xpReward || 0,
        cooldownSeconds: data.cooldownSeconds || 3600,
        active: data.active ?? true,
        startAt: data.startAt,
        endAt: data.endAt,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as Quest);
    });

    return NextResponse.json(allQuests);
  } catch (error: any) {
    console.error('Get quests error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quests' },
      { status: 500 }
    );
  }
}
