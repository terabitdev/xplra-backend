import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Place } from '@/lib/domain/models/place';

// In-memory cache for server-side caching
let placesCache: { data: Place[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status'); // Optional status filter
    const skipCache = searchParams.get('fresh') === 'true';

    // Check cache first
    const now = Date.now();
    if (!skipCache && placesCache && (now - placesCache.timestamp) < CACHE_DURATION) {
      let filteredData = placesCache.data;

      // Apply status filter if provided
      if (status) {
        filteredData = filteredData.filter(p => p.status === status);
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
        cached: true,
      });
    }

    // Fetch from Firestore with only needed fields
    const placesSnapshot = await adminDb.collection('places')
      .orderBy('createdAt', 'desc')
      .get();

    const allPlaces: Place[] = [];

    placesSnapshot.forEach((doc) => {
      const data = doc.data();
      allPlaces.push({
        placeId: data.placeId || doc.id,
        name: data.name || '',
        geo: data.geo || { lat: 0, lng: 0 },
        geohash: data.geohash || '',
        categories: data.categories || [],
        address: data.address,
        description: data.description,
        source: data.source || 'seed',
        status: data.status || 'active',
        type: data.type || 'checkin_time',
        requirements: data.requirements || {},
        imageUrls: data.imageUrls || [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as Place);
    });

    // Update cache
    placesCache = { data: allPlaces, timestamp: now };

    // Apply status filter if provided
    let filteredData = allPlaces;
    if (status) {
      filteredData = filteredData.filter(p => p.status === status);
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
    console.error('Get places error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch places';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Function to invalidate cache (call after create/update/delete)
function invalidatePlacesCache() {
  placesCache = null;
}
