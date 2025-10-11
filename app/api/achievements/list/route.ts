import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Achievement } from '@/lib/domain/models/achievement';

export async function GET() {
  try {
    // Get all admin achievement documents
    const adminAchievementsSnapshot = await adminDb.collection('adminAchievements').get();

    const allAchievements: Achievement[] = [];

    // Iterate through each admin document and collect all achievements
    adminAchievementsSnapshot.forEach((doc) => {
      const data = doc.data();
      const achievements = data.achievements || [];

      // Add all achievements from this admin
      achievements.forEach((achievement: Achievement) => {
        allAchievements.push(achievement);
      });
    });

    return NextResponse.json(allAchievements);
  } catch (error: any) {
    console.error('Get achievements error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}
