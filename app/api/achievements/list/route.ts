import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Achievement } from '@/lib/domain/models/achievement';

// In-memory cache
let achievementsCache: { data: Achievement[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skipCache = searchParams.get('fresh') === 'true';
    const now = Date.now();

    // Check cache
    if (!skipCache && achievementsCache && (now - achievementsCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json(achievementsCache.data);
    }

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

    // Update cache
    achievementsCache = { data: allAchievements, timestamp: now };

    return NextResponse.json(allAchievements);
  } catch (error: any) {
    console.error('Get achievements error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

// Invalidate cache after mutations
export function invalidateAchievementsCache() {
  achievementsCache = null;
}
