import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  XP_ENGINE_DRAFT_DOC_ID,
  XP_ENGINE_PUBLISHED_DOC_ID,
  XP_ENGINE_VERSION_DOC_ID,
  XP_ENGINE_VERSIONS_COLLECTION,
  invalidatePublishedConfigCache,
  loadConfigResponse,
  normalizeConfigDoc,
  xpEngineDocRef,
} from "@/lib/utils/xpEngineConfigStore";
import { XpEngineConfigDoc } from "@/lib/domain/models/xpEngineConfig";
import { verifyAdminRequest } from "@/lib/utils/requireAdmin";
import { runXpConfigImpactPreview } from "@/lib/utils/previewXpConfigImpact";

/**
 * POST /api/admin/xp_engine/rollback
 * Requires Authorization: Bearer <admin ID token>.
 *
 * One-step-back rollback over the fixed 3-document model: swaps
 * config/xp_engine and config/xp_engine_version —
 *   - xp_engine becomes what was backed up in xp_engine_version
 *   - xp_engine_version becomes what xp_engine was just replaced
 * That swap means clicking Rollback twice undoes itself, and the draft is
 * reset to mirror the restored published config, same as after a publish.
 *
 * The config being restored goes live too, so it is run through the same
 * previewXpConfigImpact check as a normal publish before anything is
 * written, and gets its own immutable xp_engine_versions/{version} record.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const publishedRef = xpEngineDocRef(XP_ENGINE_PUBLISHED_DOC_ID);
    const versionRef = xpEngineDocRef(XP_ENGINE_VERSION_DOC_ID);
    const draftRef = xpEngineDocRef(XP_ENGINE_DRAFT_DOC_ID);

    const versionSnapPreCheck = await versionRef.get();
    if (!versionSnapPreCheck.exists) {
      return NextResponse.json({ error: "No previous version to roll back to" }, { status: 404 });
    }
    const backupForPreview = normalizeConfigDoc(versionSnapPreCheck.data() as XpEngineConfigDoc);

    let impactCheck;
    try {
      impactCheck = await runXpConfigImpactPreview(auth.token, backupForPreview);
    } catch (previewError: unknown) {
      const message = previewError instanceof Error ? previewError.message : "Unknown error";
      console.error("previewXpConfigImpact call failed during rollback:", message);
      return NextResponse.json(
        {
          error:
            "Could not reach the game's previewXpConfigImpact checker, so this rollback was not performed. " +
            message,
        },
        { status: 502 }
      );
    }

    if (!impactCheck.valid) {
      return NextResponse.json(
        {
          error:
            impactCheck.errors[0] ||
            "The game rejected the backed-up config and this rollback was not performed.",
          errors: impactCheck.errors,
        },
        { status: 400 }
      );
    }

    // Same compare-and-set reasoning as publish: read + derive nextVersion +
    // write must happen atomically, or two concurrent rollbacks can reuse a
    // version number and one silently overwrites the other.
    const txnResult = await adminDb.runTransaction(async (transaction) => {
      const [publishedSnap, versionSnap] = await Promise.all([
        transaction.get(publishedRef),
        transaction.get(versionRef),
      ]);

      if (!versionSnap.exists) {
        return { kind: "error" as const, status: 404, error: "No previous version to roll back to" };
      }
      if (!publishedSnap.exists) {
        return { kind: "error" as const, status: 404, error: "No published config to roll back from" };
      }

      const currentPublished = publishedSnap.data() as XpEngineConfigDoc;
      const backup = versionSnap.data() as XpEngineConfigDoc;
      const nextVersion = currentPublished.version + 1;

      // The config being replaced becomes the new backup slot.
      transaction.set(versionRef, {
        ...currentPublished,
        backed_up_at: FieldValue.serverTimestamp(),
      });

      const restoredPublished = {
        ...backup,
        published: true,
        version: nextVersion,
        updated_by: auth.uid,
        updated_at: FieldValue.serverTimestamp(),
      };

      transaction.set(publishedRef, restoredPublished);

      // Reset the draft to mirror the restored published config.
      transaction.set(draftRef, { ...restoredPublished, published: false });

      // Append the immutable history record for this version.
      const historyRef = adminDb.collection(XP_ENGINE_VERSIONS_COLLECTION).doc(String(nextVersion));
      transaction.create(historyRef, {
        version: nextVersion,
        action: "rollback" as const,
        restored_from_version: currentPublished.version,
        config: restoredPublished,
        table_hash: impactCheck.table?.hash ?? null,
        total_xp_to_max: impactCheck.table?.totalXpToMax ?? null,
        impact: impactCheck.impact ?? null,
        published_by: auth.uid,
        published_at: FieldValue.serverTimestamp(),
      });

      return { kind: "ok" as const };
    });

    if (txnResult.kind === "error") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { kind, status, ...rest } = txnResult;
      return NextResponse.json(rest, { status });
    }

    invalidatePublishedConfigCache();

    const [published, draft] = await Promise.all([
      loadConfigResponse(XP_ENGINE_PUBLISHED_DOC_ID),
      loadConfigResponse(XP_ENGINE_DRAFT_DOC_ID),
    ]);

    return NextResponse.json({ published, draft, impact: impactCheck.impact, table: impactCheck.table });
  } catch (error: unknown) {
    console.error("Rollback XP engine config error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to roll back XP engine config";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
