import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { CreateXpLedgerRequest, XpLedgerEntry } from '@/lib/domain/models/xpLedger';
import { FieldValue } from 'firebase-admin/firestore';
import { canCompleteQuest, canEarnDailyXp, recordQuestCompletion, updateDailyXp } from '@/lib/utils/xpEnforcement';
import { calculateLevel } from '@/lib/utils/xpCalculations';

export async function POST(req: NextRequest) {
  try {
    const body: CreateXpLedgerRequest = await req.json();
    const { uid, xpDelta, type, relatedEntityId, description, idempotencyKey, adminUid, metadata } = body;

    // Validate required fields
    if (!uid || xpDelta === undefined || !type || !description || !idempotencyKey) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, xpDelta, type, description, idempotencyKey' },
        { status: 400 }
      );
    }

    // Check for duplicate idempotency key
    const existingEntry = await adminDb
      .collection('xp_ledger')
      .where('idempotencyKey', '==', idempotencyKey)
      .limit(1)
      .get();

    if (!existingEntry.empty) {
      return NextResponse.json(
        { error: 'Duplicate transaction: idempotency key already exists', entry: existingEntry.docs[0].data() },
        { status: 409 }
      );
    }

    // ===== XP ENFORCEMENT RULES =====
    // Only enforce for positive XP (not admin adjustments that remove XP)
    if (xpDelta > 0) {
      // 1. Check daily XP cap
      const dailyCapCheck = await canEarnDailyXp(uid, xpDelta);
      if (!dailyCapCheck.canEarn) {
        return NextResponse.json(
          { error: dailyCapCheck.reason, remainingCap: dailyCapCheck.remainingCap },
          { status: 429 }
        );
      }

      // 2. Check quest cooldown (only for quest completions)
      if (type === 'quest_complete' && relatedEntityId) {
        // Get quest cooldown from metadata
        const questCooldown = metadata?.cooldownSeconds || 0;

        if (questCooldown > 0) {
          const cooldownCheck = await canCompleteQuest(uid, relatedEntityId, questCooldown);
          if (!cooldownCheck.canComplete) {
            return NextResponse.json(
              {
                error: cooldownCheck.reason,
                nextEligibleAt: cooldownCheck.nextEligibleAt,
                lastCompletedAt: cooldownCheck.lastCompletedAt
              },
              { status: 429 }
            );
          }
        }
      }
    }

    // Get user's current XP total
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const currentXpTotal = userData?.xpTotal || 0;
    const newXpTotal = currentXpTotal + xpDelta;

    // Prevent negative XP
    if (newXpTotal < 0) {
      return NextResponse.json(
        { error: `Cannot apply ${xpDelta} XP: would result in negative balance (current: ${currentXpTotal})` },
        { status: 400 }
      );
    }

    // Create ledger entry
    const entryId = `xp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const entry: XpLedgerEntry = {
      entryId,
      uid,
      xpDelta,
      xpTotalAfter: newXpTotal,
      type,
      relatedEntityId,
      description,
      idempotencyKey,
      adminUid,
      metadata,
      createdAt: new Date().toISOString(),
    };

    // ===== CALCULATE LEVEL AND DAILY XP =====
    const newLevel = calculateLevel(newXpTotal);

    // Update daily XP counter
    const { dailyXpEarned, wasReset } = await updateDailyXp(uid, xpDelta > 0 ? xpDelta : 0);

    // Batch write: update user XP and create ledger entry
    const batch = adminDb.batch();

    // Update user XP with level and daily tracking
    const xpEarnedDelta = xpDelta > 0 ? xpDelta : 0; // Only count positive deltas
    const userUpdate: any = {
      xpTotal: newXpTotal,
      xpEarnedAllTime: FieldValue.increment(xpEarnedDelta),
      level: newLevel,
      dailyXpEarned,
      lastXpUpdate: FieldValue.serverTimestamp(),
    };

    // Update daily reset timestamp if it was reset
    if (wasReset) {
      userUpdate.lastDailyReset = FieldValue.serverTimestamp();
    }

    batch.update(userRef, userUpdate);

    // Create ledger entry
    const ledgerRef = adminDb.collection('xp_ledger').doc(entryId);
    batch.set(ledgerRef, {
      ...entry,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // ===== RECORD QUEST COMPLETION =====
    // Record quest completion for cooldown tracking (only for quest completions)
    if (type === 'quest_complete' && relatedEntityId && xpDelta > 0) {
      const questCooldown = metadata?.cooldownSeconds || 0;
      await recordQuestCompletion(uid, relatedEntityId, xpDelta, questCooldown);
    }

    return NextResponse.json({
      success: true,
      entry,
      newXpTotal,
    });
  } catch (error: unknown) {
    console.error('Error creating XP ledger entry:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
