import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Event } from '@/lib/domain/models/event';

let eventsCache: { data: Event[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 60 seconds

function normalizeEventDoc(doc: FirebaseFirestore.QueryDocumentSnapshot): Event {
  const data = doc.data();

  const toIso = (val: unknown): string | undefined => {
    if (!val) return undefined;
    if (typeof val === 'object' && 'toDate' in (val as object)) {
      return (val as { toDate: () => Date }).toDate().toISOString();
    }
    return val as string;
  };

  const geopointToGeo = (geoField: unknown) => {
    if (!geoField) return undefined;
    const f = geoField as { geopoint?: { latitude: number; longitude: number }; geohash?: string };
    if (!f.geopoint) return undefined;
    return {
      lat: f.geopoint.latitude,
      lng: f.geopoint.longitude,
      geohash: f.geohash || '',
    };
  };

  return {
    eventId: data.eventId || doc.id,
    title: data.title || '',
    placeId: data.placeId ?? null,
    geoOverride: geopointToGeo(data.geoOverride),
    resolvedGeo: geopointToGeo(data.resolvedGeo),
    startTime: toIso(data.startTime) || '',
    endTime: toIso(data.endTime) || '',
    eventPreGraceMin: data.eventPreGraceMin ?? 15,
    eventPostGraceMin: data.eventPostGraceMin ?? 15,
    windowStart: toIso(data.windowStart),
    windowEnd: toIso(data.windowEnd),
    mode: data.mode ?? undefined,
    validationConfigId: data.validationConfigId ?? null,
    validationConfig: data.validationConfig ?? undefined,
    isActive: data.isActive ?? true,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skipCache = searchParams.get('fresh') === 'true';

    const now = Date.now();
    if (!skipCache && eventsCache && (now - eventsCache.timestamp) < CACHE_DURATION) {
      const total = eventsCache.data.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedData = eventsCache.data.slice(startIndex, startIndex + limit);

      return NextResponse.json({
        data: paginatedData,
        pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
        cached: true,
      });
    }

    const snapshot = await adminDb.collection('events').get();
    const allEvents: Event[] = snapshot.docs.map(normalizeEventDoc);

    eventsCache = { data: allEvents, timestamp: now };

    const total = allEvents.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedData = allEvents.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      data: paginatedData,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      cached: false,
    });
  } catch (error: unknown) {
    console.error('Get events error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch events';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
