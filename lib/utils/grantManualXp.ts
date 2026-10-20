/**
 * Client for the game team's `grantManualXp` Cloud Function — the single
 * XP-granting authority for admin-initiated XP adjustments. The panel no
 * longer writes XP itself; this is the only way the admin panel moves XP.
 * Region us-central1, project xplra-1, same admin check as
 * previewXpConfigImpact (caller's users/{uid}.type === "Admin").
 */

const GRANT_MANUAL_XP_URL =
  process.env.GRANT_MANUAL_XP_URL || "https://us-central1-xplra-1.cloudfunctions.net/grantManualXp";

export type GrantManualXpRewardState = "granted" | "capped" | "none" | "blocked";

export interface GrantManualXpResult {
  reward_state: GrantManualXpRewardState;
  xp_requested: number;
  xp_awarded: number;
  xp_total: number;
  level: number;
  node: number;
  xp_into_level: number;
  xp_to_next: number;
  progress_pct: number;
  level_up: boolean;
  cap_applied: boolean;
  hard_capped: boolean;
  ledger_entry_id: string;
  was_replay: boolean;
}

export interface GrantManualXpParams {
  uid: string;
  amount: number;
  reason: string;
  requestId: string;
  transactionType?: string;
  relatedEntityId?: string;
}

/** Thrown for the callable's error codes (resource-exhausted, already-exists, not-found, invalid-argument, internal, ...). */
export class GrantManualXpError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "GrantManualXpError";
    this.code = code;
  }
}

export async function callGrantManualXp(idToken: string, params: GrantManualXpParams): Promise<GrantManualXpResult> {
  const res = await fetch(GRANT_MANUAL_XP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({
      data: {
        uid: params.uid,
        amount: params.amount,
        reason: params.reason,
        requestId: params.requestId,
        ...(params.transactionType !== undefined ? { transactionType: params.transactionType } : {}),
        ...(params.relatedEntityId !== undefined ? { relatedEntityId: params.relatedEntityId } : {}),
      },
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || json?.error) {
    const err = json?.error ?? {};
    throw new GrantManualXpError(err.status || "unknown", err.message || `grantManualXp request failed (HTTP ${res.status})`);
  }

  return (json?.result ?? json) as GrantManualXpResult;
}
