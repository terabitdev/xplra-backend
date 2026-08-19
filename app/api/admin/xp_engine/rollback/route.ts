import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  XP_ENGINE_DRAFT_DOC_ID,
  XP_ENGINE_PUBLISHED_DOC_ID,
  XP_ENGINE_VERSION_DOC_ID,
  loadConfigResponse,
  xpEngineDocRef,
} from "@/lib/utils/xpEngineConfigStore";
import { XpEngineConfigDoc } from "@/lib/domain/models/xpEngineConfig";

/**
 * POST /api/admin/xp_engine/rollback
 * Body: { adminUid: string }
 *
 * One-step-back rollback over the fixed 3-document model: swaps
 * config/xp_engine and config/xp_engine_version —
 *   - xp_engine becomes what was backed up in xp_engine_version
 *   - xp_engine_version becomes what xp_engine was just replaced
 * That swap means clicking Rollback twice undoes itself, and the draft is
 * reset to mirror the restored published config, same as after a publish.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const adminUid: string | undefined = body?.adminUid;

    if (!adminUid) {
      return NextResponse.json({ error: "adminUid is required" }, { status: 400 });
    }

    const publishedRef = xpEngineDocRef(XP_ENGINE_PUBLISHED_DOC_ID);
    const versionRef = xpEngineDocRef(XP_ENGINE_VERSION_DOC_ID);
    const draftRef = xpEngineDocRef(XP_ENGINE_DRAFT_DOC_ID);

    const [publishedSnap, versionSnap] = await Promise.all([publishedRef.get(), versionRef.get()]);

    if (!versionSnap.exists) {
      return NextResponse.json({ error: "No previous version to roll back to" }, { status: 404 });
    }
    if (!publishedSnap.exists) {
      return NextResponse.json({ error: "No published config to roll back from" }, { status: 404 });
    }

    const currentPublished = publishedSnap.data() as XpEngineConfigDoc;
    const backup = versionSnap.data() as XpEngineConfigDoc;
    const nextVersion = currentPublished.version + 1;

    const batch = adminDb.batch();

    // The config being replaced becomes the new backup slot.
    batch.set(versionRef, {
      ...currentPublished,
      backed_up_at: FieldValue.serverTimestamp(),
    });

    const restoredPublished = {
      ...backup,
      published: true,
      version: nextVersion,
      updated_by: adminUid,
      updated_at: FieldValue.serverTimestamp(),
    };

    batch.set(publishedRef, restoredPublished);

    // Reset the draft to mirror the restored published config.
    batch.set(draftRef, { ...restoredPublished, published: false });

    await batch.commit();

    const [published, draft] = await Promise.all([
      loadConfigResponse(XP_ENGINE_PUBLISHED_DOC_ID),
      loadConfigResponse(XP_ENGINE_DRAFT_DOC_ID),
    ]);

    return NextResponse.json({ published, draft });
  } catch (error: unknown) {
    console.error("Rollback XP engine config error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to roll back XP engine config";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
