import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Quest } from '@/lib/domain/models/quest';

export async function GET() {
  try {
    const questsRef = adminDb.collection('quests');
    const snapshot = await questsRef.get();

    const quests: Quest[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Filter out quests with a userId property (only public quests)
      if (!data.userId || data.userId === '') {
        quests.push({ id: doc.id, ...data } as Quest);
      }
    });

    return NextResponse.json(quests);
  } catch (error: any) {
    console.error('Get quests error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quests' },
      { status: 500 }
    );
  }
}
