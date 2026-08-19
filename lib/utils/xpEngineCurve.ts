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

const EXPECTED_MAX_LEVEL = 369;

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

export function computeXpEngineSummary(config: XpEngineConfigDoc): XpEngineComputedSummary {
  const ranges = buildNodeRanges(config.nodes || []);
  const maxLevel = getMaxLevel(config.nodes || []);

  let cumulative = 0;
  const cumulativeByLevel = new Map<number, number>();
  for (let level = 1; level <= maxLevel; level++) {
    cumulative += xpToNextForLevel(level, config.curve, ranges);
    cumulativeByLevel.set(level, cumulative);
  }

  const keyLevels = [1, 28, 100, 280, 369].filter((l) => l <= maxLevel);
  const keyPoints = keyLevels.map((level) => ({
    level,
    xpToNext: xpToNextForLevel(level, config.curve, ranges),
    cumulativeXp: cumulativeByLevel.get(level) ?? 0,
  }));

  return {
    maxLevel,
    totalXpToMaxLevel: cumulative,
    keyPoints,
    warnings: computeWarnings(config, ranges, maxLevel),
  };
}
