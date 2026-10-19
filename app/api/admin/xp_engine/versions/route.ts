import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { XP_ENGINE_VERSIONS_COLLECTION } from "@/lib/utils/xpEngineConfigStore";
import { toIsoOrNull } from "@/lib/utils/firestoreTimestamp";
import { verifyAdminRequest } from "@/lib/utils/requireAdmin";

const DEFAULT_LIMIT = 50;

/**
 * GET /api/admin/xp_engine/versions
 * Requires Authorization: Bearer <admin ID token>.
 *
 * Read-only list of the full, immutable publish/rollback history from
 * xp_engine_versions/{version} — every entry ever written there, newest
 * first. This is separate from the single-slot backup used for the
 * one-step "Rollback" action.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const limitParam = Number(req.nextUrl.searchParams.get("limit"));
    const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : DEFAULT_LIMIT;

    const snap = await adminDb
      .collection(XP_ENGINE_VERSIONS_COLLECTION)
      .orderBy("version", "desc")
      .limit(limit)
      .get();

    const versions = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        published_at: toIsoOrNull(data.published_at),
        config: data.config ? { ...data.config, updated_at: toIsoOrNull(data.config.updated_at) } : null,
      };
    });

    return NextResponse.json({ versions });
  } catch (error: unknown) {
    console.error("List XP engine versions error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to load version history";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
