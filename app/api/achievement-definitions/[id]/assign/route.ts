import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/utils/requireAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/achievement-definitions/[id]/assign
 * Requires Authorization: Bearer <admin ID token>.
 * body: { uid: string, assign: boolean }
 *
 * Manually grants or revokes this achievement for a player. Writes to
 * `playerAchievements` (doc id `${achievementDefinitionId}_${uid}`), the
 * source of truth for which players have which achievement definitions.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { uid, assign } = await req.json();
    if (!uid || typeof assign !== 'boolean') {
      return NextResponse.json({ error: 'uid and assign are required' }, { status: 400 });
    }

    const defDoc = await adminDb.collection('achievementDefinitions').doc(params.id).get();
    if (!defDoc.exists) {
      return NextResponse.json({ error: 'Achievement definition not found' }, { status: 404 });
    }

    const docId = `${params.id}_${uid}`;
    const docRef = adminDb.collection('playerAchievements').doc(docId);

    if (assign) {
      await docRef.set({
        achievementDefinitionId: params.id,
        uid,
        source: 'manual',
        assignedBy: auth.uid,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await docRef.delete();
    }

    return NextResponse.json({ assigned: assign });
  } catch (error: unknown) {
    console.error('Assign achievement error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update assignment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
