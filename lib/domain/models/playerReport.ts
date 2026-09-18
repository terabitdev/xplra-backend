/**
 * Player Reports (moderation) domain model
 * Firestore: collection "user_reports" (same source data as the simpler
 * "User Reports" tab), plus a "moderation_actions" collection created here
 * to log warnings/suspensions/bans and power the report-history panel.
 */

export interface PlayerReportUserInfo {
  uid: string;
  name: string;
  email: string;
  username: string;
  accountStatus: string;
}

/** As stored on the report doc. OPEN is the default until an admin resolves it. */
export type PlayerReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

/** What the admin decided. Empty until a report is resolved. */
export type PlayerReportResolution =
  | ""
  | "INSUFFICIENT_EVIDENCE"
  | "WARNING_ISSUED"
  | "SUSPENDED"
  | "BANNED";

/** The action an admin can take from the Report Detail view. */
export type PlayerReportDecision = "DISMISS" | "WARN" | "SUSPEND" | "BAN";

export type ModerationActionType = "WARNING" | "SUSPENSION" | "BAN";

export interface PlayerReport {
  id: string;
  reporterUid: string;
  reporter: PlayerReportUserInfo | null;
  reportedUid: string;
  reported: PlayerReportUserInfo | null;
  reason: string;
  details: string | null;
  sourceScreen: string;
  status: string;
  resolution: string;
  resolutionNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

/** One other report filed against the same reported player. */
export interface ReportHistoryEntry {
  id: string;
  reason: string;
  status: string;
  resolution: string;
  createdAt: string;
}

export interface ReportHistorySummary {
  /** Count of other reports against this player in the last 90 days (excludes the report being viewed). */
  last90DaysCount: number;
  entries: ReportHistoryEntry[];
}

/** A logged warning/suspension/ban, independent of which report triggered it. */
export interface ModerationAction {
  id: string;
  uid: string;
  action: string;
  reason: string;
  reportId: string;
  adminUid: string;
  createdAt: string;
}

export interface PlayerReportDetail {
  report: PlayerReport;
  reportHistory: ReportHistorySummary;
  moderationHistory: ModerationAction[];
}
