import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// In-memory cache
let usersCache: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 60 seconds

/**
 * Joins `playerAchievements` -> `achievementDefinitions` to attach each
 * user's assigned badges (id + title, enough for the Users table; the full
 * definition is fetched on demand when an admin opens the badge's detail
 * modal). Only runs over the current page of users, not the full cached
 * list, so it stays cheap regardless of user count.
 */
async function attachBadges(users: any[]) {
  if (users.length === 0) return users;

  const uids = users.map((u) => u.uid);
  const chunks: string[][] = [];
  for (let i = 0; i < uids.length; i += 10) chunks.push(uids.slice(i, i + 10));

  const paSnaps = await Promise.all(
    chunks.map((chunk) => adminDb.collection('playerAchievements').where('uid', 'in', chunk).get())
  );

  const defIds = new Set<string>();
  paSnaps.forEach((snap) => snap.docs.forEach((doc) => defIds.add(doc.data().achievementDefinitionId)));

  if (defIds.size === 0) return users.map((u) => ({ ...u, badges: [] }));

  const defDocs = await Promise.all(
    Array.from(defIds).map((id) => adminDb.collection('achievementDefinitions').doc(id).get())
  );
  const titleById: Record<string, string> = {};
  defDocs.forEach((doc) => {
    if (doc.exists) titleById[doc.id] = doc.data()?.title || 'Untitled';
  });

  const badgesByUid: Record<string, { id: string; title: string; assignedAt: string | null }[]> = {};
  paSnaps.forEach((snap) =>
    snap.docs.forEach((doc) => {
      const data = doc.data();
      const title = titleById[data.achievementDefinitionId];
      if (!title) return;
      (badgesByUid[data.uid] ||= []).push({
        id: data.achievementDefinitionId,
        title,
        assignedAt: data.assignedAt?.toDate?.()?.toISOString() || null,
      });
    })
  );

  return users.map((u) => ({ ...u, badges: badgesByUid[u.uid] || [] }));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skipCache = searchParams.get('fresh') === 'true';

    const now = Date.now();

    // Check cache
    if (!skipCache && usersCache && (now - usersCache.timestamp) < CACHE_DURATION) {
      const total = usersCache.data.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedData = await attachBadges(usersCache.data.slice(startIndex, startIndex + limit));

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
    const snapshot = await adminDb
      .collection('users')
      .orderBy('createdAt', 'desc')
      .get();

    const users = snapshot.docs.map((doc: any) => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      lastXpUpdate: doc.data().lastXpUpdate?.toDate?.()?.toISOString() || doc.data().lastXpUpdate,
    }));

    // Update cache
    usersCache = { data: users, timestamp: now };

    // Apply pagination
    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedData = await attachBadges(users.slice(startIndex, startIndex + limit));

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
    console.error('Error fetching users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
