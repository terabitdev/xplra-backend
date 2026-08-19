import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  XP_ENGINE_DRAFT_DOC_ID,
  XP_ENGINE_PUBLISHED_DOC_ID,
  loadConfigResponse,
  xpEngineDocRef,
} from "@/lib/utils/xpEngineConfigStore";
import { EXPECTED_MAX_LEVEL, getMaxLevel } from "@/lib/utils/xpEngineCurve";
import { XpEngineConfigDoc } from "@/lib/domain/models/xpEngineConfig";

/**
 * POST /api/admin/xp_engine/draft
 * Body: { adminUid: string, source?: "published", patch?: Partial<XpEngineConfigDoc> }
 *
 * Create/update the working draft (config/xp_engine_draft):
 *   - No draft yet, or source: "published"  -> (re)seed the draft from the
 *     published config (discarding any prior edits), then apply `patch` on
 *     top if given. The draft's version counter resets to published.version.
 *   - Draft already exists, no reset        -> merge `patch` into it, and
 *     bump the draft's version by 1. The version updates every time the
 *     draft's data changes, whether that's an edit or a fresh duplicate.
 *
 * "Duplicate Config" and the first "Edit Draft" click both call this with
 * { source: "published" } and no patch. The configuration tabs (Curve &
 * Nodes, Multipliers, Caps & Limits) call it with a `patch` for whichever
 * section they edited.
 *
 * Locked structural rule: the 369-level architecture is not editable through
 * the Admin UI. Admins may redistribute how many levels each node spans and
 * tune node_boost/curve params, but a patch that changes `nodes` such that
 * the total no longer resolves to EXPECTED_MAX_LEVEL is rejected here —
 * before it ever reaches the draft, not just as a publish-time warning.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const adminUid: string | undefined = body?.adminUid;
    const source: string | undefined = body?.source;
    const patch: Partial<XpEngineConfigDoc> | undefined = body?.patch;

    if (!adminUid) {
      return NextResponse.json({ error: "adminUid is required" }, { status: 400 });
    }

    const draftRef = xpEngineDocRef(XP_ENGINE_DRAFT_DOC_ID);
    const publishedRef = xpEngineDocRef(XP_ENGINE_PUBLISHED_DOC_ID);
    const [draftSnap, publishedSnap] = await Promise.all([draftRef.get(), publishedRef.get()]);

    const resetFromPublished = source === "published" || !draftSnap.exists;

    let base: XpEngineConfigDoc;
    let nextVersion: number;
    if (resetFromPublished) {
      if (!publishedSnap.exists) {
        return NextResponse.json({ error: "No published config to base a draft on" }, { status: 404 });
      }
      base = publishedSnap.data() as XpEngineConfigDoc;
      nextVersion = base.version + 1;
    } else {
      base = draftSnap.data() as XpEngineConfigDoc;
      nextVersion = base.version + 1;
    }

    const merged: XpEngineConfigDoc = { ...base, ...(patch || {}) };

    if (patch?.nodes) {
      const mergedMaxLevel = getMaxLevel(merged.nodes || []);
      if (mergedMaxLevel !== EXPECTED_MAX_LEVEL) {
        return NextResponse.json(
          {
            error: `Total levels across all nodes must remain ${EXPECTED_MAX_LEVEL} (this change resolves to ${mergedMaxLevel}). Redistribute levels between nodes instead of changing the total.`,
          },
          { status: 400 }
        );
      }
    }

    await draftRef.set({
      ...merged,
      published: false,
      version: nextVersion,
      updated_by: adminUid,
      updated_at: FieldValue.serverTimestamp(),
    });

    const draft = await loadConfigResponse(XP_ENGINE_DRAFT_DOC_ID);

    return NextResponse.json({ draft });
  } catch (error: unknown) {
    console.error("Create/update XP engine draft error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save XP engine draft";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
