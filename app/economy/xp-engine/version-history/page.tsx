"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/app/store/hooks";
import type { XpEngineConfigApiResponse } from "@/lib/domain/models/xpEngineConfig";
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

/**
 * There's no growing version list — just one backup slot (config/xp_engine_version),
 * overwritten whenever the live config gets replaced by a publish or rollback.
 * This tab shows that one backup and lets you restore it, same action as the
 * "Rollback" button on Overview.
 */
export default function XpEngineVersionHistoryPage() {
  const adminUid = useAppSelector((state) => state.user.uid);

  const [data, setData] = useState<XpEngineConfigApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleRollback = async () => {
    if (!adminUid) {
      showToast("You must be signed in as an admin to do this.", "error");
      return;
    }

    setIsRollingBack(true);
    try {
      const res = await fetch("/api/admin/xp_engine/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to roll back config");
      showToast(`Rolled back — the previous published config is live again as v${json.published?.version}.`);
      setShowRollbackConfirm(false);
      await loadConfig();
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

  if (!backup) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
        No previous version to roll back to yet. A backup is created automatically the first time a draft is
        published.
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
