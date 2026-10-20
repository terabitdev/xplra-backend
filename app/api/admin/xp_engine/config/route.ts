import { NextResponse } from "next/server";
import {
  XP_ENGINE_DRAFT_DOC_ID,
  XP_ENGINE_PUBLISHED_DOC_ID,
  XP_ENGINE_VERSION_DOC_ID,
  loadConfigResponse,
} from "@/lib/utils/xpEngineConfigStore";
import { verifyAdminRequest } from "@/lib/utils/requireAdmin";

/**
 * GET /api/admin/xp_engine/config
 * Always reads live from Firestore (no caching) — the three fixed documents:
 * config/xp_engine (published), config/xp_engine_draft, config/xp_engine_version.
 *
 * This handler reads no request data, so Next.js would otherwise cache it as
 * a static response at build time on Vercel, freezing Overview/Publish/
 * Rollback at whatever it was when the app was deployed. Force it dynamic.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

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
