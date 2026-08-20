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

interface CurveNodesEditorProps {
  /** Called after a successful "Save Draft". Callers can use this to close a modal, refresh a parent, etc. */
  onSaved?: () => void;
}

/**
 * The curve + node-distribution editor for the draft config. Shared between
 * the standalone Curve & Nodes tab and the "Edit Draft" modal opened from
 * Overview, so there's one implementation of the editing UI.
 */
export default function CurveNodesEditor({ onSaved }: CurveNodesEditorProps) {
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

  const setBoost = (key: string, value: number) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, boost: value } : r)));
  };

  const handleSave = async () => {
    if (!curve) return;
    if (!adminUid) {
      showToast("You must be signed in as an admin to do this.", "error");
      return;
    }

    // Node structure (levels per node) isn't editable through this tab yet —
    // resend it unchanged so a patch only ever touches curve params / boost.
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
          disabled={isSaving}
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

      {/* Section 1: Node Structure (read-only for now) */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Node Structure</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Read-only for now. Editing node lengths may be added later, but isn&rsquo;t recommended initially.
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              totalValid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            Total: {totalLevels}
          </span>
        </div>
        <ul className="divide-y divide-gray-100">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-medium text-gray-900">Node {row.node}</span>
              <span className="text-gray-700">{row.levels} levels</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Node boost multipliers — separate from the (locked) node structure above */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Node Boost Multipliers</h2>
          <p className="text-xs text-gray-500 mt-0.5">Applies an XP multiplier to every level within a node.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left font-medium text-gray-600 px-4 py-2.5">Node</th>
                <th className="text-left font-medium text-gray-600 px-4 py-2.5">Boost Multiplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="px-4 py-2 font-medium text-gray-900">{row.node}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={row.boost}
                      onChange={(e) => setBoost(row.key, Number(e.target.value))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
