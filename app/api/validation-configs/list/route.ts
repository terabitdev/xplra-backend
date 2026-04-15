import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { ValidationConfig } from '@/lib/domain/models/validationConfig';

// In-memory cache
let configsCache: { data: ValidationConfig[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skipCache = searchParams.get('fresh') === 'true';

    // Check cache
    const now = Date.now();
    if (!skipCache && configsCache && (now - configsCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        data: configsCache.data,
        cached: true,
      });
    }

    const snapshot = await adminDb.collection('validationConfigs')
      .orderBy('createdAt', 'desc')
      .get();

    // Fetch all places to count usage per config
    const placesSnapshot = await adminDb.collection('places').get();
    const usageCount: Record<string, number> = {};
    placesSnapshot.docs.forEach((placeDoc) => {
      const configId = placeDoc.data().validationConfigId;
      if (configId) {
        usageCount[configId] = (usageCount[configId] || 0) + 1;
      }
    });

    const configs: ValidationConfig[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        placesCount: usageCount[doc.id] || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || '',
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || '',
      } as ValidationConfig;
    });

    // Update cache
    configsCache = { data: configs, timestamp: now };

    return NextResponse.json({
      data: configs,
      cached: false,
    });
  } catch (error: unknown) {
    console.error('Get validation configs error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch validation configs';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
