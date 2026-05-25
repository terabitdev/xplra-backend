'use client';

import { useEffect, useState } from 'react';

interface RejectConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rejectionReason: string) => void | Promise<void>;
  loading?: boolean;
}

export default function RejectConfirmDialog({ isOpen, onClose, onConfirm, loading }: RejectConfirmDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) setReason('');
  }, [isOpen]);

  if (!isOpen) return null;

  const canConfirm = reason.trim().length > 0 && !loading;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-3" onMouseDown={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Reject this contribution?</h2>
          <p className="text-xs text-gray-500 mt-0.5">This action is permanent and cannot be undone.</p>
        </div>

        <div className="p-4 space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Image quality is too low, location appears incorrect..."
            disabled={loading}
          />
          <p className="text-xs text-gray-500">This message will be visible to the user in the app.</p>
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
            onClick={() => canConfirm && onConfirm(reason.trim())}
            disabled={!canConfirm}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Rejecting…' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
