/**
 * XP Enforcement Utilities
 * Quest cooldowns and daily XP caps
 *
 * All reads here accept a Firestore `Transaction` and use `transaction.get()`
 * instead of a bare `.get()`. app/api/xp-ledger/create wraps the duplicate
 * check, these checks, and the actual balance/ledger write in a single
 * transaction — otherwise two concurrent grants can both read the same
 * starting balance/daily-counter, both pass these checks, and the second
 * write silently overwrites the first's XP instead of adding to it.
 */

import { adminDb } from '../firebase-admin';
import type { Transaction } from 'firebase-admin/firestore';
import { CanCompleteQuestResponse } from '../domain/models/userQuestCompletion';
import { isDailyReset } from './xpCalculations';

/**
 * Check if user can complete a quest based on cooldown
 */
export async function canCompleteQuest(
  transaction: Transaction,
  uid: string,
  questId: string,
  cooldownSeconds: number
): Promise<CanCompleteQuestResponse> {
  const completionsRef = adminDb
    .collection('user_quest_completions')
    .where('uid', '==', uid)
    .where('questId', '==', questId)
    .orderBy('completedAt', 'desc')
    .limit(1);

  const snapshot = await transaction.get(completionsRef);

  if (snapshot.empty) {
    // User has never completed this quest
    return { canComplete: true };
  }

  const lastCompletion = snapshot.docs[0].data();
  const lastCompletedAt = new Date(lastCompletion.completedAt);
  const nextEligibleAt = new Date(lastCompletedAt.getTime() + cooldownSeconds * 1000);
  const now = new Date();

  if (now < nextEligibleAt) {
    return {
      canComplete: false,
      reason: `Quest is on cooldown. Try again in ${Math.ceil((nextEligibleAt.getTime() - now.getTime()) / 1000)} seconds`,
      nextEligibleAt: nextEligibleAt.toISOString(),
      lastCompletedAt: lastCompletedAt.toISOString(),
    };
  }

  return {
    canComplete: true,
    lastCompletedAt: lastCompletedAt.toISOString(),
  };
}

/**
 * Check if user has reached the daily XP cap. `dailyCap` must come from the
 * published XP Engine config (limits.daily_xp_cap_hard) — this used to be a
 * hardcoded 1000, completely disconnected from the admin-configured caps.
 */
export function canEarnDailyXp(
  dailyXpEarned: number,
  lastDailyReset: Date | null,
  xpToEarn: number,
  dailyCap: number
): { canEarn: boolean; reason?: string; remainingCap?: number } {
  const effectiveDailyXpEarned = isDailyReset(lastDailyReset) ? 0 : dailyXpEarned;
  const remainingCap = dailyCap - effectiveDailyXpEarned;

  if (xpToEarn > remainingCap) {
    return {
      canEarn: false,
      reason: `Daily XP cap reached. You can earn ${remainingCap} more XP today (max ${dailyCap} per day)`,
      remainingCap,
    };
  }

  return { canEarn: true, remainingCap };
}

/**
 * Build the quest-completion record to write inside the same transaction as
 * the grant, so a completion is never recorded without its XP (or vice
 * versa).
 */
export function buildQuestCompletionRecord(uid: string, questId: string, xpEarned: number, cooldownSeconds: number) {
  const now = new Date();
  const nextEligibleAt = new Date(now.getTime() + cooldownSeconds * 1000);
  const completionId = `${uid}_${questId}_${now.getTime()}`;
  return {
    completionId,
    data: {
      completionId,
      uid,
      questId,
      completedAt: now.toISOString(),
      xpEarned,
      nextEligibleAt: nextEligibleAt.toISOString(),
    },
  };
}

/**
 * Pure calculation of the new daily XP counter — callers already hold the
 * current value from a transactional read.
 */
export function computeDailyXpUpdate(
  dailyXpEarned: number,
  lastDailyReset: Date | null,
  xpEarned: number
): { dailyXpEarned: number; wasReset: boolean } {
  const wasReset = isDailyReset(lastDailyReset);
  const base = wasReset ? 0 : dailyXpEarned;
  return { dailyXpEarned: base + xpEarned, wasReset };
}
