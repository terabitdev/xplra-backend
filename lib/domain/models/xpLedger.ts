/**
 * XP model for the admin panel's "Adjust XP" feature.
 *
 * The panel no longer writes XP itself — the only write path is the game's
 * grantManualXp Cloud Function (see lib/utils/grantManualXp.ts). History
 * lives in the player's own users/{uid}/xp_ledger subcollection, which the
 * panel only ever reads.
 */

/** Request body the panel sends to POST /api/xp-ledger/grant-manual. */
export interface GrantManualXpRequest {
  uid: string;
  amount: number;
  reason: string;
  requestId: string;
  relatedEntityId?: string;
}

/**
 * A ledger entry as read back from users/{uid}/xp_ledger. The game owns this
 * document's shape; fields beyond `id`/`createdAt` are read defensively
 * (optional) since the panel doesn't author this schema.
 */
export interface XpLedgerEntry {
  id: string;
  createdAt: string | null;
  amount?: number;
  xp_awarded?: number;
  xp_requested?: number;
  reason?: string;
  transactionType?: string;
  relatedEntityId?: string;
  requestId?: string;
  createdBy?: string;
  [key: string]: unknown;
}

/** The player XP fields the game owns and the panel only ever reads. */
export interface UserXpSummary {
  xp_total: number;
  level: number;
  node: number | null;
  xp_into_level: number | null;
  xp_to_next: number | null;
}
