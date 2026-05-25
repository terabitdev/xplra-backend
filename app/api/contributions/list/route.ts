import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Place } from '@/lib/domain/models/place';

type Tab = 'all' | 'pending' | 'approved' | 'rejected';

const APPROVED_TAB_STATUSES = ['approved', 'active', 'hidden'];

function statusFilterForTab(tab: Tab): { type: 'none' | 'eq' | 'in'; values: string[] } {
  switch (tab) {
    case 'pending': return { type: 'eq', values: ['pending'] };
    case 'rejected': return { type: 'eq', values: ['rejected'] };
    case 'approved': return { type: 'in', values: APPROVED_TAB_STATUSES };
    case 'all':
    default: return { type: 'none', values: [] };
  }
}

function buildQuery(tab: Tab): FirebaseFirestore.Query {
  let q: FirebaseFirestore.Query = adminDb
    .collection('places')
    .where('source', '==', 'user_contribution');
  const filter = statusFilterForTab(tab);
  if (filter.type === 'eq') {
    q = q.where('status', '==', filter.values[0]);
  } else if (filter.type === 'in') {
    q = q.where('status', 'in', filter.values);
  }
  return q.orderBy('createdAt', 'desc');
}

function normalizeDoc(doc: FirebaseFirestore.QueryDocumentSnapshot): Place {
  const data = doc.data();
  const geopoint = data.geo?.geopoint;
  const geo = geopoint
    ? { lat: geopoint.latitude, lng: geopoint.longitude }
    : (data.geo?.lat !== undefined ? { lat: data.geo.lat, lng: data.geo.lng } : { lat: 0, lng: 0 });

  return {
    placeId: data.placeId || doc.id,
    name: data.name || '',
    geo,
    geohash: data.geo?.geohash || data.geohash || '',
    categorySelections: data.categorySelections || (data.categoryIds ? data.categoryIds.map((id: string) => ({ selectedId: id, path: [id] })) : []),
    categoryIds: data.categoryIds || undefined,
    location: data.location,
    description: data.description,
    source: data.source || 'user_contribution',
    status: data.status || 'pending',
    type: data.type || 'checkin_time',
    requirements: data.requirements || {},
    xp: data.xp || 0,
    validationConfigId: data.validationConfigId || undefined,
    validationConfig: data.validationConfig || undefined,
    imageUrls: data.imageUrls || [],
    userId: data.userId || undefined,
    contributionXp: typeof data.contributionXp === 'number' ? data.contributionXp : undefined,
    rejectionReason: data.rejectionReason || undefined,
    originalContributionId: data.originalContributionId || undefined,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
  } as Place;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = (searchParams.get('tab') || 'pending') as Tab;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '12', 10)));

    const baseQuery = buildQuery(tab);

    const countSnap = await baseQuery.count().get();
    const total = countSnap.data().count;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    const offset = (page - 1) * limit;
    let pageSnap: FirebaseFirestore.QuerySnapshot;
    if (offset > 0) {
      pageSnap = await baseQuery.offset(offset).limit(limit).get();
    } else {
      pageSnap = await baseQuery.limit(limit).get();
    }

    const data = pageSnap.docs.map(normalizeDoc);

    const uniqueUserIds = Array.from(
      new Set(data.map((p) => p.userId).filter((u): u is string => !!u)),
    );

    const submitterMap: Record<string, { displayName: string | null }> = {};
    if (uniqueUserIds.length > 0) {
      const userSnaps = await Promise.all(
        uniqueUserIds.map((uid) => adminDb.collection('users').doc(uid).get()),
      );
      userSnaps.forEach((snap, i) => {
        const u = snap.data() || {};
        submitterMap[uniqueUserIds[i]] = { displayName: u.displayName || u.name || null };
      });
    }

    return NextResponse.json({
      data,
      submitters: submitterMap,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: unknown) {
    console.error('Contributions list error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch contributions';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
