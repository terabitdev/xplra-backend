import { NextResponse } from "next/server";
import {
  XP_ENGINE_DRAFT_DOC_ID,
  XP_ENGINE_PUBLISHED_DOC_ID,
  countVersionHistory,
  loadConfigResponse,
} from "@/lib/utils/xpEngineConfigStore";

export async function GET() {
  try {
    const [published, draft, versionHistoryCount] = await Promise.all([
      loadConfigResponse(XP_ENGINE_PUBLISHED_DOC_ID),
      loadConfigResponse(XP_ENGINE_DRAFT_DOC_ID),
      countVersionHistory(),
    ]);

    return NextResponse.json({ published, draft, versionHistoryCount });
  } catch (error: unknown) {
    console.error("Get XP engine config error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch XP engine config";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
