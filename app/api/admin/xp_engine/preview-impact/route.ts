import { NextRequest, NextResponse } from "next/server";
import { XP_ENGINE_DRAFT_DOC_ID, normalizeConfigDoc, xpEngineDocRef } from "@/lib/utils/xpEngineConfigStore";
import { XpEngineConfigDoc } from "@/lib/domain/models/xpEngineConfig";
import { verifyAdminRequest } from "@/lib/utils/requireAdmin";
import { runXpConfigImpactPreview } from "@/lib/utils/previewXpConfigImpact";

/**
 * POST /api/admin/xp_engine/preview-impact
 * Requires Authorization: Bearer <admin ID token>.
 *
 * Read-only: runs the current draft through the game's own
 * `previewXpConfigImpact` Cloud Function and returns its validation result
 * plus the player-impact counts, without publishing anything. Used by the
 * Overview tab so an admin can see this before deciding to publish.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const draftSnap = await xpEngineDocRef(XP_ENGINE_DRAFT_DOC_ID).get();
    if (!draftSnap.exists) {
      return NextResponse.json({ error: "No draft to check" }, { status: 400 });
    }
    const draft = normalizeConfigDoc(draftSnap.data() as XpEngineConfigDoc);

    const result = await runXpConfigImpactPreview(auth.token, draft);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Preview XP config impact error:", error);
    const errorMessage =
      error instanceof Error
        ? `Could not reach the game's previewXpConfigImpact checker: ${error.message}`
        : "Could not reach the game's previewXpConfigImpact checker";
    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }
}
