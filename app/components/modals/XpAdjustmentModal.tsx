'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createXpLedgerEntry } from '../../store/slices/xpLedgerSlice';
import { AppDispatch } from '../../store';
import { Close } from '@carbon/icons-react';
import { XpLedgerType } from '@/lib/domain/models/xpLedger';

interface XpAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  uid: string;
}

export default function XpAdjustmentModal({ isOpen, onClose, onSuccess, uid }: XpAdjustmentModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [xpDelta, setXpDelta] = useState<string>('');
  const [type, setType] = useState<XpLedgerType>('admin_adjustment');
  const [description, setDescription] = useState('');
  const [relatedEntityId, setRelatedEntityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const xpValue = parseInt(xpDelta, 10);
    if (isNaN(xpValue)) {
      setError('Please enter a valid number for XP');
      setLoading(false);
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      setLoading(false);
      return;
    }

    try {
      // Generate idempotency key
      const idempotencyKey = `manual_${uid}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      await dispatch(createXpLedgerEntry({
        uid,
        xpDelta: xpValue,
        type,
        description: description.trim(),
        relatedEntityId: relatedEntityId.trim() || undefined,
        idempotencyKey,
        adminUid: 'admin_placeholder', // Should come from auth context
      })).unwrap();

      // Reset form
      setXpDelta('');
      setType('admin_adjustment');
      setDescription('');
      setRelatedEntityId('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMessage = typeof err === 'string' ? err : 'Failed to adjust XP';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setXpDelta('');
      setType('admin_adjustment');
      setDescription('');
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

          {/* XP Delta */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">XP Amount *</label>
            <input
              type="number"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={xpDelta}
              onChange={(e) => setXpDelta(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter XP (+ or -)"
            />
            <p className="text-xs text-gray-500 mt-1">Use positive for adding, negative for deducting</p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Transaction Type *</label>
            <select
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={type}
              onChange={(e) => setType(e.target.value as XpLedgerType)}
              disabled={loading}
            >
              <option value="admin_adjustment">Admin Adjustment</option>
              <option value="quest_complete">Quest Complete</option>
              <option value="quest_first_completion_bonus">First Completion Bonus</option>
              <option value="place_contribution_approved">Place Contribution Approved</option>
              <option value="daily_login">Daily Login</option>
              <option value="referral_bonus">Referral Bonus</option>
              <option value="achievement_unlock">Achievement Unlock</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
