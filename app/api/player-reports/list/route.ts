import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { loadUserInfoMap, toPlayerReport, USER_REPORTS_COLLECTION } from "@/lib/utils/playerReports";
import { PlayerReport } from "@/lib/domain/models/playerReport";

/**
 * GET /api/player-reports/list?page=1&limit=20&status=OPEN
 * Same source collection as /api/user-reports/list (user_reports), but this
 * is the moderation-facing list: supports a status filter and carries the
 * resolution fields the Player Reports detail view needs.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status"); // OPEN | RESOLVED | DISMISSED | null (= all)

    const snap = await adminDb.collection(USER_REPORTS_COLLECTION).orderBy("created_at", "desc").get();
    const rawDocs = snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));

    const userInfoMap = await loadUserInfoMap(
      rawDocs.flatMap(({ data }) => [data.reporter_uid || "", data.reported_uid || ""])
    );

    let allReports: PlayerReport[] = rawDocs.map(({ id, data }) =>
      toPlayerReport(
        id,
        data,
        userInfoMap.get(data.reporter_uid) || null,
        userInfoMap.get(data.reported_uid) || null
      )
    );

    if (status) {
      allReports = allReports.filter((r) => r.status === status);
    }

    const total = allReports.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;

    // Counts by status, for the filter tabs — computed off the unfiltered set.
    const unfiltered: PlayerReport[] = rawDocs.map(({ id, data }) =>
      toPlayerReport(id, data, userInfoMap.get(data.reporter_uid) || null, userInfoMap.get(data.reported_uid) || null)
    );
    const counts = {
      all: unfiltered.length,
      OPEN: unfiltered.filter((r) => r.status === "OPEN").length,
      RESOLVED: unfiltered.filter((r) => r.status === "RESOLVED").length,
      DISMISSED: unfiltered.filter((r) => r.status === "DISMISSED").length,
    };

    return NextResponse.json({
      data: allReports.slice(startIndex, startIndex + limit),
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      counts,
    });
  } catch (error: unknown) {
    console.error("Get player reports error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch player reports";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
