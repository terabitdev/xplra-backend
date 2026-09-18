import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  loadModerationHistory,
  loadUserInfo,
  toPlayerReport,
  USER_REPORTS_COLLECTION,
} from "@/lib/utils/playerReports";
import { PlayerReportDetail, ReportHistoryEntry } from "@/lib/domain/models/playerReport";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * GET /api/player-reports/[id]
 * The report itself, plus everything the spec calls "relevant platform
 * context" that's actually available today:
 *   - reportHistory: other reports against the same reported player
 *   - moderationHistory: past warnings/suspensions/bans against that player
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reportRef = adminDb.collection(USER_REPORTS_COLLECTION).doc(params.id);
    const reportSnap = await reportRef.get();

    if (!reportSnap.exists) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const raw = reportSnap.data() || {};
    const [reporter, reported] = await Promise.all([
      loadUserInfo(raw.reporter_uid),
      loadUserInfo(raw.reported_uid),
    ]);

    const report = toPlayerReport(reportSnap.id, raw, reporter, reported);

    // Other reports filed against the same reported player.
    const otherReportsSnap = raw.reported_uid
      ? await adminDb.collection(USER_REPORTS_COLLECTION).where("reported_uid", "==", raw.reported_uid).get()
      : null;

    const now = Date.now();
    const entries: ReportHistoryEntry[] = (otherReportsSnap?.docs || [])
      .filter((doc) => doc.id !== report.id)
      .map((doc) => {
        const d = doc.data();
        const other = toPlayerReport(doc.id, d, null, null);
        return {
          id: other.id,
          reason: other.reason,
          status: other.status,
          resolution: other.resolution,
          createdAt: other.createdAt,
        };
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const last90DaysCount = entries.filter((e) => {
      const t = Date.parse(e.createdAt);
      return Number.isFinite(t) && now - t <= NINETY_DAYS_MS;
    }).length;

    const moderationHistory = raw.reported_uid ? await loadModerationHistory(raw.reported_uid) : [];

    const detail: PlayerReportDetail = {
      report,
      reportHistory: { last90DaysCount, entries },
      moderationHistory,
    };

    return NextResponse.json(detail);
  } catch (error: unknown) {
    console.error("Get player report detail error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch report detail";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
