'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { grantManualXp } from '../../store/slices/xpLedgerSlice';
import { AppDispatch } from '../../store';
import { Close } from '@carbon/icons-react';
import { GrantManualXpResult } from '@/lib/utils/grantManualXp';

interface XpAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: GrantManualXpResult) => void;
  uid: string;
}

function generateRequestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function XpAdjustmentModal({ isOpen, onClose, onSuccess, uid }: XpAdjustmentModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState('');
  const [relatedEntityId, setRelatedEntityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Generated once when the form opens, and reused on every retry/double-click
  // for this open session, so a network retry can't pay the same grant twice.
  const [requestId, setRequestId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRequestId(generateRequestId());
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountValue = Number(amount);
    if (!amount.trim() || !Number.isInteger(amountValue) || amountValue < 1) {
      setError('Enter a positive whole number to add XP');
      return;
    }
    if (amountValue > 10000) {
      setError('XP amount cannot exceed 10,000 per adjustment');
      return;
    }
    if (!reason.trim()) {
      setError('Description is required');
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(
        grantManualXp({
          uid,
          amount: amountValue,
          reason: reason.trim(),
          requestId,
          relatedEntityId: relatedEntityId.trim() || undefined,
        })
      ).unwrap();

      // Reset form
      setAmount('');
      setReason('');
      setRelatedEntityId('');
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      const errorMessage = typeof err === 'string' ? err : 'Failed to grant XP';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setReason('');
      setRelatedEntityId('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Adjust XP</h2>
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors" disabled={loading}>
            <Close size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* User ID (Read-only) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">User ID</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono"
              value={uid}
              readOnly
            />
          </div>

          {/* XP Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">XP Amount *</label>
            <input
              type="number"
              min={1}
              max={10000}
              step={1}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
              placeholder="e.g. 50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a positive number to add XP. Deducting XP isn&apos;t supported here — that&apos;s a separate reversal
              operation tied to a specific ledger entry.
            </p>
          </div>

          {/* Transaction Type — fixed to Admin Adjustment. The game already pays
              quest/achievement/login/referral/contribution XP automatically, so
              an admin picking one of those here would double-pay the player. */}
          <input type="hidden" value="Admin Adjustment" />

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              required
              disabled={loading}
              placeholder="Explain the reason for this adjustment"
            />
          </div>

          {/* Related Entity ID (Optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Related Entity ID (Optional)</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              value={relatedEntityId}
              onChange={(e) => setRelatedEntityId(e.target.value)}
              maxLength={200}
              disabled={loading}
              placeholder="quest_xxx, place_xxx, etc."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Apply Adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
}
