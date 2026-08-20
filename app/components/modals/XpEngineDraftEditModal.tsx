"use client";

import { Close } from "@carbon/icons-react";
import CurveNodesEditor from "@/app/economy/xp-engine/CurveNodesEditor";

interface XpEngineDraftEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful save, so the caller (Overview) can refresh its own data. */
  onSaved?: () => void;
}

export default function XpEngineDraftEditModal({ isOpen, onClose, onSaved }: XpEngineDraftEditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Draft — Curve &amp; Nodes</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <Close size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <CurveNodesEditor onSaved={onSaved} />
        </div>
      </div>
    </div>
  );
}
