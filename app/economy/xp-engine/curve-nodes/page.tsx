"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/app/store/hooks";
import { computeXpEngineSummary, EXPECTED_MAX_LEVEL } from "@/lib/utils/xpEngineCurve";
import type { XpCurveConfig, XpEngineConfigApiResponse, XpEngineNode } from "@/lib/domain/models/xpEngineConfig";
import Toaster from "@/app/components/ui/Toaster";

const inputClass =
  "w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500";

interface NodeRow {
  key: string;
  node: number;
  levels: number;
  boost: number;
}

function toNodeRows(nodes: XpEngineNode[], nodeBoost: Record<string, number>): NodeRow[] {
  return nodes.map((n) => ({
    key: `${n.node}-${Math.random().toString(36).slice(2, 8)}`,
    node: n.node,
    levels: n.levels,
    boost: nodeBoost?.[String(n.node)] ?? 1,
  }));
}

export default function XpEngineCurveNodesPage() {
  const adminUid = useAppSelector((state) => state.user.uid);

  const [data, setData] = useState<XpEngineConfigApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });

  const [curve, setCurve] = useState<XpCurveConfig | null>(null);
  const [rows, setRows] = useState<NodeRow[]>([]);

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
      if (json.draft) {
        setCurve(json.draft.curve);
        setRows(toNodeRows(json.draft.nodes, json.draft.curve.node_boost));
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid, source: "published" }),
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

  const totalLevels = useMemo(() => rows.reduce((sum, r) => sum + (Number.isFinite(r.levels) ? r.levels : 0), 0), [rows]);
  const totalValid = totalLevels === EXPECTED_MAX_LEVEL;

  const livePreview = useMemo(() => {
    if (!curve) return null;
    const nodes: XpEngineNode[] = rows.map((r) => ({ node: r.node, levels: r.levels }));
    const nodeBoost: Record<string, number> = {};
    rows.forEach((r) => {
      nodeBoost[String(r.node)] = r.boost;
    });
    const previewConfig = {
      curve: { ...curve, node_boost: nodeBoost },
      limits: data?.draft?.limits,
      multipliers: data?.draft?.multipliers,
      nodes,
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
  }, [curve, rows, data]);

  const setCurveField = (field: keyof XpCurveConfig, value: number) => {
    setCurve((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const setRowField = (key: string, field: "levels" | "boost" | "node", value: number) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const addRow = () => {
    const nextNode = rows.length ? Math.max(...rows.map((r) => r.node)) + 1 : 1;
    setRows((prev) => [...prev, { key: `${nextNode}-${Math.random().toString(36).slice(2, 8)}`, node: nextNode, levels: 0, boost: 1 }]);
  };

  const handleSave = async () => {
    if (!curve) return;
    if (!adminUid) {
      showToast("You must be signed in as an admin to do this.", "error");
      return;
    }
    if (!totalValid) {
      showToast(`Total levels must be exactly ${EXPECTED_MAX_LEVEL} (currently ${totalLevels}).`, "error");
      return;
    }

    const nodes: XpEngineNode[] = rows.map((r) => ({ node: r.node, levels: r.levels }));
    const nodeBoost: Record<string, number> = {};
    rows.forEach((r) => {
      nodeBoost[String(r.node)] = r.boost;
    });

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/xp_engine/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid,
          patch: {
            curve: { ...curve, node_boost: nodeBoost },
            nodes,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save draft");
      showToast("Draft saved.");
      await loadConfig();
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
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-64" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>;
  }

  if (!data?.draft || !curve) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
        <p className="mb-3">No draft yet — start one from the published config to edit the curve and nodes.</p>
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
          disabled={isSaving || !totalValid}
          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving…" : "Save Draft"}
        </button>
      </div>

      {/* Curve parameters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Curve Parameters</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <input className={inputClass} value={curve.type} disabled title="Curve type isn't editable in the MVP" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Base XP Value</label>
            <input
              type="number"
              className={inputClass}
              value={curve.base}
              onChange={(e) => setCurveField("base", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Growth Rate</label>
            <input
              type="number"
              step="0.001"
              className={inputClass}
              value={curve.growth}
              onChange={(e) => setCurveField("growth", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Power / Exponent</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={curve.power}
              onChange={(e) => setCurveField("power", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Min XP to Next</label>
            <input
              type="number"
              className={inputClass}
              value={curve.min_xp_to_next}
              onChange={(e) => setCurveField("min_xp_to_next", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Max XP to Next</label>
            <input
              type="number"
              className={inputClass}
              value={curve.max_xp_to_next}
              onChange={(e) => setCurveField("max_xp_to_next", Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Node distribution */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Node Distribution</h2>
            <p className="text-xs text-gray-500 mt-0.5">Redistribute levels between nodes freely — the total is locked at {EXPECTED_MAX_LEVEL}.</p>
          </div>
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              totalValid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            Total: {totalLevels} / {EXPECTED_MAX_LEVEL}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left font-medium text-gray-600 px-4 py-2.5">Node</th>
                <th className="text-left font-medium text-gray-600 px-4 py-2.5">Levels</th>
                <th className="text-left font-medium text-gray-600 px-4 py-2.5">Boost Multiplier</th>
                <th className="text-center font-medium text-gray-600 px-4 py-2.5 w-16">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="px-4 py-2 font-medium text-gray-900">{row.node}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      className={inputClass}
                      value={row.levels}
                      onChange={(e) => setRowField(row.key, "levels", Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={row.boost}
                      onChange={(e) => setRowField(row.key, "boost", Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remove node"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200">
          <button
            type="button"
            onClick={addRow}
            className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            + Add Node
          </button>
        </div>
      </div>

      {/* Live preview */}
      {livePreview && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Live Preview (unsaved)</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <dt className="text-xs text-gray-500">Total Levels</dt>
              <dd className="text-sm font-medium text-gray-900">{livePreview.maxLevel}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Total Cumulative XP</dt>
              <dd className="text-sm font-medium text-gray-900">{livePreview.totalXpToMaxLevel.toLocaleString()} XP</dd>
            </div>
          </dl>
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
