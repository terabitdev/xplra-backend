import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { loadPublishedConfigCached } from '@/lib/utils/xpEngineConfigStore';
import { getLevelProgressFromXp } from '@/lib/utils/xpEngineCurve';

/**
 * GET /api/xp-ledger/balance
 * Get user's XP balance and level information
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user's XP data
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const xpTotal = userData?.xpTotal || 0;
    const xpEarnedAllTime = userData?.xpEarnedAllTime || 0;
    const dailyXpEarned = userData?.dailyXpEarned || 0;
    const lastDailyReset = userData?.lastDailyReset;

    // Level/xpToNextLevel are always recomputed live from xpTotal against
    // the published XP Engine curve — never trusted from the stored `level`
    // field — so this self-corrects for any user whose stored level was
    // written before the engine was wired in, with no backfill needed.
    const xpEngineConfig = await loadPublishedConfigCached();
    const progress = xpEngineConfig ? getLevelProgressFromXp(xpTotal, xpEngineConfig) : null;
    const level = progress?.level ?? userData?.level ?? 1;
    const xpToNextLevelValue = progress?.xpToNext ?? 0;

    return NextResponse.json({
      uid,
      xpTotal,
      xpEarnedAllTime,
      level,
      xpToNextLevel: xpToNextLevelValue,
      dailyXpEarned,
      lastDailyReset,
      lastXpUpdate: userData?.lastXpUpdate,
    });
  } catch (error: unknown) {
    console.error('Error fetching XP balance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
