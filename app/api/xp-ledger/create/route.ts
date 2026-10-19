import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { CreateXpLedgerRequest, XpLedgerEntry } from '@/lib/domain/models/xpLedger';
import { FieldValue } from 'firebase-admin/firestore';
import {
  buildQuestCompletionRecord,
  canCompleteQuest,
  canEarnDailyXp,
  computeDailyXpUpdate,
} from '@/lib/utils/xpEnforcement';
import { loadPublishedConfigCached } from '@/lib/utils/xpEngineConfigStore';
import { getLevelProgressFromXp } from '@/lib/utils/xpEngineCurve';
import { verifyAdminRequest } from '@/lib/utils/requireAdmin';
import { isFirestoreTimestamp } from '@/lib/utils/firestoreTimestamp';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body: CreateXpLedgerRequest = await req.json();
    const { uid, xpDelta, type, relatedEntityId, description, idempotencyKey, metadata } = body;
    // Audit attribution always comes from the verified token, never the body.
    const adminUid = auth.uid;

    // Validate required fields
    if (!uid || xpDelta === undefined || !type || !description || !idempotencyKey) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, xpDelta, type, description, idempotencyKey' },
        { status: 400 }
      );
    }

    // Level is always resolved from the published XP Engine curve (binary
    // search against its threshold table), never a separate formula — see
    // lib/utils/xpEngineCurve.ts. The daily cap also comes from here, not a
    // hardcoded constant.
    const xpEngineConfig = await loadPublishedConfigCached();
    const dailyCap = xpEngineConfig?.limits?.daily_xp_cap_hard ?? Infinity;

    const entryId = `xp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const userRef = adminDb.collection('users').doc(uid);
    const ledgerRef = adminDb.collection('xp_ledger').doc(entryId);
    const duplicateQuery = adminDb.collection('xp_ledger').where('idempotencyKey', '==', idempotencyKey).limit(1);

    // Everything below — the duplicate check, the enforcement checks, the
    // balance read, and every write — runs inside one transaction. Without
    // this, two concurrent grants can both read the same starting balance,
    // both pass their checks, and the second write silently overwrites the
    // first's XP instead of adding to it (Firestore retries a transaction
    // automatically on write contention, so this is what actually makes
    // concurrent distinct grants both survive).
    const result = await adminDb.runTransaction(async (transaction) => {
      const [duplicateSnap, userSnap] = await Promise.all([
        transaction.get(duplicateQuery),
        transaction.get(userRef),
      ]);

      if (!duplicateSnap.empty) {
        return { kind: 'error' as const, status: 409, error: 'Duplicate transaction: idempotency key already exists', entry: duplicateSnap.docs[0].data() };
      }

      if (!userSnap.exists) {
        return { kind: 'error' as const, status: 404, error: 'User not found' };
      }

      const userData = userSnap.data();
      const currentXpTotal = userData?.xpTotal || 0;
      const currentDailyXpEarned = userData?.dailyXpEarned || 0;
      // lastDailyReset is written via FieldValue.serverTimestamp() below, so
      // reading it back gives a Firestore Timestamp object, not a string —
      // new Date(timestampObject) silently produces an Invalid Date, which
      // made isDailyReset() always return true after the first grant each
      // day, resetting dailyXpEarned on every subsequent grant instead of
      // accumulating it.
      const rawLastDailyReset = userData?.lastDailyReset;
      const lastDailyReset = isFirestoreTimestamp(rawLastDailyReset)
        ? rawLastDailyReset.toDate()
        : rawLastDailyReset
        ? new Date(rawLastDailyReset)
        : null;

      // ===== XP ENFORCEMENT RULES =====
      // Only enforce for positive XP (not admin adjustments that remove XP)
      if (xpDelta > 0) {
        const dailyCapCheck = canEarnDailyXp(currentDailyXpEarned, lastDailyReset, xpDelta, dailyCap);
        if (!dailyCapCheck.canEarn) {
          return { kind: 'error' as const, status: 429, error: dailyCapCheck.reason, remainingCap: dailyCapCheck.remainingCap };
        }

        if (type === 'quest_complete' && relatedEntityId) {
          const questCooldown = metadata?.cooldownSeconds || 0;
          if (questCooldown > 0) {
            const cooldownCheck = await canCompleteQuest(transaction, uid, relatedEntityId, questCooldown);
            if (!cooldownCheck.canComplete) {
              return {
                kind: 'error' as const,
                status: 429,
                error: cooldownCheck.reason,
                nextEligibleAt: cooldownCheck.nextEligibleAt,
                lastCompletedAt: cooldownCheck.lastCompletedAt,
              };
            }
          }
        }
      }

      const newXpTotal = currentXpTotal + xpDelta;
      if (newXpTotal < 0) {
        return {
          kind: 'error' as const,
          status: 400,
          error: `Cannot apply ${xpDelta} XP: would result in negative balance (current: ${currentXpTotal})`,
        };
      }

      const progress = xpEngineConfig ? getLevelProgressFromXp(newXpTotal, xpEngineConfig) : null;
      const newLevel = progress?.level ?? userData?.level ?? 1;

      // Firestore rejects `undefined` field values outright — only include
      // the optional fields when the caller actually provided them.
      const entry: XpLedgerEntry = {
        entryId,
        uid,
        xpDelta,
        xpTotalAfter: newXpTotal,
        type,
        description,
        idempotencyKey,
        adminUid,
        createdAt: new Date().toISOString(),
        ...(relatedEntityId !== undefined ? { relatedEntityId } : {}),
        ...(metadata !== undefined ? { metadata } : {}),
        ...(xpEngineConfig ? { configVersion: xpEngineConfig.version } : {}),
      };

      const xpEarnedDelta = xpDelta > 0 ? xpDelta : 0; // Only count positive deltas
      const { dailyXpEarned, wasReset } = computeDailyXpUpdate(currentDailyXpEarned, lastDailyReset, xpEarnedDelta);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userUpdate: any = {
        xpTotal: newXpTotal,
        xpEarnedAllTime: FieldValue.increment(xpEarnedDelta),
        level: newLevel,
        dailyXpEarned,
        lastXpUpdate: FieldValue.serverTimestamp(),
      };
      if (wasReset) {
        userUpdate.lastDailyReset = FieldValue.serverTimestamp();
      }

      transaction.update(userRef, userUpdate);
      transaction.set(ledgerRef, { ...entry, createdAt: FieldValue.serverTimestamp() });

      if (type === 'quest_complete' && relatedEntityId && xpDelta > 0) {
        const questCooldown = metadata?.cooldownSeconds || 0;
        const { completionId, data } = buildQuestCompletionRecord(uid, relatedEntityId, xpDelta, questCooldown);
        transaction.set(adminDb.collection('user_quest_completions').doc(completionId), data);
      }

      return { kind: 'ok' as const, entry, newXpTotal };
    });

    if (result.kind === 'error') {
      const { kind, status, ...rest } = result;
      return NextResponse.json(rest, { status });
    }

    return NextResponse.json({
      success: true,
      entry: result.entry,
      newXpTotal: result.newXpTotal,
    });
  } catch (error: unknown) {
    console.error('Error creating XP ledger entry:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
