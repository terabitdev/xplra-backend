import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  XP_ENGINE_DRAFT_DOC_ID,
  XP_ENGINE_PUBLISHED_DOC_ID,
  XP_ENGINE_VERSION_DOC_ID,
  invalidatePublishedConfigCache,
  loadConfigResponse,
  withComputed,
  xpEngineDocRef,
} from "@/lib/utils/xpEngineConfigStore";
import { XpEngineConfigDoc } from "@/lib/domain/models/xpEngineConfig";
import { verifyAdminRequest } from "@/lib/utils/requireAdmin";

/**
 * POST /api/admin/xp_engine/publish
 * Requires Authorization: Bearer <admin ID token>.
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
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const draftRef = xpEngineDocRef(XP_ENGINE_DRAFT_DOC_ID);
    const publishedRef = xpEngineDocRef(XP_ENGINE_PUBLISHED_DOC_ID);
    const versionRef = xpEngineDocRef(XP_ENGINE_VERSION_DOC_ID);

    // Reading draft/published and deriving nextVersion from that read, then
    // committing separately, is a race: two concurrent publishes can both
    // read the same version and both compute the same nextVersion, and the
    // second write silently overwrites the first while both responses claim
    // the same version number. Wrapping the read and every write in one
    // transaction makes this a real compare-and-set — Firestore retries this
    // whole callback with a fresh read if another transaction committed a
    // conflicting change to any document read here first.
    const txnResult = await adminDb.runTransaction(async (transaction) => {
      const [draftSnap, publishedSnap] = await Promise.all([
        transaction.get(draftRef),
        transaction.get(publishedRef),
      ]);

      if (!draftSnap.exists) {
        return { kind: "error" as const, status: 400, error: "No draft to publish" };
      }

      const draft = draftSnap.data() as XpEngineConfigDoc;

      const validated = withComputed(draft);
      if (validated.computed.warnings.length > 0) {
        return {
          kind: "error" as const,
          status: 400,
          error: "Draft has validation warnings and cannot be published.",
          warnings: validated.computed.warnings,
        };
      }

      const currentPublished = publishedSnap.exists ? (publishedSnap.data() as XpEngineConfigDoc) : null;
      const nextVersion = (currentPublished?.version ?? 0) + 1;

      // 1. Back up the outgoing published config into the single version slot.
      if (currentPublished) {
        transaction.set(versionRef, {
          ...currentPublished,
          backed_up_at: FieldValue.serverTimestamp(),
        });
      }

      const newPublished = {
        ...draft,
        published: true,
        version: nextVersion,
        updated_by: auth.uid,
        updated_at: FieldValue.serverTimestamp(),
      };

      // 2. The draft's data becomes the live published config.
      transaction.set(publishedRef, newPublished);

      // 3. Reset the draft to mirror the newly published config (never deleted).
      transaction.set(draftRef, { ...newPublished, published: false });

      return { kind: "ok" as const };
    });

    if (txnResult.kind === "error") {
      const { kind, status, ...rest } = txnResult;
      return NextResponse.json(rest, { status });
    }

    invalidatePublishedConfigCache();

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
