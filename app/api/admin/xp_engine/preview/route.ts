import { NextRequest, NextResponse } from "next/server";
import { computeSampleTable, computeXpEngineSummary } from "@/lib/utils/xpEngineCurve";
import {
  XP_ENGINE_DRAFT_DOC_ID,
  XP_ENGINE_PUBLISHED_DOC_ID,
  normalizeConfigDoc,
  xpEngineDocRef,
} from "@/lib/utils/xpEngineConfigStore";
import { XpEngineConfigDoc } from "@/lib/domain/models/xpEngineConfig";

function hasCurveShape(value: unknown): value is XpEngineConfigDoc {
  const v = value as Partial<XpEngineConfigDoc> | null | undefined;
  return !!v && !!v.curve && Array.isArray(v.nodes);
}

/**
 * POST /api/admin/xp_engine/preview
 * Body: { source?: "draft" | "published", config?: XpEngineConfigDoc, step?: number }
 *
 * Returns computed table samples + totals for a config — either the saved
 * draft/published doc (source, defaults to "draft"), or an unsaved config
 * object passed straight from a form so an admin can preview edits before
 * saving them as a draft.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const source: string | undefined = body?.source;
    const step: number | undefined = body?.step;

    let config: XpEngineConfigDoc;

    if (hasCurveShape(body?.config)) {
      config = body.config;
    } else {
      const docId = source === "published" ? XP_ENGINE_PUBLISHED_DOC_ID : XP_ENGINE_DRAFT_DOC_ID;
      const snap = await xpEngineDocRef(docId).get();
      if (!snap.exists) {
        return NextResponse.json({ error: `No ${source === "published" ? "published" : "draft"} config found` }, { status: 404 });
      }
      config = normalizeConfigDoc(snap.data() as XpEngineConfigDoc);
    }

    const table = computeSampleTable(config, step);
    const { warnings } = computeXpEngineSummary(config);

    return NextResponse.json({ ...table, warnings });
  } catch (error: unknown) {
    console.error("Preview XP engine config error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to preview XP engine config";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
