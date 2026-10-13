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

// Short-lived in-memory cache for the PUBLISHED config specifically, since
// it's read on every live XP grant/balance check (unlike the admin routes
// above, which are low-traffic). Invalidated immediately on publish/rollback
// so a newly published curve takes effect on the next request, not after a
// stale window expires.
let publishedConfigCache: { config: XpEngineConfigDoc; timestamp: number } | null = null;
const PUBLISHED_CONFIG_CACHE_MS = 30_000;

export async function loadPublishedConfigCached(): Promise<XpEngineConfigDoc | null> {
  const now = Date.now();
  if (publishedConfigCache && now - publishedConfigCache.timestamp < PUBLISHED_CONFIG_CACHE_MS) {
    return publishedConfigCache.config;
  }
  const snap = await xpEngineDocRef(XP_ENGINE_PUBLISHED_DOC_ID).get();
  if (!snap.exists) return null;
  const config = normalizeConfigDoc(snap.data() as XpEngineConfigDoc);
  publishedConfigCache = { config, timestamp: now };
  return config;
}

export function invalidatePublishedConfigCache(): void {
  publishedConfigCache = null;
}
