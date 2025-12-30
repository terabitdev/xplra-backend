/**
 * User Quest Completion Model
 * Tracks when users complete quests for cooldown enforcement
 */

export interface UserQuestCompletion {
  /** Composite ID: {uid}_{questId}_{timestamp} */
  completionId: string;

  /** User who completed the quest */
  uid: string;

  /** Quest that was completed */
  questId: string;

  /** Timestamp of completion */
  completedAt: string;

  /** XP earned for this completion */
  xpEarned: number;

  /** Next eligible completion time (based on cooldown) */
  nextEligibleAt: string;
}

/**
 * Request to check if user can complete quest
 */
export interface CanCompleteQuestRequest {
  uid: string;
  questId: string;
  cooldownSeconds: number;
}

/**
 * Response for quest completion eligibility
 */
export interface CanCompleteQuestResponse {
  canComplete: boolean;
  reason?: string;
  nextEligibleAt?: string;
  lastCompletedAt?: string;
}
