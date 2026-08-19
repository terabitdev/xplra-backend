import { NextRequest, NextResponse } from "next/server";
import { computeSimulation } from "@/lib/utils/xpEngineCurve";
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
 * POST /api/admin/xp_engine/simulate
 * Body: { source?: "draft" | "published", config?: XpEngineConfigDoc, targetLevel?: number, dailyXpEarned?: number }
 *
 * Returns time-to-target-level estimates. See the ASSUMPTION comment on
 * computeSimulation() in lib/utils/xpEngineCurve.ts for the methodology —
 * there's no per-action XP value in the schema, so this is derived from the
 * daily XP caps instead, plus an optional caller-supplied daily XP rate.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const source: string | undefined = body?.source;
    const targetLevel: number | undefined = body?.targetLevel;
    const dailyXpEarned: number | undefined = body?.dailyXpEarned;

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

    const result = computeSimulation(config, { targetLevel, dailyXpEarned });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Simulate XP engine config error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to simulate XP engine config";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
