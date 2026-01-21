import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Quest } from '@/lib/domain/models/quest';

// In-memory cache
let questsCache: { data: Quest[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skipCache = searchParams.get('fresh') === 'true';

    const now = Date.now();

    // Check cache
    if (!skipCache && questsCache && (now - questsCache.timestamp) < CACHE_DURATION) {
      const total = questsCache.data.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedData = questsCache.data.slice(startIndex, startIndex + limit);

      return NextResponse.json({
        data: paginatedData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        cached: true,
      });
    }

    // Fetch from Firestore
    const questsSnapshot = await adminDb.collection('adminQuests').get();

    const allQuests: Quest[] = [];

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

    // Update cache
    questsCache = { data: allQuests, timestamp: now };

    // Apply pagination
    const total = allQuests.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedData = allQuests.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      cached: false,
    });
  } catch (error: any) {
    console.error('Get quests error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quests' },
      { status: 500 }
    );
  }
}
