"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/app/store/hooks";
import type { XpEngineConfigApiResponse } from "@/lib/domain/models/xpEngineConfig";
import { authHeaders } from "@/lib/utils/authHeaders";
import Toaster from "@/app/components/ui/Toaster";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface VersionHistoryEntry {
  version: number;
  action: "publish" | "rollback";
  restored_from_version?: number;
  config: { curve: { base: number; growth: number; power: number } } | null;
  table_hash: string | null;
  total_xp_to_max: number | null;
  impact: { scanned: number; changedVsLive: number; upVsLive: number; downVsLive: number } | null;
  published_by: string;
  published_at: string | null;
}

/**
 * Two things on this tab:
 *  - the one-step-back backup (config/xp_engine_version), restorable via the
 *    same "Rollback" action as the Overview tab's button
 *  - the full, immutable history (xp_engine_versions/{version}) of every
 *    publish and rollback ever performed, for audit — this never gets
 *    trimmed down to a single slot, per the client's "the one-backup
 *    instruction no longer applies"
 */
export default function XpEngineVersionHistoryPage() {
  const adminUid = useAppSelector((state) => state.user.uid);

  const [data, setData] = useState<XpEngineConfigApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<VersionHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type, isVisible: true });

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/xp_engine/config");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load version backup");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load version backup");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const res = await fetch("/api/admin/xp_engine/versions", { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load version history");
      setHistory(json.versions || []);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Failed to load version history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadHistory();
  }, [loadConfig, loadHistory]);

  const handleRollback = async () => {
    if (!adminUid) {
      showToast("You must be signed in as an admin to do this.", "error");
      return;
    }

    setIsRollingBack(true);
    try {
      const res = await fetch("/api/admin/xp_engine/rollback", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to roll back config");
      showToast(`Rolled back — the previous published config is live again as v${json.published?.version}.`);
      setShowRollbackConfirm(false);
      await Promise.all([loadConfig(), loadHistory()]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to roll back config", "error");
    } finally {
      setIsRollingBack(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
        {error}
      </div>
    );
  }

  const backup = data?.version;

  return (
    <div className="space-y-4">
      {backup ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Previous Version (one step back)</h2>
            <button
              type="button"
              onClick={() => setShowRollbackConfirm(true)}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Rollback to This
            </button>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <dt className="text-xs text-gray-500">Version</dt>
              <dd className="text-sm font-medium text-gray-900">v{backup.version}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Curve (base / growth / power)</dt>
              <dd className="text-sm font-medium text-gray-900">
                {backup.curve.base} / {backup.curve.growth} / {backup.curve.power}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Updated By</dt>
              <dd className="text-sm font-medium text-gray-900">{backup.updated_by || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Backed Up At</dt>
              <dd className="text-sm font-medium text-gray-900">{formatDateTime(backup.updated_at)}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
          No previous version to roll back to yet. A backup is created automatically the first time a draft is
          published.
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Full Version History</h2>
        {historyLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-full" />
          </div>
        ) : historyError ? (
          <p className="text-sm text-red-600">{historyError}</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-500">
            No history yet — every publish and rollback from now on is recorded here permanently.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-4">Version</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Curve</th>
                  <th className="py-2 pr-4">Total XP to Max</th>
                  <th className="py-2 pr-4">Player Impact</th>
                  <th className="py-2 pr-4">Table Hash</th>
                  <th className="py-2 pr-4">By</th>
                  <th className="py-2 pr-4">When</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.version} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-900">v{entry.version}</td>
                    <td className="py-2 pr-4 capitalize text-gray-700">
                      {entry.action}
                      {entry.action === "rollback" && entry.restored_from_version != null
                        ? ` (from v${entry.restored_from_version})`
                        : ""}
                    </td>
                    <td className="py-2 pr-4 text-gray-700">
                      {entry.config
                        ? `${entry.config.curve.base} / ${entry.config.curve.growth} / ${entry.config.curve.power}`
                        : "—"}
                    </td>
                    <td className="py-2 pr-4 text-gray-700">
                      {entry.total_xp_to_max != null ? entry.total_xp_to_max.toLocaleString() : "—"}
                    </td>
                    <td className="py-2 pr-4 text-gray-700">
                      {entry.impact
                        ? `${entry.impact.scanned} scanned, ${entry.impact.changedVsLive} changed (${entry.impact.upVsLive}↑ / ${entry.impact.downVsLive}↓)`
                        : "—"}
                    </td>
                    <td className="py-2 pr-4 text-gray-500 font-mono text-xs">
                      {entry.table_hash ? entry.table_hash.slice(0, 10) : "—"}
                    </td>
                    <td className="py-2 pr-4 text-gray-700">{entry.published_by || "—"}</td>
                    <td className="py-2 pr-4 text-gray-700">{formatDateTime(entry.published_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showRollbackConfirm}
        onClose={() => setShowRollbackConfirm(false)}
        onConfirm={handleRollback}
        title="Roll back to the previous version?"
        message="This restores the backed-up config as the live XP config. The config it replaces becomes the new backup, so rolling back again would undo this."
        confirmLabel="Roll Back"
        confirmingLabel="Rolling back…"
        tone="danger"
        isConfirming={isRollingBack}
      />

      <Toaster
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((t) => ({ ...t, isVisible: false }))}
      />
    </div>
  );
}
