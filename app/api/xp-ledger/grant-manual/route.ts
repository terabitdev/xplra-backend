import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/utils/requireAdmin";
import { callGrantManualXp, GrantManualXpError } from "@/lib/utils/grantManualXp";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;
const MAX_AMOUNT = 10000;
const MAX_REASON_LENGTH = 500;
const MAX_RELATED_ENTITY_ID_LENGTH = 200;

// Callable error status -> HTTP status for the admin panel.
const ERROR_STATUS_MAP: Record<string, number> = {
  "resource-exhausted": 429,
  "already-exists": 409,
  "not-found": 404,
  "invalid-argument": 400,
  unauthenticated: 401,
  "permission-denied": 403,
  internal: 500,
};

/**
 * POST /api/xp-ledger/grant-manual
 * Requires Authorization: Bearer <admin ID token>.
 *
 * The only remaining way the admin panel moves a player's XP: forwards the
 * admin's own verified token to the game's grantManualXp Cloud Function and
 * returns its result as-is. The panel does not write xpTotal, xpEarnedAllTime,
 * or the legacy top-level xp_ledger collection anymore — per the XP engine
 * document, only Cloud Functions write XP.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json().catch(() => null);
    const uid = typeof body?.uid === "string" ? body.uid.trim() : "";
    const amount = Number(body?.amount);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";
    const relatedEntityId =
      typeof body?.relatedEntityId === "string" && body.relatedEntityId.trim() !== ""
        ? body.relatedEntityId.trim()
        : undefined;

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }
    if (!Number.isInteger(amount) || amount < 1 || amount > MAX_AMOUNT) {
      return NextResponse.json({ error: `amount must be a whole number from 1 to ${MAX_AMOUNT}` }, { status: 400 });
    }
    if (!reason || reason.length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        { error: `reason is required and must be ${MAX_REASON_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }
    if (!REQUEST_ID_PATTERN.test(requestId)) {
      return NextResponse.json(
        { error: "requestId must be 8-100 characters of letters, digits, - or _" },
        { status: 400 }
      );
    }
    if (relatedEntityId !== undefined && relatedEntityId.length > MAX_RELATED_ENTITY_ID_LENGTH) {
      return NextResponse.json(
        { error: `relatedEntityId must be ${MAX_RELATED_ENTITY_ID_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    const result = await callGrantManualXp(auth.token, {
      uid,
      amount,
      reason,
      requestId,
      transactionType: "Admin Adjustment",
      relatedEntityId,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof GrantManualXpError) {
      const status = ERROR_STATUS_MAP[error.code] ?? 500;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    console.error("grantManualXp error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to grant XP";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
