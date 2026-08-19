"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/app/store/hooks";
import type { XpEngineConfigVersion } from "@/lib/domain/models/xpEngineConfig";
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

export default function XpEngineVersionHistoryPage() {
  const adminUid = useAppSelector((state) => state.user.uid);

  const [versions, setVersions] = useState<XpEngineConfigVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rollbackTarget, setRollbackTarget] = useState<number | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type, isVisible: true });

  const loadVersions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/xp_engine/config/versions");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load version history");
      setVersions(json.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load version history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const handleRollback = async () => {
    if (rollbackTarget === null) return;
    if (!adminUid) {
      showToast("You must be signed in as an admin to do this.", "error");
      return;
    }

    setIsRollingBack(true);
    try {
      const res = await fetch("/api/admin/xp_engine/config/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: rollbackTarget, adminUid }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to roll back config");
      showToast(`Rolled back to version ${rollbackTarget} — it's now live as v${json.published?.version}.`);
      setRollbackTarget(null);
      await loadVersions();
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
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
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

  if (versions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
        No archived versions yet. Versions are created automatically whenever a draft is published or the config is
        rolled back.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left font-medium text-gray-600 px-4 py-2.5">Version</th>
                <th className="text-left font-medium text-gray-600 px-4 py-2.5">Curve (base / growth / power)</th>
                <th className="text-left font-medium text-gray-600 px-4 py-2.5">Updated By</th>
                <th className="text-left font-medium text-gray-600 px-4 py-2.5">Archived At</th>
                <th className="text-center font-medium text-gray-600 px-4 py-2.5 w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {versions.map((v) => (
                <tr key={v.version} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-gray-900">v{v.version}</td>
                  <td className="px-4 py-2.5 text-gray-700">
                    {v.curve.base} / {v.curve.growth} / {v.curve.power}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{v.updated_by || "—"}</td>
                  <td className="px-4 py-2.5 text-gray-700">{formatDateTime(v.archived_at)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setRollbackTarget(v.version)}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        Rollback to this
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={rollbackTarget !== null}
        onClose={() => setRollbackTarget(null)}
        onConfirm={handleRollback}
        title={`Roll back to version ${rollbackTarget ?? ""}?`}
        message="This replaces the live XP config with this archived version. The current published config will be archived first, so this can be undone."
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
