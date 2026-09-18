import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  MODERATION_ACTIONS_COLLECTION,
  USER_REPORTS_COLLECTION,
  USERS_COLLECTION,
} from "@/lib/utils/playerReports";
import { PlayerReportDecision } from "@/lib/domain/models/playerReport";

interface DecisionEffect {
  status: "RESOLVED" | "DISMISSED";
  resolution: string;
  moderationAction: "WARNING" | "SUSPENSION" | "BAN" | null;
  accountStatus: string | null;
  requiresNote: boolean;
}

const DECISION_EFFECTS: Record<PlayerReportDecision, DecisionEffect> = {
  DISMISS: {
    status: "DISMISSED",
    resolution: "INSUFFICIENT_EVIDENCE",
    moderationAction: null,
    accountStatus: null,
    requiresNote: false,
  },
  WARN: {
    status: "RESOLVED",
    resolution: "WARNING_ISSUED",
    moderationAction: "WARNING",
    accountStatus: null,
    requiresNote: true,
  },
  SUSPEND: {
    status: "RESOLVED",
    resolution: "SUSPENDED",
    moderationAction: "SUSPENSION",
    accountStatus: "SUSPENDED",
    requiresNote: true,
  },
  BAN: {
    status: "RESOLVED",
    resolution: "BANNED",
    moderationAction: "BAN",
    accountStatus: "BANNED",
    requiresNote: true,
  },
};

/**
 * POST /api/player-reports/[id]/resolve
 * Body: { adminUid: string, decision: "DISMISS" | "WARN" | "SUSPEND" | "BAN", note?: string }
 *
 * A report count alone never triggers this automatically — every call here
 * is one admin's explicit judgment call on one report. WARN/SUSPEND/BAN
 * additionally:
 *   - log a row in moderation_actions (so future reports show "previous
 *     moderation actions" for this player), and
 *   - for SUSPEND/BAN, flip users/{reportedUid}.account_status so the
 *     action actually takes effect, not just gets recorded.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const adminUid: string | undefined = body?.adminUid;
    const decision: PlayerReportDecision | undefined = body?.decision;
    const note: string = typeof body?.note === "string" ? body.note.trim() : "";

    if (!adminUid) {
      return NextResponse.json({ error: "adminUid is required" }, { status: 400 });
    }
    if (!decision || !(decision in DECISION_EFFECTS)) {
      return NextResponse.json(
        { error: "decision must be one of DISMISS, WARN, SUSPEND, BAN" },
        { status: 400 }
      );
    }

    const effect = DECISION_EFFECTS[decision];
    if (effect.requiresNote && !note) {
      return NextResponse.json(
        { error: `A reason is required to ${decision.toLowerCase()} a player.` },
        { status: 400 }
      );
    }

    const reportRef = adminDb.collection(USER_REPORTS_COLLECTION).doc(params.id);
    const reportSnap = await reportRef.get();
    if (!reportSnap.exists) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const raw = reportSnap.data() || {};
    if (raw.status && raw.status !== "OPEN") {
      return NextResponse.json({ error: "This report has already been reviewed." }, { status: 409 });
    }

    const reportedUid: string | undefined = raw.reported_uid;
    if (effect.moderationAction && !reportedUid) {
      return NextResponse.json(
        { error: "Report has no reported_uid — cannot log a moderation action." },
        { status: 400 }
      );
    }

    const batch = adminDb.batch();

    batch.update(reportRef, {
      status: effect.status,
      resolution: effect.resolution,
      resolution_note: note || null,
      reviewed_at: FieldValue.serverTimestamp(),
      reviewed_by: adminUid,
    });

    if (effect.moderationAction && reportedUid) {
      const actionRef = adminDb.collection(MODERATION_ACTIONS_COLLECTION).doc();
      batch.set(actionRef, {
        uid: reportedUid,
        action: effect.moderationAction,
        reason: note,
        reportId: params.id,
        adminUid,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    if (effect.accountStatus && reportedUid) {
      const userRef = adminDb.collection(USERS_COLLECTION).doc(reportedUid);
      batch.update(userRef, { account_status: effect.accountStatus });
    }

    await batch.commit();

    return NextResponse.json({ success: true, status: effect.status, resolution: effect.resolution });
  } catch (error: unknown) {
    console.error("Resolve player report error:", error);
    const msg = error instanceof Error ? error.message : "Failed to resolve report";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
