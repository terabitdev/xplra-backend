import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  XP_ENGINE_DRAFT_DOC_ID,
  XP_ENGINE_PUBLISHED_DOC_ID,
  XP_ENGINE_VERSION_DOC_ID,
  loadConfigResponse,
  withComputed,
  xpEngineDocRef,
} from "@/lib/utils/xpEngineConfigStore";
import { XpEngineConfigDoc } from "@/lib/domain/models/xpEngineConfig";

/**
 * POST /api/admin/xp_engine/publish
 * Body: { adminUid: string }
 *
 * Validate + publish + version, using the fixed 3-document model:
 *   1. Rejects if the draft fails validation (same warnings shown on Overview)
 *   2. Backs up the current config/xp_engine into config/xp_engine_version
 *      (the single one-step-back slot — overwritten, not appended)
 *   3. Replaces config/xp_engine with the draft's data, version + 1
 *   4. Resets config/xp_engine_draft to mirror the new published data, so
 *      all three documents always exist and are only ever overwritten,
 *      never deleted
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const adminUid: string | undefined = body?.adminUid;

    if (!adminUid) {
      return NextResponse.json({ error: "adminUid is required" }, { status: 400 });
    }

    const draftRef = xpEngineDocRef(XP_ENGINE_DRAFT_DOC_ID);
    const publishedRef = xpEngineDocRef(XP_ENGINE_PUBLISHED_DOC_ID);
    const versionRef = xpEngineDocRef(XP_ENGINE_VERSION_DOC_ID);

    const [draftSnap, publishedSnap] = await Promise.all([draftRef.get(), publishedRef.get()]);

    if (!draftSnap.exists) {
      return NextResponse.json({ error: "No draft to publish" }, { status: 400 });
    }

    const draft = draftSnap.data() as XpEngineConfigDoc;

    // ---- Validate before publishing ----
    const validated = withComputed(draft);
    if (validated.computed.warnings.length > 0) {
      return NextResponse.json(
        {
          error: "Draft has validation warnings and cannot be published.",
          warnings: validated.computed.warnings,
        },
        { status: 400 }
      );
    }

    const currentPublished = publishedSnap.exists ? (publishedSnap.data() as XpEngineConfigDoc) : null;
    const nextVersion = (currentPublished?.version ?? 0) + 1;

    const batch = adminDb.batch();

    // 1. Back up the outgoing published config into the single version slot.
    if (currentPublished) {
      batch.set(versionRef, {
        ...currentPublished,
        backed_up_at: FieldValue.serverTimestamp(),
      });
    }

    const newPublished = {
      ...draft,
      published: true,
      version: nextVersion,
      updated_by: adminUid,
      updated_at: FieldValue.serverTimestamp(),
    };

    // 2. The draft's data becomes the live published config.
    batch.set(publishedRef, newPublished);

    // 3. Reset the draft to mirror the newly published config (never deleted).
    batch.set(draftRef, { ...newPublished, published: false });

    await batch.commit();

    const [published, draftAfter] = await Promise.all([
      loadConfigResponse(XP_ENGINE_PUBLISHED_DOC_ID),
      loadConfigResponse(XP_ENGINE_DRAFT_DOC_ID),
    ]);

    return NextResponse.json({ published, draft: draftAfter });
  } catch (error: unknown) {
    console.error("Publish XP engine config error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to publish XP engine config";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
