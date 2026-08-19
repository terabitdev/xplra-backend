"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function XpEngineOverviewPage() {
  const router = useRouter();
  const adminUid = useAppSelector((state) => state.user.uid);

  const [data, setData] = useState<XpEngineConfigApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type, isVisible: true });

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/xp_engine/config");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load XP engine config");
      setData(json);
      return json as XpEngineConfigApiResponse;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load XP engine config");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const requireAdminUid = () => {
    if (!adminUid) {
      showToast("You must be signed in as an admin to do this.", "error");
      return false;
    }
    return true;
  };

  const duplicateDraft = async (): Promise<boolean> => {
    if (!requireAdminUid()) return false;
    try {
      const res = await fetch("/api/admin/xp_engine/config/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to duplicate config");
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to duplicate config", "error");
      return false;
    }
  };

  const handleDuplicateConfig = async () => {
    setIsDuplicating(true);
    const ok = await duplicateDraft();
    if (ok) {
      showToast("Draft created from the published config.");
      await loadConfig();
    }
    setIsDuplicating(false);
  };

  const handleEditDraft = async () => {
    setIsEditingDraft(true);
    if (data?.draft) {
      router.push("/economy/xp-engine/curve-nodes");
      setIsEditingDraft(false);
      return;
    }
    const ok = await duplicateDraft();
    if (ok) {
      showToast("Draft created from the published config.");
      router.push("/economy/xp-engine/curve-nodes");
    }
    setIsEditingDraft(false);
  };

  const handlePublish = async () => {
    if (!requireAdminUid()) return;
    setIsPublishing(true);
    try {
      const res = await fetch("/api/admin/xp_engine/config/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to publish config");
      showToast("Draft published — this is now the live XP config.");
      setShowPublishConfirm(false);
      await loadConfig();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to publish config", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 h-20">
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-40" />
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

  const config = data?.published;
  const hasDraft = !!data?.draft;
  const hasVersionHistory = (data?.versionHistoryCount ?? 0) > 0;

  if (!config) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
        No published XP engine config found at <code>config/xp_engine</code>.
      </div>
    );
  }

  const { curve, computed } = config;

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleEditDraft}
          disabled={isEditingDraft}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEditingDraft ? "Opening…" : "Edit Draft"}
        </button>
        <button
          type="button"
          onClick={handleDuplicateConfig}
          disabled={isDuplicating}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={hasDraft ? "Overwrite the current draft with a copy of the published config" : "Create a draft from the published config"}
        >
          {isDuplicating ? "Duplicating…" : "Duplicate Config"}
        </button>
        <button
          type="button"
          onClick={() => setShowPublishConfirm(true)}
          disabled={!hasDraft}
          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={hasDraft ? undefined : "No draft to publish — duplicate or edit a draft first"}
        >
          Publish
        </button>
        {hasVersionHistory && (
          <Link
            href="/economy/xp-engine/version-history"
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Rollback
          </Link>
        )}
        {!hasDraft && (
          <span className="text-xs text-gray-500">No draft yet — Duplicate Config or Edit Draft to start one.</span>
        )}
      </div>

      {/* Configuration status / version */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Configuration Status</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <dt className="text-xs text-gray-500">Published Config Version</dt>
            <dd className="text-sm font-medium text-gray-900">v{config.version}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Status</dt>
            <dd>
              <span
                className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${
                  config.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {config.published ? "Published" : "Draft"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Last Updated By</dt>
            <dd className="text-sm font-medium text-gray-900">{config.updated_by || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Last Updated Date/Time</dt>
            <dd className="text-sm font-medium text-gray-900">{formatDateTime(config.updated_at)}</dd>
          </div>
        </dl>
      </div>

      {/* XP curve summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">XP Curve Summary</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <dt className="text-xs text-gray-500">Base XP Value</dt>
            <dd className="text-sm font-medium text-gray-900">{curve.base}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Growth Rate</dt>
            <dd className="text-sm font-medium text-gray-900">{curve.growth}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Power / Exponent</dt>
            <dd className="text-sm font-medium text-gray-900">{curve.power}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Total Number of Levels</dt>
            <dd className="text-sm font-medium text-gray-900">{computed.maxLevel}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Total Cumulative XP to Level {computed.maxLevel}</dt>
            <dd className="text-sm font-medium text-gray-900">{computed.totalXpToMaxLevel.toLocaleString()} XP</dd>
          </div>
        </dl>
      </div>

      {/* Key progression checkpoints */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Key Progression Checkpoints</h2>
          <p className="text-xs text-gray-500 mt-0.5">Computed from the active curve, not manually entered.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left font-medium text-gray-600 px-4 py-2.5">Level</th>
                <th className="text-left font-medium text-gray-600 px-4 py-2.5">XP Required for Next Level</th>
                <th className="text-left font-medium text-gray-600 px-4 py-2.5">Cumulative XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {computed.keyPoints.map((kp) => (
                <tr key={kp.level} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-gray-900">L{kp.level}</td>
                  <td className="px-4 py-2.5 text-gray-700">{kp.xpToNext.toLocaleString()} XP</td>
                  <td className="px-4 py-2.5 text-gray-700">{kp.cumulativeXp.toLocaleString()} XP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation / warnings */}
      {computed.warnings.length > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-amber-800 mb-2">Validation Warnings</h2>
          <ul className="list-disc list-inside space-y-1">
            {computed.warnings.map((warning, i) => (
              <li key={i} className="text-sm text-amber-800">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-green-800">Configuration valid — no issues detected.</p>
        </div>
      )}

      <ConfirmDialog
        isOpen={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)}
        onConfirm={handlePublish}
        title="Publish this draft?"
        message="This replaces the live XP config used to calculate XP for all players. The current published config will be archived to version history."
        confirmLabel="Publish"
        confirmingLabel="Publishing…"
        isConfirming={isPublishing}
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
