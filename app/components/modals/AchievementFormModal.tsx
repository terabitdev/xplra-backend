'use client';

import { useState, useEffect } from 'react';
import { Achievement } from '@/lib/domain/models/achievement';
import { Close } from '@carbon/icons-react';

interface AchievementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (achievement: Partial<Achievement>) => Promise<void>;
  achievement?: Achievement | null;
  adminId: string;
}

export default function AchievementFormModal({
  isOpen,
  onClose,
  onSubmit,
  achievement: initialAchievement,
  adminId,
}: AchievementFormModalProps) {
  const [achievement, setAchievement] = useState<Partial<Achievement>>({
    title: '',
    description: '',
    icon: '',
    trigger: 'experience',
    triggerValue: '',
    userId: adminId,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialAchievement) {
      setAchievement(initialAchievement);
    } else {
      // Reset form for new achievement
      setAchievement({
        title: '',
        description: '',
        icon: '',
        trigger: 'experience',
        triggerValue: '',
        userId: adminId,
      });
    }
  }, [initialAchievement, adminId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(achievement);
      onClose();
    } catch (error) {
      console.error('Error submitting achievement:', error);
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
            {initialAchievement ? 'Edit Achievement' : 'Create New Achievement'}
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
              value={achievement.title}
              onChange={(e) => setAchievement({ ...achievement, title: e.target.value })}
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
              value={achievement.description}
              onChange={(e) => setAchievement({ ...achievement, description: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Icon (emoji or icon name) */}
          <div>
            <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-2">
              Icon (Emoji or Icon Name) *
            </label>
            <input
              type="text"
              id="icon"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={achievement.icon}
              onChange={(e) => setAchievement({ ...achievement, icon: e.target.value })}
              placeholder="🏆 or trophy"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Enter an emoji (e.g., 🏆) or icon name</p>
          </div>

          {/* Trigger and Trigger Value Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trigger Type */}
            <div>
              <label htmlFor="trigger" className="block text-sm font-medium text-gray-700 mb-2">
                Trigger Type *
              </label>
              <select
                id="trigger"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={achievement.trigger}
                onChange={(e) => setAchievement({ ...achievement, trigger: e.target.value as Achievement['trigger'] })}
                required
                disabled={loading}
              >
                <option value="experience">Experience</option>
                <option value="level">Level</option>
                <option value="achievement">Achievement</option>
                <option value="quest">Quest</option>
              </select>
            </div>

            {/* Trigger Value */}
            <div>
              <label htmlFor="triggerValue" className="block text-sm font-medium text-gray-700 mb-2">
                Trigger Value *
              </label>
              <input
                type="text"
                id="triggerValue"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={achievement.triggerValue}
                onChange={(e) => setAchievement({ ...achievement, triggerValue: e.target.value })}
                placeholder="e.g., 1000, 5, quest-id"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                {achievement.trigger === 'experience' && 'Total experience points needed'}
                {achievement.trigger === 'level' && 'Level number to reach'}
                {achievement.trigger === 'achievement' && 'ID of previous achievement'}
                {achievement.trigger === 'quest' && 'Number of quests to complete'}
              </p>
            </div>
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
                initialAchievement ? 'Update Achievement' : 'Create Achievement'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
