/**
 * Client for the game team's read-only `previewXpConfigImpact` Cloud
 * Function — the authoritative check for "is this config valid for the
 * game, and what would publishing it change for existing players." The
 * admin panel's own validator (xpEngineCurve.ts) stays as a fast local
 * check for the editing UI, but publish must also pass this before it's
 * allowed to go live, since this is the actual game-side source of truth.
 *
 * The function writes nothing and returns aggregate counts only (no player
 * ids), per the game team's spec.
 */

const PREVIEW_FUNCTION_URL =
  process.env.PREVIEW_XP_CONFIG_IMPACT_URL ||
  "https://us-central1-xplra-1.cloudfunctions.net/previewXpConfigImpact";

export interface XpConfigImpactTable {
  version: number;
  totalXpToMax: number;
  hash: string;
}

export interface XpConfigImpactCounts {
  scanned: number;
  withoutXp: number;
  withoutSavedLevel: number;
  changedVsSaved: number;
  upVsSaved: number;
  downVsSaved: number;
  changedVsLive: number;
  upVsLive: number;
  downVsLive: number;
  largestLevelMove: number;
  complete: boolean;
  nextCursor: string | null;
}

export interface XpConfigImpactResult {
  valid: boolean;
  errors: string[];
  table?: XpConfigImpactTable;
  impact?: XpConfigImpactCounts;
}

export interface XpConfigImpactAggregate {
  valid: boolean;
  errors: string[];
  table?: XpConfigImpactTable;
  impact: Omit<XpConfigImpactCounts, "complete" | "nextCursor"> | null;
  pagesFetched: number;
}

async function callOnce(
  idToken: string,
  config: unknown,
  options: { includeImpact: boolean; pageSize: number; cursor: string | null }
): Promise<XpConfigImpactResult> {
  const res = await fetch(PREVIEW_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({
      data: {
        config,
        includeImpact: options.includeImpact,
        pageSize: options.pageSize,
        cursor: options.cursor,
      },
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.error) {
    const message = json?.error?.message || `previewXpConfigImpact request failed (HTTP ${res.status})`;
    throw new Error(message);
  }
  return (json?.result ?? json) as XpConfigImpactResult;
}

/**
 * Calls the function repeatedly, following `impact.nextCursor` until
 * `impact.complete`, summing counts across pages. Stops immediately (no
 * pagination) if the config is invalid or includeImpact is false.
 */
export async function runXpConfigImpactPreview(
  idToken: string,
  config: unknown,
  options: { includeImpact?: boolean; pageSize?: number; maxPages?: number } = {}
): Promise<XpConfigImpactAggregate> {
  const includeImpact = options.includeImpact ?? true;
  const pageSize = options.pageSize ?? 500;
  const maxPages = options.maxPages ?? 200; // safety bound against a misbehaving function

  let cursor: string | null = null;
  let pagesFetched = 0;
  let valid = true;
  let errors: string[] = [];
  let table: XpConfigImpactTable | undefined;
  let impact: XpConfigImpactAggregate["impact"] = null;

  do {
    const result = await callOnce(idToken, config, { includeImpact, pageSize, cursor });
    pagesFetched++;
    valid = result.valid;
    errors = result.errors || [];
    table = result.table ?? table;

    if (!valid || !result.impact) {
      cursor = null;
      break;
    }

    const { complete, nextCursor, ...counts } = result.impact;
    if (!impact) {
      impact = { ...counts };
    } else {
      impact.scanned += counts.scanned;
      impact.withoutXp += counts.withoutXp;
      impact.withoutSavedLevel += counts.withoutSavedLevel;
      impact.changedVsSaved += counts.changedVsSaved;
      impact.upVsSaved += counts.upVsSaved;
      impact.downVsSaved += counts.downVsSaved;
      impact.changedVsLive += counts.changedVsLive;
      impact.upVsLive += counts.upVsLive;
      impact.downVsLive += counts.downVsLive;
      impact.largestLevelMove = Math.max(impact.largestLevelMove, counts.largestLevelMove);
    }
    cursor = complete ? null : nextCursor;
  } while (cursor && pagesFetched < maxPages);

  return { valid, errors, table, impact, pagesFetched };
}
