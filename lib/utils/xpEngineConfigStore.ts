import { adminDb } from "@/lib/firebase-admin";
import { toIsoOrNull } from "./firestoreTimestamp";
import { computeXpEngineSummary } from "./xpEngineCurve";
import { XpEngineConfigDoc, XpEngineConfigResponse } from "../domain/models/xpEngineConfig";

/**
 * Shared Firestore layout for the XP engine config, used by every
 * app/api/admin/xp_engine/* route so the paths only live in one place.
 *
 * Exactly three fixed documents, always overwritten in place (never a
 * growing history list):
 *
 *   config/xp_engine          — the live, published config
 *   config/xp_engine_draft    — the in-progress draft (admins edit this)
 *   config/xp_engine_version  — the one-step-back backup, written whenever
 *                                xp_engine's data is about to be replaced
 *                                (by publish or rollback), so a rollback is
 *                                always available for the single most recent
 *                                previous published state.
 */
export const XP_ENGINE_CONFIG_COLLECTION = "config";
export const XP_ENGINE_PUBLISHED_DOC_ID = "xp_engine";
export const XP_ENGINE_DRAFT_DOC_ID = "xp_engine_draft";
export const XP_ENGINE_VERSION_DOC_ID = "xp_engine_version";

export function xpEngineDocRef(docId: string) {
  return adminDb.collection(XP_ENGINE_CONFIG_COLLECTION).doc(docId);
}

export function normalizeConfigDoc(data: XpEngineConfigDoc): XpEngineConfigDoc {
  return { ...data, updated_at: toIsoOrNull(data.updated_at) };
}

export function withComputed(data: XpEngineConfigDoc): XpEngineConfigResponse {
  const normalized = normalizeConfigDoc(data);
  return { ...normalized, computed: computeXpEngineSummary(normalized) };
}

export async function loadConfigResponse(docId: string): Promise<XpEngineConfigResponse | null> {
  const snap = await xpEngineDocRef(docId).get();
  if (!snap.exists) return null;
  return withComputed(snap.data() as XpEngineConfigDoc);
}
