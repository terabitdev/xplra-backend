import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  XP_ENGINE_PUBLISHED_DOC_ID,
  loadConfigResponse,
  xpEngineDocRef,
  xpEngineVersionsRef,
} from "@/lib/utils/xpEngineConfigStore";
import { XpEngineConfigDoc } from "@/lib/domain/models/xpEngineConfig";

/**
 * POST /api/admin/xp_engine/config/rollback
 * Body: { version: number, adminUid: string }
 *
 * Restores an archived config/xp_engine/versions/{version} snapshot as the
 * live published config. The current published config is archived first
 * (so rollback itself is reversible), and the restored config is written
 * under a *new* version number to keep version history linear.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const version: number | undefined = body?.version;
    const adminUid: string | undefined = body?.adminUid;

    if (version === undefined || version === null) {
      return NextResponse.json({ error: "version is required" }, { status: 400 });
    }
    if (!adminUid) {
      return NextResponse.json({ error: "adminUid is required" }, { status: 400 });
    }

    const publishedRef = xpEngineDocRef(XP_ENGINE_PUBLISHED_DOC_ID);
    const targetVersionRef = xpEngineVersionsRef().doc(String(version));

    const [publishedSnap, targetSnap] = await Promise.all([publishedRef.get(), targetVersionRef.get()]);

    if (!targetSnap.exists) {
      return NextResponse.json({ error: `Version ${version} not found` }, { status: 404 });
    }

    const target = targetSnap.data() as XpEngineConfigDoc;
    const currentPublished = publishedSnap.exists ? (publishedSnap.data() as XpEngineConfigDoc) : null;
    const nextVersion = (currentPublished?.version ?? 0) + 1;

    const batch = adminDb.batch();

    if (currentPublished) {
      const archiveRef = xpEngineVersionsRef().doc(String(currentPublished.version));
      batch.set(archiveRef, {
        ...currentPublished,
        archived_at: FieldValue.serverTimestamp(),
      });
    }

    batch.set(publishedRef, {
      ...target,
      published: true,
      version: nextVersion,
      updated_by: adminUid,
      updated_at: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    const published = await loadConfigResponse(XP_ENGINE_PUBLISHED_DOC_ID);

    return NextResponse.json({ published });
  } catch (error: unknown) {
    console.error("Rollback XP engine config error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to roll back XP engine config";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
