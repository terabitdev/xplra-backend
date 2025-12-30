/**
 * XP Enforcement Utilities
 * Quest cooldowns and daily XP caps
 */

import { adminDb } from '../firebase-admin';
import { CanCompleteQuestResponse } from '../domain/models/userQuestCompletion';
import { DAILY_XP_CAP, isDailyReset } from './xpCalculations';

/**
 * Check if user can complete a quest based on cooldown
 */
export async function canCompleteQuest(
  uid: string,
  questId: string,
  cooldownSeconds: number
): Promise<CanCompleteQuestResponse> {
  try {
    // Query for latest completion of this quest by this user
    const completionsRef = adminDb
      .collection('user_quest_completions')
      .where('uid', '==', uid)
      .where('questId', '==', questId)
      .orderBy('completedAt', 'desc')
      .limit(1);

    const snapshot = await completionsRef.get();

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
  } catch (error) {
    console.error('Error checking quest cooldown:', error);
    throw error;
  }
}

/**
 * Check if user has reached daily XP cap
 */
export async function canEarnDailyXp(
  uid: string,
  xpToEarn: number
): Promise<{ canEarn: boolean; reason?: string; remainingCap?: number }> {
  try {
    // Get user's current daily XP
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { canEarn: false, reason: 'User not found' };
    }

    const userData = userDoc.data();
    let dailyXpEarned = userData?.dailyXpEarned || 0;
    const lastDailyReset = userData?.lastDailyReset ? new Date(userData.lastDailyReset) : null;

    // Check if daily reset is needed
    if (isDailyReset(lastDailyReset)) {
      dailyXpEarned = 0; // Reset daily counter
    }

    const remainingCap = DAILY_XP_CAP - dailyXpEarned;

    if (xpToEarn > remainingCap) {
      return {
        canEarn: false,
        reason: `Daily XP cap reached. You can earn ${remainingCap} more XP today (max ${DAILY_XP_CAP} per day)`,
        remainingCap,
      };
    }

    return {
      canEarn: true,
      remainingCap,
    };
  } catch (error) {
    console.error('Error checking daily XP cap:', error);
    throw error;
  }
}

/**
 * Record quest completion
 */
export async function recordQuestCompletion(
  uid: string,
  questId: string,
  xpEarned: number,
  cooldownSeconds: number
): Promise<void> {
  const now = new Date();
  const nextEligibleAt = new Date(now.getTime() + cooldownSeconds * 1000);
  const completionId = `${uid}_${questId}_${now.getTime()}`;

  await adminDb.collection('user_quest_completions').doc(completionId).set({
    completionId,
    uid,
    questId,
    completedAt: now.toISOString(),
    xpEarned,
    nextEligibleAt: nextEligibleAt.toISOString(),
  });
}

/**
 * Update user's daily XP counter
 */
export async function updateDailyXp(
  uid: string,
  xpEarned: number
): Promise<{ dailyXpEarned: number; wasReset: boolean }> {
  const userRef = adminDb.collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();
  let dailyXpEarned = userData?.dailyXpEarned || 0;
  const lastDailyReset = userData?.lastDailyReset ? new Date(userData.lastDailyReset) : null;
  const now = new Date();

  // Check if daily reset is needed
  const wasReset = isDailyReset(lastDailyReset);
  if (wasReset) {
    dailyXpEarned = 0;
  }

  dailyXpEarned += xpEarned;

  return { dailyXpEarned, wasReset };
}
