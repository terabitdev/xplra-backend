import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  XP_ENGINE_DRAFT_DOC_ID,
  XP_ENGINE_PUBLISHED_DOC_ID,
  loadConfigResponse,
  xpEngineDocRef,
  xpEngineVersionsRef,
} from "@/lib/utils/xpEngineConfigStore";
import { XpEngineConfigDoc } from "@/lib/domain/models/xpEngineConfig";

/**
 * POST /api/admin/xp_engine/config/publish
 * Body: { adminUid: string }
 *
 * Promotes config/xp_engine_draft to config/xp_engine:
 *   1. Archives the current published doc to config/xp_engine/versions/{version}
 *   2. Writes the draft into config/xp_engine with version + 1
 *   3. Deletes the draft doc
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

    const [draftSnap, publishedSnap] = await Promise.all([draftRef.get(), publishedRef.get()]);

    if (!draftSnap.exists) {
      return NextResponse.json({ error: "No draft to publish" }, { status: 400 });
    }

    const draft = draftSnap.data() as XpEngineConfigDoc;
    const currentPublished = publishedSnap.exists ? (publishedSnap.data() as XpEngineConfigDoc) : null;
    const nextVersion = (currentPublished?.version ?? 0) + 1;

    const batch = adminDb.batch();

    if (currentPublished) {
      const versionRef = xpEngineVersionsRef().doc(String(currentPublished.version));
      batch.set(versionRef, {
        ...currentPublished,
        archived_at: FieldValue.serverTimestamp(),
      });
    }

    batch.set(publishedRef, {
      ...draft,
      published: true,
      version: nextVersion,
      updated_by: adminUid,
      updated_at: FieldValue.serverTimestamp(),
    });

    batch.delete(draftRef);

    await batch.commit();

    const published = await loadConfigResponse(XP_ENGINE_PUBLISHED_DOC_ID);

    return NextResponse.json({ published, draft: null });
  } catch (error: unknown) {
    console.error("Publish XP engine config error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to publish XP engine config";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
