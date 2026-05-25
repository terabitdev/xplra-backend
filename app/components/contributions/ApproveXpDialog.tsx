'use client';

import { useEffect, useState } from 'react';

interface ApproveXpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (contributionXp: number) => void | Promise<void>;
  loading?: boolean;
}

export default function ApproveXpDialog({ isOpen, onClose, onConfirm, loading }: ApproveXpDialogProps) {
  const [xp, setXp] = useState<string>('');

  useEffect(() => {
    if (!isOpen) setXp('');
  }, [isOpen]);

  if (!isOpen) return null;

  const parsed = Number(xp);
  const isValid = xp.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 && !loading;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-3" onMouseDown={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Approve Contribution</h2>
          <p className="text-xs text-gray-500 mt-0.5">Set the XP reward for this contributor.</p>
        </div>

        <div className="p-4 space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            Contribution XP <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={xp}
            onChange={(e) => setXp(e.target.value)}
            placeholder="25"
            disabled={loading}
          />
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => isValid && onConfirm(parsed)}
            disabled={!isValid}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Approving…' : 'Confirm Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}
