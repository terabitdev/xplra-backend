/**
 * XP and Level Calculation Utilities
 */

/**
 * Calculate user level from total XP
 * Simple formula: Level = floor(sqrt(xpTotal / 100))
 * Level 1 = 100 XP, Level 2 = 400 XP, Level 3 = 900 XP, etc.
 */
export function calculateLevel(xpTotal: number): number {
  if (xpTotal < 0) return 0;
  return Math.floor(Math.sqrt(xpTotal / 100));
}

/**
 * Calculate XP required for a specific level
 */
export function xpRequiredForLevel(level: number): number {
  return level * level * 100;
}

/**
 * Calculate XP required to reach next level
 */
export function xpToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const nextLevelXp = xpRequiredForLevel(currentLevel + 1);
  return nextLevelXp - currentXp;
}

/**
 * Daily XP cap configuration
 */
export const DAILY_XP_CAP = 1000; // Maximum XP per day

/**
 * Check if daily reset is needed (new day)
 */
export function isDailyReset(lastResetTimestamp: Date | null): boolean {
  if (!lastResetTimestamp) return true;

  const now = new Date();
  const lastReset = new Date(lastResetTimestamp);

  // Reset at midnight UTC
  return now.getUTCDate() !== lastReset.getUTCDate() ||
         now.getUTCMonth() !== lastReset.getUTCMonth() ||
         now.getUTCFullYear() !== lastReset.getUTCFullYear();
}
