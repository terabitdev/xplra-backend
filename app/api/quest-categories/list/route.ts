import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { QuestCategory } from '@/lib/domain/models/questCategory';

let categoriesCache: { data: QuestCategory[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skipCache = searchParams.get('fresh') === 'true';

    const now = Date.now();
    if (!skipCache && categoriesCache && (now - categoriesCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        data: categoriesCache.data,
        cached: true,
      });
    }

    const snapshot = await adminDb.collection('questCategories')
      .orderBy('priority', 'asc')
      .get();

    const categories: QuestCategory[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        priority: data.priority,
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || '',
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || '',
      };
    });

    categoriesCache = { data: categories, timestamp: now };

    return NextResponse.json({
      data: categories,
      cached: false,
    });
  } catch (error: unknown) {
    console.error('Get quest categories error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch quest categories';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
