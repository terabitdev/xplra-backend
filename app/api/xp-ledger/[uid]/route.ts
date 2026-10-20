import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminRequest } from "@/lib/utils/requireAdmin";
import { toIsoOrNull } from "@/lib/utils/firestoreTimestamp";
import { XpLedgerEntry, UserXpSummary } from "@/lib/domain/models/xpLedger";

/**
 * GET /api/xp-ledger/[uid]
 * Requires Authorization: Bearer <admin ID token>.
 *
 * Read-only. The XP totals come from the player's own users/{uid} doc
 * (xp_total, level, node, xp_into_level, xp_to_next — written only by the
 * game's Cloud Functions), and history comes from the player's own
 * users/{uid}/xp_ledger subcollection, not the legacy top-level xp_ledger
 * collection the panel used to write to.
 */
export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { uid } = params;
    if (!uid) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;

    const [userDoc, ledgerSnap] = await Promise.all([
      adminDb.collection("users").doc(uid).get(),
      adminDb
        .collection("users")
        .doc(uid)
        .collection("xp_ledger")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get()
        .catch(() =>
          // Falls back to an unordered read if the subcollection has no
          // createdAt-indexed documents yet (e.g. before the game has
          // written any entries for this player).
          adminDb.collection("users").doc(uid).collection("xp_ledger").limit(limit).get()
        ),
    ]);

    const userData = userDoc.data();

    const summary: UserXpSummary = {
      xp_total: typeof userData?.xp_total === "number" ? userData.xp_total : 0,
      level: typeof userData?.level === "number" ? userData.level : 0,
      node: typeof userData?.node === "number" ? userData.node : null,
      xp_into_level: typeof userData?.xp_into_level === "number" ? userData.xp_into_level : null,
      xp_to_next: typeof userData?.xp_to_next === "number" ? userData.xp_to_next : null,
    };

    const entries: XpLedgerEntry[] = ledgerSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: toIsoOrNull(data.createdAt),
      };
    });

    return NextResponse.json({ entries, total: entries.length, summary });
  } catch (error: unknown) {
    console.error("Error fetching XP ledger entries:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
