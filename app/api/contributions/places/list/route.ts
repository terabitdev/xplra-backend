import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { PlaceContribution } from '@/lib/domain/models/placeContribution';

// In-memory cache
let contributionsCache: { data: PlaceContribution[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status');
    const skipCache = searchParams.get('fresh') === 'true';

    const now = Date.now();

    // Check cache
    if (!skipCache && contributionsCache && (now - contributionsCache.timestamp) < CACHE_DURATION) {
      let filteredData = contributionsCache.data;

      // Apply status filter
      if (status) {
        filteredData = filteredData.filter(c => c.status === status);
      }

      const total = filteredData.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedData = filteredData.slice(startIndex, startIndex + limit);

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
    const contributionsSnapshot = await adminDb.collection('contributions_places').get();

    const allContributions: PlaceContribution[] = [];

    contributionsSnapshot.forEach((doc) => {
      const data = doc.data();
      allContributions.push({
        contributionId: data.contributionId || doc.id,
        uid: data.uid || '',
        placeDraft: data.placeDraft || {},
        status: data.status || 'pending',
        reviewedBy: data.reviewedBy,
        reviewNote: data.reviewNote,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt,
      } as PlaceContribution);
    });

    // Update cache
    contributionsCache = { data: allContributions, timestamp: now };

    // Apply status filter
    let filteredData = allContributions;
    if (status) {
      filteredData = filteredData.filter(c => c.status === status);
    }

    // Apply pagination
    const total = filteredData.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedData = filteredData.slice(startIndex, startIndex + limit);

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
  } catch (error: unknown) {
    console.error('Get contributions error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch contributions';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
