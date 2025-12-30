'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { Close, Menu } from '@carbon/icons-react';

export interface Quest_ {
  questId: string;
  placeId: string | null;
  title: string;
  description: string;
  type: "checkin_time" | "checkin_proof" | "qr_scan" | "gps_verify";
  requirements: Record<string, any>;
  xpReward: number;
  cooldownSeconds: number;
  active: boolean;
  startAt?: string;
  endAt?: string;
}

interface Quest_FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quest: Quest_) => void;
  quest?: Quest_ | null;
}

export default function Quest_FormModal({
  isOpen,
  onClose,
  onSubmit,
  quest: initialQuest,
}: Quest_FormModalProps) {
  const dispatch = useDispatch();
  const [quest, setQuest] = useState<Partial<Quest_>>({
    questId: '',
    placeId: null,
    title: '',
    description: '',
    type: 'checkin_time',
    requirements: {},
    xpReward: 0,
    cooldownSeconds: 3600,
    active: true,
    startAt: '',
    endAt: '',
  });
  const [requirementsJson, setRequirementsJson] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getRequirementsPlaceholder = (type: Quest_['type']) => {
    switch (type) {
      case 'checkin_time':
        return '{"minTime": 300}';
      case 'checkin_proof':
        return '{"photoRequired": true}';
      case 'qr_scan':
        return '{"qrCode": "QUEST_QR_123"}';
      case 'gps_verify':
        return '{"latitude": 24.8607, "longitude": 67.0011, "radius": 100}';
      default:
        return '{}';
    }
  };

  useEffect(() => {
    if (initialQuest) {
      setQuest(initialQuest);
      setRequirementsJson(JSON.stringify(initialQuest.requirements, null, 2));
    } else {
      const newQuestId = `quest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setQuest({
        questId: newQuestId,
        placeId: null,
        title: '',
        description: '',
        type: 'checkin_time',
        requirements: {},
        xpReward: 0,
        cooldownSeconds: 3600,
        active: true,
        startAt: '',
        endAt: '',
      });
      setRequirementsJson('{}');
    }
    setJsonError(null);
  }, [initialQuest, isOpen]);

  const handleRequirementsChange = (value: string) => {
    setRequirementsJson(value);
    try {
      const parsed = JSON.parse(value);
      setQuest({ ...quest, requirements: parsed });
      setJsonError(null);
    } catch {
      setJsonError('Invalid JSON format');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jsonError) return;
    setLoading(true);
    try {
      onSubmit(quest as Quest_);
      onClose();
    } catch (error) {
      console.error('Error submitting quest:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCooldown = (seconds: number) => {
    if (seconds >= 86400) return `${Math.floor(seconds / 86400)}d`;
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h`;
    if (seconds >= 60) return `${Math.floor(seconds / 60)}m`;
    return `${seconds}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="lg:hidden p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              disabled={loading}
              type="button"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {initialQuest ? 'Edit Quest' : 'New Quest'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded" disabled={loading}>
            <Close size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Title & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={quest.title}
                onChange={(e) => setQuest({ ...quest, title: e.target.value })}
                required
                disabled={loading}
                placeholder="Quest title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Place ID</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={quest.placeId || ''}
                onChange={(e) => setQuest({ ...quest, placeId: e.target.value || null })}
                disabled={loading}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <textarea
              rows={2}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              value={quest.description}
              onChange={(e) => setQuest({ ...quest, description: e.target.value })}
              required
              disabled={loading}
              placeholder="Quest description"
            />
          </div>

          {/* Type, XP, Cooldown, Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
              <select
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={quest.type}
                onChange={(e) => setQuest({ ...quest, type: e.target.value as Quest_['type'] })}
                disabled={loading}
              >
                <option value="checkin_time">Check-in Time</option>
                <option value="checkin_proof">Check-in Proof</option>
                <option value="qr_scan">QR Scan</option>
                <option value="gps_verify">GPS Verify</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">XP Reward *</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={quest.xpReward || ''}
                onChange={(e) => setQuest({ ...quest, xpReward: parseInt(e.target.value) || 0 })}
                required
                disabled={loading}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cooldown *</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-10"
                  value={quest.cooldownSeconds || ''}
                  onChange={(e) => setQuest({ ...quest, cooldownSeconds: parseInt(e.target.value) || 0 })}
                  required
                  disabled={loading}
                  placeholder="3600"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {quest.cooldownSeconds ? formatCooldown(quest.cooldownSeconds) : ''}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <button
                type="button"
                onClick={() => setQuest({ ...quest, active: !quest.active })}
                className={`w-full px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  quest.active
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600'
                }`}
                disabled={loading}
              >
                {quest.active ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={quest.startAt ? quest.startAt.slice(0, 16) : ''}
                onChange={(e) => setQuest({ ...quest, startAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={quest.endAt ? quest.endAt.slice(0, 16) : ''}
                onChange={(e) => setQuest({ ...quest, endAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Requirements (JSON) <span className="text-gray-400 font-normal">— {getRequirementsPlaceholder(quest.type || 'checkin_time')}</span>
            </label>
            <textarea
              rows={2}
              className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono resize-none ${
                jsonError ? 'border-red-400' : 'border-gray-300'
              }`}
              value={requirementsJson}
              onChange={(e) => handleRequirementsChange(e.target.value)}
              disabled={loading}
              placeholder={getRequirementsPlaceholder(quest.type || 'checkin_time')}
            />
            {jsonError && <p className="text-red-500 text-xs mt-0.5">{jsonError}</p>}
          </div>

          {/* Quest ID */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quest ID</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono"
              value={quest.questId}
              readOnly
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            disabled={loading || !!jsonError}
          >
            {loading ? 'Saving...' : (initialQuest ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}
