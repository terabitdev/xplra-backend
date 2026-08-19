import {
  XpCurveConfig,
  XpEngineConfigDoc,
  XpEngineComputedSummary,
  XpEngineNode,
} from "../domain/models/xpEngineConfig";

/**
 * XP Engine curve math (config/xp-engine, curve.type === "piecewise_power").
 *
 * ASSUMPTION (not yet confirmed against a game-design spec): the per-level
 * XP requirement is modeled as
 *
 *   xpToNext(level) = clamp(base + growth * level^power, min_xp_to_next, max_xp_to_next)
 *                      * nodeBoost(level)
 *
 * where nodeBoost(level) is curve.node_boost[nodeForLevel] (default 1) and
 * nodeForLevel is resolved from the `nodes` array, which lays out how many
 * levels each node spans back-to-back starting at level 1. If the real
 * formula differs, update this file only — everything else reads through it.
 */

interface NodeRange {
  node: number;
  startLevel: number;
  endLevel: number;
}

export function buildNodeRanges(nodes: XpEngineNode[]): NodeRange[] {
  let cursor = 0;
  return nodes.map((n) => {
    const startLevel = cursor + 1;
    const endLevel = cursor + n.levels;
    cursor = endLevel;
    return { node: n.node, startLevel, endLevel };
  });
}

export function getMaxLevel(nodes: XpEngineNode[]): number {
  return nodes.reduce((sum, n) => sum + n.levels, 0);
}

function findNodeRangeForLevel(level: number, ranges: NodeRange[]): NodeRange | undefined {
  return ranges.find((r) => level >= r.startLevel && level <= r.endLevel);
}

function boostForLevel(level: number, ranges: NodeRange[], nodeBoost: Record<string, number>): number {
  const range = findNodeRangeForLevel(level, ranges);
  if (!range) return 1;
  const boost = nodeBoost?.[String(range.node)];
  return typeof boost === "number" ? boost : 1;
}

export function xpToNextForLevel(level: number, curve: XpCurveConfig, ranges: NodeRange[]): number {
  const rawXp = curve.base + curve.growth * Math.pow(level, curve.power);
  const boosted = rawXp * boostForLevel(level, ranges, curve.node_boost || {});
  const clamped = Math.min(Math.max(boosted, curve.min_xp_to_next), curve.max_xp_to_next);
  return Math.round(clamped);
}

/**
 * The 369-level architecture is a locked structural rule (per product decision):
 * admins may redistribute how many levels each node spans, and tune node_boost /
 * curve params, but the total across all nodes must always resolve to this
 * number. Enforced at draft-save time in app/api/admin/xp_engine/draft, not
 * just as a publish-time warning.
 */
export const EXPECTED_MAX_LEVEL = 369;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Validates the config, grouped by the categories the Overview warnings panel calls out. */
function computeWarnings(config: XpEngineConfigDoc, ranges: NodeRange[], maxLevel: number): string[] {
  const warnings: string[] = [];
  const { curve, limits, multipliers, nodes } = config;

  // ---- Invalid level ranges ----
  const seenNodeIds = new Set<number>();
  for (const n of nodes || []) {
    if (!Number.isInteger(n.levels) || n.levels <= 0) {
      warnings.push(`Node ${n.node} has an invalid level count (${n.levels}) — must be a positive integer.`);
    }
    if (!Number.isInteger(n.node) || n.node <= 0) {
      warnings.push(`Node id "${n.node}" is invalid — node ids must be positive integers.`);
    }
    if (seenNodeIds.has(n.node)) {
      warnings.push(`Node ${n.node} appears more than once in "nodes".`);
    }
    seenNodeIds.add(n.node);
  }

  // ---- Gaps or overlaps in progression ranges ----
  for (let i = 1; i < ranges.length; i++) {
    const prev = ranges[i - 1];
    const curr = ranges[i];
    if (curr.startLevel > prev.endLevel + 1) {
      warnings.push(`Gap in level progression between node ${prev.node} (ends L${prev.endLevel}) and node ${curr.node} (starts L${curr.startLevel}).`);
    } else if (curr.startLevel <= prev.endLevel) {
      warnings.push(`Overlap in level progression between node ${prev.node} and node ${curr.node} around L${curr.startLevel}.`);
    }
  }
  if (!nodes || nodes.length === 0) {
    warnings.push(`"nodes" is empty — there is no level progression defined.`);
  }

  // ---- Malformed curve parameters ----
  const numericCurveFields: Array<[string, unknown]> = [
    ["curve.base", curve?.base],
    ["curve.growth", curve?.growth],
    ["curve.power", curve?.power],
    ["curve.min_xp_to_next", curve?.min_xp_to_next],
    ["curve.max_xp_to_next", curve?.max_xp_to_next],
  ];
  for (const [name, value] of numericCurveFields) {
    if (!isFiniteNumber(value)) {
      warnings.push(`${name} is missing or not a valid number (got ${JSON.stringify(value)}).`);
    }
  }
  if (!curve?.type) {
    warnings.push(`curve.type is missing.`);
  }
  if (isFiniteNumber(curve?.min_xp_to_next) && isFiniteNumber(curve?.max_xp_to_next) && curve.min_xp_to_next > curve.max_xp_to_next) {
    warnings.push(
      `curve.min_xp_to_next (${curve.min_xp_to_next}) is greater than curve.max_xp_to_next (${curve.max_xp_to_next}).`
    );
  }
  if (isFiniteNumber(curve?.growth) && curve.growth <= 0) {
    warnings.push(`curve.growth (${curve.growth}) should be greater than 0, or XP per level will never increase.`);
  }
  for (const [key, boost] of Object.entries(curve?.node_boost || {})) {
    if (!isFiniteNumber(boost) || boost <= 0) {
      warnings.push(`curve.node_boost["${key}"] (${boost}) must be a positive number.`);
    } else if (!ranges.some((r) => String(r.node) === key)) {
      warnings.push(`curve.node_boost has an entry for node ${key}, but no matching node exists in "nodes".`);
    }
  }

  // ---- Negative or zero XP requirements ----
  if (isFiniteNumber(curve?.min_xp_to_next) && curve.min_xp_to_next <= 0) {
    warnings.push(`curve.min_xp_to_next (${curve.min_xp_to_next}) must be greater than 0.`);
  }
  if (isFiniteNumber(curve?.max_xp_to_next) && curve.max_xp_to_next <= 0) {
    warnings.push(`curve.max_xp_to_next (${curve.max_xp_to_next}) must be greater than 0.`);
  }

  // ---- Configuration that does not resolve correctly through Level 369 ----
  const canSimulate = numericCurveFields.every(([, v]) => isFiniteNumber(v)) && maxLevel > 0;
  if (maxLevel !== EXPECTED_MAX_LEVEL) {
    warnings.push(`Configuration resolves to ${maxLevel} levels from "nodes", not the expected ${EXPECTED_MAX_LEVEL}.`);
  }
  if (canSimulate) {
    for (let level = 1; level <= maxLevel; level++) {
      const xp = xpToNextForLevel(level, curve, ranges);
      if (!Number.isFinite(xp)) {
        warnings.push(`XP-to-next at level ${level} does not resolve to a finite number.`);
        break;
      }
      if (xp <= 0) {
        warnings.push(`XP-to-next at level ${level} resolves to ${xp}, which is zero or negative.`);
        break;
      }
    }
  }

  // ---- Other operational checks ----
  if (isFiniteNumber(limits?.daily_xp_cap_soft) && isFiniteNumber(limits?.daily_xp_cap_hard) && limits.daily_xp_cap_soft > limits.daily_xp_cap_hard) {
    warnings.push(
      `limits.daily_xp_cap_soft (${limits.daily_xp_cap_soft}) is greater than limits.daily_xp_cap_hard (${limits.daily_xp_cap_hard}).`
    );
  }

  const membershipValues = Object.values(multipliers?.membership || {});
  const maxMembershipMultiplier = membershipValues.length ? Math.max(...membershipValues) : 0;
  const maxStreakMultiplier = multipliers?.streak?.enabled ? multipliers.streak.cap : 0;
  if (multipliers && maxMembershipMultiplier + maxStreakMultiplier > multipliers.global_multiplier_cap) {
    warnings.push(
      `Highest membership multiplier + streak cap (${(maxMembershipMultiplier + maxStreakMultiplier).toFixed(2)}) exceeds multipliers.global_multiplier_cap (${multipliers.global_multiplier_cap}).`
    );
  }

  if (canSimulate) {
    // Flag if the curve hits its hard cap well before the final node, which
    // usually means later nodes are indistinguishable from each other.
    const cappedLevel = Array.from({ length: maxLevel }, (_, i) => i + 1).find(
      (level) => xpToNextForLevel(level, curve, ranges) >= curve.max_xp_to_next
    );
    if (cappedLevel && cappedLevel < maxLevel) {
      warnings.push(
        `XP-to-next reaches curve.max_xp_to_next at level ${cappedLevel}, before the final level ${maxLevel}.`
      );
    }
  }

  return warnings;
}

export const KEY_CHECKPOINT_LEVELS = [1, 28, 100, 280, 369];

interface CumulativeTable {
  ranges: NodeRange[];
  maxLevel: number;
  /** cumulativeByLevel[i] = total XP earned by the end of level i (1-indexed, empty at index 0). */
  cumulativeByLevel: number[];
}

/** Builds the level → XP tables once so summary/preview/simulate don't each re-walk 1..maxLevel. */
export function buildCumulativeTable(config: XpEngineConfigDoc): CumulativeTable {
  const ranges = buildNodeRanges(config.nodes || []);
  const maxLevel = getMaxLevel(config.nodes || []);

  const cumulativeByLevel: number[] = [0];
  let cumulative = 0;
  for (let level = 1; level <= maxLevel; level++) {
    cumulative += xpToNextForLevel(level, config.curve, ranges);
    cumulativeByLevel[level] = cumulative;
  }

  return { ranges, maxLevel, cumulativeByLevel };
}

function sampleAtLevel(level: number, config: XpEngineConfigDoc, table: CumulativeTable) {
  return {
    level,
    xpToNext: xpToNextForLevel(level, config.curve, table.ranges),
    cumulativeXp: table.cumulativeByLevel[level] ?? 0,
  };
}

export function computeXpEngineSummary(config: XpEngineConfigDoc): XpEngineComputedSummary {
  const table = buildCumulativeTable(config);
  const { ranges, maxLevel, cumulativeByLevel } = table;

  const keyPoints = KEY_CHECKPOINT_LEVELS.filter((l) => l <= maxLevel).map((level) => sampleAtLevel(level, config, table));

  return {
    maxLevel,
    totalXpToMaxLevel: cumulativeByLevel[maxLevel] ?? 0,
    keyPoints,
    warnings: computeWarnings(config, ranges, maxLevel),
  };
}

/**
 * Denser sample table for the "preview" endpoint: every node boundary plus an
 * even spread of levels in between, so the admin can see the curve's actual
 * shape rather than just the 5 canonical checkpoints.
 */
export function computeSampleTable(config: XpEngineConfigDoc, step = 20) {
  const table = buildCumulativeTable(config);
  const { ranges, maxLevel } = table;

  const levels = new Set<number>([1]);
  for (const range of ranges) {
    levels.add(range.startLevel);
    levels.add(range.endLevel);
  }
  for (let level = step; level < maxLevel; level += step) {
    levels.add(level);
  }
  if (maxLevel > 0) levels.add(maxLevel);

  const sortedLevels = Array.from(levels)
    .filter((l) => l >= 1 && l <= maxLevel)
    .sort((a, b) => a - b);

  return {
    maxLevel,
    totalXpToMaxLevel: table.cumulativeByLevel[maxLevel] ?? 0,
    samples: sortedLevels.map((level) => sampleAtLevel(level, config, table)),
  };
}

/**
 * ASSUMPTION: "time to 369" is modeled off the daily XP limits that already
 * exist on the config (limits.daily_xp_cap_soft / _hard / soft_cap_dampening),
 * since there's no per-action XP value in the schema to simulate from
 * directly. Two reference players are estimated:
 *   - "typical": earns daily_xp_cap_soft every day
 *   - "power":   earns daily_xp_cap_hard every day, with the portion above
 *                the soft cap reduced by soft_cap_dampening (0..1)
 * A caller-supplied dailyXpEarned produces a third, custom estimate.
 */
export interface XpEngineSimulationEstimate {
  label: string;
  dailyXpEarned: number;
  estimatedDays: number | null;
}

export function computeSimulation(
  config: XpEngineConfigDoc,
  options: { targetLevel?: number; dailyXpEarned?: number } = {}
) {
  const table = buildCumulativeTable(config);
  const { maxLevel, cumulativeByLevel } = table;
  const targetLevel = Math.min(Math.max(options.targetLevel ?? maxLevel, 1), maxLevel);
  const totalXpNeeded = cumulativeByLevel[targetLevel] ?? 0;

  const { daily_xp_cap_soft: soft, daily_xp_cap_hard: hard, soft_cap_dampening: dampening } = config.limits || {};

  const daysFor = (dailyXp: number): number | null => {
    if (!isFiniteNumber(dailyXp) || dailyXp <= 0) return null;
    return Math.ceil(totalXpNeeded / dailyXp);
  };

  const estimates: XpEngineSimulationEstimate[] = [];

  if (isFiniteNumber(soft)) {
    estimates.push({ label: "typical (daily soft cap)", dailyXpEarned: soft, estimatedDays: daysFor(soft) });
  }
  if (isFiniteNumber(hard) && isFiniteNumber(soft) && isFiniteNumber(dampening)) {
    const effectiveHard = soft + (hard - soft) * dampening;
    estimates.push({
      label: "power user (daily hard cap, soft-cap dampened)",
      dailyXpEarned: effectiveHard,
      estimatedDays: daysFor(effectiveHard),
    });
  }
  if (isFiniteNumber(options.dailyXpEarned)) {
    estimates.push({
      label: "custom",
      dailyXpEarned: options.dailyXpEarned,
      estimatedDays: daysFor(options.dailyXpEarned),
    });
  }

  return { targetLevel, totalXpNeeded, estimates };
}
