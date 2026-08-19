import { NextResponse } from "next/server";
import { listVersionHistory } from "@/lib/utils/xpEngineConfigStore";

/**
 * GET /api/admin/xp_engine/config/versions
 * Returns archived config/xp_engine/versions snapshots, newest first.
 */
export async function GET() {
  try {
    const versions = await listVersionHistory();
    return NextResponse.json({ versions });
  } catch (error: unknown) {
    console.error("List XP engine config versions error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to list XP engine config versions";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
