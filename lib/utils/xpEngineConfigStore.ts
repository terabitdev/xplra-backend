import { adminDb } from "@/lib/firebase-admin";
import { toIsoOrNull } from "./firestoreTimestamp";
import { computeXpEngineSummary } from "./xpEngineCurve";
import {
  XpEngineConfigDoc,
  XpEngineConfigResponse,
  XpEngineConfigVersion,
} from "../domain/models/xpEngineConfig";

/**
 * Shared Firestore layout for the XP engine config, used by every
 * app/api/admin/xp_engine/config/* route so the paths only live in one place.
 *
 *   config/xp_engine              — the live, published config
 *   config/xp_engine_draft        — the in-progress draft (may not exist)
 *   config/xp_engine/versions/{N} — snapshots archived on every publish/rollback
 */
export const XP_ENGINE_CONFIG_COLLECTION = "config";
export const XP_ENGINE_PUBLISHED_DOC_ID = "xp_engine";
export const XP_ENGINE_DRAFT_DOC_ID = "xp_engine_draft";
export const XP_ENGINE_VERSIONS_SUBCOLLECTION = "versions";

export function xpEngineDocRef(docId: string) {
  return adminDb.collection(XP_ENGINE_CONFIG_COLLECTION).doc(docId);
}

export function xpEngineVersionsRef() {
  return xpEngineDocRef(XP_ENGINE_PUBLISHED_DOC_ID).collection(XP_ENGINE_VERSIONS_SUBCOLLECTION);
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

export async function countVersionHistory(): Promise<number> {
  const snap = await xpEngineVersionsRef().get();
  return snap.size;
}

export async function listVersionHistory(): Promise<XpEngineConfigVersion[]> {
  const snap = await xpEngineVersionsRef().orderBy("version", "desc").get();
  return snap.docs.map((doc) => {
    const data = doc.data() as XpEngineConfigDoc & { archived_at?: unknown };
    return {
      ...normalizeConfigDoc(data),
      archived_at: toIsoOrNull(data.archived_at),
    };
  });
}
