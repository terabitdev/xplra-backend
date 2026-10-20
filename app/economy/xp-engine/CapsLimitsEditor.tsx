"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/app/store/hooks";
import { computeXpEngineSummary } from "@/lib/utils/xpEngineCurve";
import { authHeaders } from "@/lib/utils/authHeaders";
import type { XpEngineConfigApiResponse, XpEngineLimits } from "@/lib/domain/models/xpEngineConfig";
import Toaster from "@/app/components/ui/Toaster";

const inputClass =
  "w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500";

interface CapsLimitsEditorProps {
  /** Called after a successful "Save Draft". */
  onSaved?: () => void;
}

/**
 * Editor for the draft config's `limits` object — daily/rate caps, soft-cap
 * dampening, and the per-source daily caps (limits.source_caps). Shared
 * between the standalone Caps & Limits tab and any future modal, same
 * pattern as CurveNodesEditor.
 */
export default function CapsLimitsEditor({ onSaved }: CapsLimitsEditorProps) {
  const adminUid = useAppSelector((state) => state.user.uid);

  const [data, setData] = useState<XpEngineConfigApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });

  const [limits, setLimits] = useState<XpEngineLimits | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type, isVisible: true });

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/xp_engine/config", { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load XP engine config");
      setData(json);
      if (json.draft) {
        setLimits(json.draft.limits);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load XP engine config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleCreateDraft = async () => {
    if (!adminUid) {
      showToast("You must be signed in as an admin to do this.", "error");
      return;
    }
    setIsCreatingDraft(true);
    try {
      const res = await fetch("/api/admin/xp_engine/draft", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ source: "published" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create draft");
      showToast("Draft created from the published config.");
      await loadConfig();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to create draft", "error");
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const livePreview = useMemo(() => {
    if (!limits || !data?.draft) return null;
    const previewConfig = {
      curve: data.draft.curve,
      limits,
      multipliers: data.draft.multipliers,
      nodes: data.draft.nodes,
      published: false,
      updated_at: null,
      updated_by: "",
      version: 0,
    };
    try {
      return computeXpEngineSummary(previewConfig as never);
    } catch {
      return null;
    }
  }, [limits, data]);

  const setLimitField = (field: keyof Omit<XpEngineLimits, "source_caps">, value: number) => {
    setLimits((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const setSourceCapField = (field: keyof XpEngineLimits["source_caps"], value: number) => {
    setLimits((prev) => (prev ? { ...prev, source_caps: { ...prev.source_caps, [field]: value } } : prev));
  };

  const handleSave = async () => {
    if (!limits) return;
    if (!adminUid) {
      showToast("You must be signed in as an admin to do this.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/xp_engine/draft", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          patch: { limits },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save draft");
      showToast("Draft saved.");
      await loadConfig();
      onSaved?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save draft", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-40" />
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-40" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>;
  }

  if (!data?.draft || !limits) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
        <p className="mb-3">No draft yet — start one from the published config to edit caps and limits.</p>
        <button
          type="button"
          onClick={handleCreateDraft}
          disabled={isCreatingDraft}
          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {isCreatingDraft ? "Creating…" : "Create Draft from Published Config"}
        </button>
        <Toaster
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast((t) => ({ ...t, isVisible: false }))}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Editing the draft. Publish it from Overview once you&rsquo;re happy with it.</p>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving…" : "Save Draft"}
        </button>
      </div>

      {/* Daily / rate caps */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Daily &amp; Rate Caps</h2>
        <p className="text-xs text-gray-500 mb-4">Account-wide limits, independent of where the XP came from.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Daily XP Cap (Soft)</label>
            <input
              type="number"
              className={inputClass}
              value={limits.daily_xp_cap_soft}
              onChange={(e) => setLimitField("daily_xp_cap_soft", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Daily XP Cap (Hard)</label>
            <input
              type="number"
              className={inputClass}
              value={limits.daily_xp_cap_hard}
              onChange={(e) => setLimitField("daily_xp_cap_hard", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Soft-Cap Dampening</label>
            <input
              type="number"
              step="0.01"
              min={0}
              max={1}
              className={inputClass}
              value={limits.soft_cap_dampening}
              onChange={(e) => setLimitField("soft_cap_dampening", Number(e.target.value))}
            />
            <p className="text-[11px] text-gray-400 mt-1">0–1. How much XP earned past the soft cap is reduced by.</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Grant Rate Limit / min</label>
            <input
              type="number"
              className={inputClass}
              value={limits.grant_rate_limit_per_min}
              onChange={(e) => setLimitField("grant_rate_limit_per_min", Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Per-source daily caps */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Per-Source Daily Caps</h2>
        <p className="text-xs text-gray-500 mb-4">Maximum XP-earning actions per day, per source.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Place Check-ins / day</label>
            <input
              type="number"
              className={inputClass}
              value={limits.source_caps.place_checkin_per_day}
              onChange={(e) => setSourceCapField("place_checkin_per_day", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Event Check-ins / day</label>
            <input
              type="number"
              className={inputClass}
              value={limits.source_caps.event_checkin_per_day}
              onChange={(e) => setSourceCapField("event_checkin_per_day", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Promo Grants / day</label>
            <input
              type="number"
              className={inputClass}
              value={limits.source_caps.promo_per_day}
              onChange={(e) => setSourceCapField("promo_per_day", Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Live validation */}
      {livePreview && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Validation (unsaved)</h2>
          {livePreview.warnings.length > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <ul className="list-disc list-inside space-y-1">
                {livePreview.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-amber-800">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-medium text-green-800">Configuration valid — no issues detected.</p>
            </div>
          )}
        </div>
      )}

      <Toaster
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((t) => ({ ...t, isVisible: false }))}
      />
    </div>
  );
}
