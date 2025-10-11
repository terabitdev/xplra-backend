import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Quest } from '@/lib/domain/models/quest';

export async function GET() {
  try {
    // Get all admin quest documents
    const adminQuestsSnapshot = await adminDb.collection('adminQuests').get();

    const allQuests: Quest[] = [];

    // Iterate through each admin document and collect all quests
    adminQuestsSnapshot.forEach((doc) => {
      const data = doc.data();
      const quests = data.quests || [];

      // Add all quests from this admin
      quests.forEach((quest: Quest) => {
        allQuests.push(quest);
      });
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
