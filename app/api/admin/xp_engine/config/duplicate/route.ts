import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  XP_ENGINE_DRAFT_DOC_ID,
  XP_ENGINE_PUBLISHED_DOC_ID,
  loadConfigResponse,
  xpEngineDocRef,
} from "@/lib/utils/xpEngineConfigStore";
import { XpEngineConfigDoc } from "@/lib/domain/models/xpEngineConfig";

/**
 * POST /api/admin/xp_engine/config/duplicate
 * Body: { adminUid: string }
 *
 * Copies the currently published config into config/xp_engine_draft,
 * overwriting any existing draft. Backs the "Duplicate Config" button, and
 * "Edit Draft" when no draft exists yet.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const adminUid: string | undefined = body?.adminUid;

    if (!adminUid) {
      return NextResponse.json(
        { error: "adminUid is required" },
        { status: 400 },
      );
    }

    const publishedSnap = await xpEngineDocRef(
      XP_ENGINE_PUBLISHED_DOC_ID,
    ).get();
    if (!publishedSnap.exists) {
      return NextResponse.json(
        { error: "No published config to duplicate" },
        { status: 404 },
      );
    }

    const published = publishedSnap.data() as XpEngineConfigDoc;

    await xpEngineDocRef(XP_ENGINE_DRAFT_DOC_ID).set({
      ...published,
      published: false,
      updated_by: adminUid,
      updated_at: FieldValue.serverTimestamp(),
    });

    const draft = await loadConfigResponse(XP_ENGINE_DRAFT_DOC_ID);

    return NextResponse.json({ draft });
  } catch (error: unknown) {
    console.error("Duplicate XP engine config error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to duplicate XP engine config";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
