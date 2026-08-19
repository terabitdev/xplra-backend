/**
 * XP Engine Config Model
 * Mirrors Firestore document: config/xp-engine (and its draft counterpart)
 */

export interface XpCurveConfig {
  type: string;
  base: number;
  growth: number;
  power: number;
  min_xp_to_next: number;
  max_xp_to_next: number;
  /** Per-node multiplier, keyed by node number as a string, e.g. { "11": 1.08 } */
  node_boost: Record<string, number>;
}

export interface XpEngineLimits {
  daily_xp_cap_soft: number;
  daily_xp_cap_hard: number;
  grant_rate_limit_per_min: number;
  soft_cap_dampening: number;
}

export interface XpEngineSourceCaps {
  event_checkin_per_day: number;
  place_checkin_per_day: number;
  promo_per_day: number;
}

export interface XpEngineMembershipMultipliers {
  free: number;
  go: number;
  go_plus: number;
  spark: number;
}

export interface XpEngineStreakMultiplier {
  enabled: boolean;
  per_active_day: number;
  cap: number;
}

export interface XpEngineMultipliers {
  global_multiplier_cap: number;
  membership: XpEngineMembershipMultipliers;
  streak: XpEngineStreakMultiplier;
}

export interface XpEngineNode {
  node: number;
  levels: number;
}

/** Raw shape as stored in Firestore */
export interface XpEngineConfigDoc {
  curve: XpCurveConfig;
  limits: XpEngineLimits;
  source_caps: XpEngineSourceCaps;
  multipliers: XpEngineMultipliers;
  nodes: XpEngineNode[];
  published: boolean;
  updated_at: string | null;
  updated_by: string;
  version: number;
}

/** A single "key point" sample on the XP curve */
export interface XpEngineCurveKeyPoint {
  level: number;
  xpToNext: number;
  cumulativeXp: number;
}

/** Server-computed summary shown on the Overview tab */
export interface XpEngineComputedSummary {
  maxLevel: number;
  totalXpToMaxLevel: number;
  keyPoints: XpEngineCurveKeyPoint[];
  warnings: string[];
}

export interface XpEngineConfigResponse extends XpEngineConfigDoc {
  computed: XpEngineComputedSummary;
}

export interface XpEngineConfigApiResponse {
  published: XpEngineConfigResponse | null;
  draft: XpEngineConfigResponse | null;
  /** Number of archived versions in config/xp_engine/versions — drives the "Rollback" button. */
  versionHistoryCount: number;
}

/** A snapshot archived to config/xp_engine/versions/{version} when a newer config is published. */
export interface XpEngineConfigVersion extends XpEngineConfigDoc {
  /** Timestamp (ISO) this snapshot was superseded / archived. */
  archived_at: string | null;
}
