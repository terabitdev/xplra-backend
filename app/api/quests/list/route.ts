import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Quest } from '@/lib/domain/models/quest';

let questsCache: { data: Quest[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000;

function parseGeoPoint(geoField: Record<string, unknown> | null | undefined): { lat: number; lng: number } {
  if (!geoField) return { lat: 0, lng: 0 };
  const gp = geoField.geopoint as { latitude?: number; longitude?: number } | null;
  if (gp) return { lat: gp.latitude ?? 0, lng: gp.longitude ?? 0 };
  return { lat: (geoField.lat as number) ?? 0, lng: (geoField.lng as number) ?? 0 };
}

function parseContextPillSettings(raw: Record<string, unknown> | null | undefined) {
  if (!raw) return null;
  const fromTs = (v: unknown) => {
    if (!v) return null;
    const ts = v as { toDate?: () => Date };
    return ts.toDate ? ts.toDate().toISOString() : String(v);
  };
  return {
    nearbyEligible: Boolean(raw.nearbyEligible),
    todayEligible: Boolean(raw.todayEligible),
    todaySettings: raw.todaySettings
      ? { ...(raw.todaySettings as object), startDateTime: fromTs((raw.todaySettings as Record<string,unknown>).startDateTime), endDateTime: fromTs((raw.todaySettings as Record<string,unknown>).endDateTime) }
      : null,
    limitedEligible: Boolean(raw.limitedEligible),
    limitedSettings: raw.limitedSettings
      ? { ...(raw.limitedSettings as object), startDateTime: fromTs((raw.limitedSettings as Record<string,unknown>).startDateTime), endDateTime: fromTs((raw.limitedSettings as Record<string,unknown>).endDateTime) }
      : null,
    eventEligible: Boolean(raw.eventEligible),
    eventSettings: raw.eventSettings || null,
    featuredEligible: Boolean(raw.featuredEligible),
    featuredSettings: raw.featuredSettings
      ? { startDateTime: fromTs((raw.featuredSettings as Record<string,unknown>).startDateTime), endDateTime: fromTs((raw.featuredSettings as Record<string,unknown>).endDateTime) }
      : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skipCache = searchParams.get('fresh') === 'true';
    const now = Date.now();

    if (!skipCache && questsCache && now - questsCache.timestamp < CACHE_DURATION) {
      const total = questsCache.data.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      return NextResponse.json({
        data: questsCache.data.slice(startIndex, startIndex + limit),
        pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
        cached: true,
      });
    }

    const snap = await adminDb.collection('questCatalogue').get();
    const allQuests: Quest[] = [];

    snap.forEach((doc) => {
      const d = doc.data();
      allQuests.push({
        id: d.id || doc.id,
        categoryId: d.categoryId || '',
        title: d.title || '',
        description: d.description || '',
        xp: d.xp ?? 0,
        type: d.type || 'checkin',
        isActive: d.isActive ?? true,
        visibility: { hideAfterOneTimeCompletion: d.visibility?.hideAfterOneTimeCompletion ?? false },
        placeId: d.placeId || null,
        location: d.location || '',
        geoOverride: d.geoOverride ? parseGeoPoint(d.geoOverride) : null,
        resolvedGeo: parseGeoPoint(d.resolvedGeo),
        validationConfigId: d.validationConfigId || null,
        validationConfig: d.validationConfig || null,
        contextPillSettings: parseContextPillSettings(d.contextPillSettings),
        createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString() || d.updatedAt,
      });
    });

    questsCache = { data: allQuests, timestamp: now };

    const total = allQuests.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;

    return NextResponse.json({
      data: allQuests.slice(startIndex, startIndex + limit),
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      cached: false,
    });
  } catch (error: unknown) {
    console.error('Get quests error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch quests';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
