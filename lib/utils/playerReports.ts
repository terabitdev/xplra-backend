import { adminDb } from "@/lib/firebase-admin";
import { toIsoOrNull } from "./firestoreTimestamp";
import {
  ModerationAction,
  PlayerReport,
  PlayerReportUserInfo,
} from "@/lib/domain/models/playerReport";

export const USER_REPORTS_COLLECTION = "user_reports";
export const MODERATION_ACTIONS_COLLECTION = "moderation_actions";
export const USERS_COLLECTION = "users";

interface RawUserReportDoc {
  reporter_uid?: string;
  reported_uid?: string;
  reason?: string;
  details?: unknown;
  source_screen?: string;
  status?: string;
  resolution?: string;
  resolution_note?: string;
  reviewed_at?: unknown;
  reviewed_by?: string | null;
  created_at?: unknown;
}

export async function loadUserInfo(uid: string): Promise<PlayerReportUserInfo | null> {
  if (!uid) return null;
  const snap = await adminDb.collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data() || {};
  return {
    uid,
    name: d.name || d.display_name || "",
    email: d.email || "",
    username: d.username || "",
    accountStatus: d.account_status || "ACTIVE",
  };
}

export async function loadUserInfoMap(uids: string[]): Promise<Map<string, PlayerReportUserInfo>> {
  const uniqueUids = Array.from(new Set(uids.filter(Boolean)));
  const map = new Map<string, PlayerReportUserInfo>();
  await Promise.all(
    uniqueUids.map(async (uid) => {
      const info = await loadUserInfo(uid);
      if (info) map.set(uid, info);
    })
  );
  return map;
}

export function toPlayerReport(
  id: string,
  d: RawUserReportDoc,
  reporter: PlayerReportUserInfo | null,
  reported: PlayerReportUserInfo | null
): PlayerReport {
  return {
    id,
    reporterUid: d.reporter_uid || "",
    reporter,
    reportedUid: d.reported_uid || "",
    reported,
    reason: d.reason || "",
    details: typeof d.details === "string" ? d.details : null,
    sourceScreen: d.source_screen || "",
    status: d.status || "OPEN",
    resolution: d.resolution || "",
    resolutionNote: typeof d.resolution_note === "string" ? d.resolution_note : null,
    reviewedAt: toIsoOrNull(d.reviewed_at),
    reviewedBy: d.reviewed_by || null,
    createdAt: toIsoOrNull(d.created_at) || "",
  };
}

export async function loadModerationHistory(uid: string): Promise<ModerationAction[]> {
  // Sorted in memory rather than via .orderBy() so this doesn't need a new
  // Firestore composite index (uid == + createdAt desc) deployed up front.
  const snap = await adminDb.collection(MODERATION_ACTIONS_COLLECTION).where("uid", "==", uid).get();

  const actions = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      uid: d.uid || "",
      action: d.action || "",
      reason: d.reason || "",
      reportId: d.reportId || "",
      adminUid: d.adminUid || "",
      createdAt: toIsoOrNull(d.createdAt) || "",
    };
  });

  return actions.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
