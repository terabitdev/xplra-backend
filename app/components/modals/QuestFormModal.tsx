'use client';

import { useState, useEffect } from 'react';
import { Quest } from '@/lib/domain/models/quest';
import { Close } from '@carbon/icons-react';

interface QuestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quest: Partial<Quest>) => Promise<void>;
  quest?: Quest | null;
}

export default function QuestFormModal({
  isOpen,
  onClose,
  onSubmit,
  quest: initialQuest,
}: QuestFormModalProps) {
  const [quest, setQuest] = useState<Partial<Quest>>({
    title: '',
    description: '',
    placeId: null,
    type: 'qr_scan',
    xpReward: 0,
    cooldownSeconds: 3600,
    active: true,
    requirements: {},
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialQuest) {
      setQuest(initialQuest);
    } else {
      // Reset form for new quest
      setQuest({
        title: '',
        description: '',
        placeId: null,
        type: 'qr_scan',
        xpReward: 0,
        cooldownSeconds: 3600,
        active: true,
        requirements: {},
      });
    }
  }, [initialQuest, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(quest);
      onClose();
    } catch (error) {
      console.error('Error submitting quest:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900 flex-1 min-w-0 pr-4">
            {initialQuest ? 'Edit Quest' : 'Create New Quest'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            disabled={loading}
          >
            <Close size={24} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide" style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={quest.title || ''}
              onChange={(e) => setQuest({ ...quest, title: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={quest.description || ''}
              onChange={(e) => setQuest({ ...quest, description: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Place ID */}
          <div>
            <label htmlFor="placeId" className="block text-sm font-medium text-gray-700 mb-2">
              Place ID
            </label>
            <input
              type="text"
              id="placeId"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={quest.placeId || ''}
              onChange={(e) => setQuest({ ...quest, placeId: e.target.value || null })}
              placeholder="Optional - Link to a place"
              disabled={loading}
            />
          </div>

          {/* Type and XP Reward Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quest Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Quest Type *
              </label>
              <select
                id="type"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={quest.type || 'qr_scan'}
                onChange={(e) => setQuest({ ...quest, type: e.target.value as Quest['type'] })}
                required
                disabled={loading}
              >
                <option value="qr_scan">QR Scan</option>
                <option value="gps_verify">GPS Verify</option>
                <option value="checkin_time">Check-in Time</option>
                <option value="checkin_proof">Check-in Proof</option>
              </select>
            </div>

            {/* XP Reward */}
            <div>
              <label htmlFor="xpReward" className="block text-sm font-medium text-gray-700 mb-2">
                XP Reward *
              </label>
              <input
                type="number"
                id="xpReward"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={quest.xpReward || 0}
                onChange={(e) => setQuest({ ...quest, xpReward: parseInt(e.target.value) || 0 })}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Cooldown */}
          <div>
            <label htmlFor="cooldownSeconds" className="block text-sm font-medium text-gray-700 mb-2">
              Cooldown (seconds) *
            </label>
            <input
              type="number"
              id="cooldownSeconds"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={quest.cooldownSeconds || 3600}
              onChange={(e) => setQuest({ ...quest, cooldownSeconds: parseInt(e.target.value) || 0 })}
              required
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              {quest.cooldownSeconds ? `${Math.floor((quest.cooldownSeconds || 0) / 3600)} hours, ${Math.floor(((quest.cooldownSeconds || 0) % 3600) / 60)} minutes` : ''}
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={quest.active ?? true}
              onChange={(e) => setQuest({ ...quest, active: e.target.checked })}
              disabled={loading}
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
              Active Quest
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 bg-white pb-2 -mx-6 px-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                initialQuest ? 'Update Quest' : 'Create Quest'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
