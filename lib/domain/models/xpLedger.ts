/**
 * XP Ledger Entry Model
 * Immutable transaction log for all XP changes
 */

export type XpLedgerType =
  | "quest_complete"
  | "quest_first_completion_bonus"
  | "place_contribution_approved"
  | "daily_login"
  | "admin_adjustment"
  | "referral_bonus"
  | "achievement_unlock";

export interface XpLedgerEntry {
  /** Unique ledger entry ID */
  entryId: string;

  /** User who received/lost XP */
  uid: string;

  /** Amount of XP (positive or negative) */
  xpDelta: number;

  /** Running total after this transaction */
  xpTotalAfter: number;

  /** Type of transaction */
  type: XpLedgerType;

  /** Related entity ID (questId, placeId, etc.) */
  relatedEntityId?: string;

  /** Human-readable description */
  description: string;

  /** Idempotency key to prevent duplicates */
  idempotencyKey: string;

  /** Admin UID if manual adjustment */
  adminUid?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;

  /** Timestamp */
  createdAt?: string;
}

/**
 * Request body for creating XP ledger entry
 */
export interface CreateXpLedgerRequest {
  uid: string;
  xpDelta: number;
  type: XpLedgerType;
  relatedEntityId?: string;
  description: string;
  idempotencyKey: string;
  adminUid?: string;
  metadata?: Record<string, any>;
}

/**
 * User XP Summary (for user document)
 */
export interface UserXpSummary {
  /** Current XP total */
  xpTotal: number;

  /** All-time XP earned (excludes negative adjustments) */
  xpEarnedAllTime: number;

  /** Last XP transaction timestamp */
  lastXpUpdate?: string;
}
