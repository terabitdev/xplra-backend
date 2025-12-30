import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Quest } from '@/lib/domain/models/quest';
import admin from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const questData = await req.json();

    // Generate unique quest ID if not provided
    const questId = questData.questId || `quest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create quest object with new schema
    const newQuest: Quest = {
      questId,
      placeId: questData.placeId || null,
      title: questData.title,
      description: questData.description,
      type: questData.type || 'checkin_time',
      requirements: questData.requirements || {},
      xpReward: questData.xpReward || 0,
      cooldownSeconds: questData.cooldownSeconds || 3600,
      active: questData.active ?? true,
      startAt: questData.startAt || undefined,
      endAt: questData.endAt || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save quest directly to adminQuests collection
    const questDocRef = adminDb.collection('adminQuests').doc(questId);
    await questDocRef.set({
      ...newQuest,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json(newQuest);
  } catch (error: any) {
    console.error('Create quest error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quest' },
      { status: 500 }
    );
  }
}
