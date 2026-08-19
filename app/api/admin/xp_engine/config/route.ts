import { NextResponse } from "next/server";
import {
  XP_ENGINE_DRAFT_DOC_ID,
  XP_ENGINE_PUBLISHED_DOC_ID,
  XP_ENGINE_VERSION_DOC_ID,
  loadConfigResponse,
} from "@/lib/utils/xpEngineConfigStore";

/**
 * GET /api/admin/xp_engine/config
 * Always reads live from Firestore (no caching) — the three fixed documents:
 * config/xp_engine (published), config/xp_engine_draft, config/xp_engine_version.
 */
export async function GET() {
  try {
    const [published, draft, version] = await Promise.all([
      loadConfigResponse(XP_ENGINE_PUBLISHED_DOC_ID),
      loadConfigResponse(XP_ENGINE_DRAFT_DOC_ID),
      loadConfigResponse(XP_ENGINE_VERSION_DOC_ID),
    ]);

    return NextResponse.json({ published, draft, version });
  } catch (error: unknown) {
    console.error("Get XP engine config error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch XP engine config";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
