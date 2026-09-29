import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/achievement-definitions/[id]/users
 *
 * Lists all players so an admin can manually assign this achievement to one.
 * Cross-references `playerAchievements` to mark which users already have it.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const defDoc = await adminDb.collection('achievementDefinitions').doc(params.id).get();
    if (!defDoc.exists) {
      return NextResponse.json({ error: 'Achievement definition not found' }, { status: 404 });
    }

    const [usersSnap, assignedSnap] = await Promise.all([
      adminDb.collection('users').limit(200).get(),
      adminDb.collection('playerAchievements').where('achievementDefinitionId', '==', params.id).get(),
    ]);

    const assignedUids = new Set(assignedSnap.docs.map((d) => d.data().uid as string));

    const users = usersSnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          name: data.displayName || '',
          email: data.email || '',
          photoURL: data.photoURL || '',
          assigned: assignedUids.has(doc.id),
        };
      })
      .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));

    return NextResponse.json({ users });
  } catch (error: unknown) {
    console.error('Get achievement users error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch users';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
