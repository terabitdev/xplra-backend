'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Quest } from '@/lib/domain/models/quest';
import { Close } from '@carbon/icons-react';
import Image from 'next/image';
import { fetchPlaces } from '../../store/slices/placesSlice';
import { AppDispatch, RootState } from '../../store';

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
  const dispatch = useDispatch<AppDispatch>();
  const { places } = useSelector((state: RootState) => state.places);
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
  const [isPlaceDropdownOpen, setIsPlaceDropdownOpen] = useState(false);

  // Fetch places when modal opens
  useEffect(() => {
    if (isOpen && places.length === 0) {
      dispatch(fetchPlaces());
    }
  }, [isOpen, dispatch, places.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isPlaceDropdownOpen && !target.closest('.place-dropdown-container')) {
        setIsPlaceDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPlaceDropdownOpen]);

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

          {/* Place */}
          <div className="relative place-dropdown-container">
            <label htmlFor="placeId" className="block text-sm font-medium text-gray-700 mb-2">
              Place
            </label>
            {/* Custom Dropdown Button */}
            <button
              type="button"
              onClick={() => !loading && setIsPlaceDropdownOpen(!isPlaceDropdownOpen)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between disabled:bg-gray-100"
              disabled={loading}
            >
              {quest.placeId ? (
                <div className="flex items-center gap-2 flex-1">
                  {places.find(p => p.placeId === quest.placeId)?.imageUrls?.[0] && (
                    <Image
                      src={places.find(p => p.placeId === quest.placeId)!.imageUrls![0]}
                      alt=""
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}
                  <span className="text-gray-900">{places.find(p => p.placeId === quest.placeId)?.name || 'Unknown'}</span>
                </div>
              ) : (
                <span className="text-gray-500">Select your places</span>
              )}
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isPlaceDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {/* None Option */}
                <div
                  onClick={() => {
                    setQuest({ ...quest, placeId: null });
                    setIsPlaceDropdownOpen(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-500"
                >
                  Select your places
                </div>

                {/* Place Options */}
                {places.map((place) => (
                  <div
                    key={place.placeId}
                    onClick={() => {
                      setQuest({ ...quest, placeId: place.placeId });
                      setIsPlaceDropdownOpen(false);
                    }}
                    className={`px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-3 ${
                      quest.placeId === place.placeId ? 'bg-blue-50' : ''
                    }`}
                  >
                    {place.imageUrls?.[0] ? (
                      <Image
                        src={place.imageUrls[0]}
                        alt={place.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{place.name}</p>
                      {place.address && <p className="text-xs text-gray-500 truncate">{place.address}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Type Row - Different fields based on quest type */}
          {quest.type === 'checkin_time' ? (
            /* Check-in Time: Type | Min Time | Radius */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Quest Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Quest Type *
                </label>
                <select
                  id="type"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  value={quest.type || 'qr_scan'}
                  onChange={(e) => setQuest({ ...quest, type: e.target.value as Quest['type'], requirements: {} })}
                  required
                  disabled={loading}
                >
                  <option value="qr_scan">QR Scan</option>
                  <option value="checkin_time">Check-in Time</option>
                </select>
              </div>

              {/* Min Time (seconds) */}
              <div>
                <label htmlFor="minTimeSeconds" className="block text-sm font-medium text-gray-700 mb-2">
                  Min Time (seconds) *
                </label>
                <input
                  type="number"
                  id="minTimeSeconds"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  value={(quest.requirements as { minTimeSeconds?: number })?.minTimeSeconds || 0}
                  onChange={(e) => setQuest({
                    ...quest,
                    requirements: {
                      ...quest.requirements,
                      minTimeSeconds: parseInt(e.target.value) || 0
                    }
                  })}
                  required
                  disabled={loading}
                />
              </div>

              {/* Radius (meters) */}
              <div>
                <label htmlFor="radiusMeters" className="block text-sm font-medium text-gray-700 mb-2">
                  Radius (meters) *
                </label>
                <input
                  type="number"
                  id="radiusMeters"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  value={(quest.requirements as { radiusMeters?: number })?.radiusMeters || 50}
                  onChange={(e) => setQuest({
                    ...quest,
                    requirements: {
                      ...quest.requirements,
                      radiusMeters: parseInt(e.target.value) || 50
                    }
                  })}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          ) : (
            /* QR Scan: Type | QR Code Button */
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
                  onChange={(e) => setQuest({ ...quest, type: e.target.value as Quest['type'], requirements: {} })}
                  required
                  disabled={loading}
                >
                  <option value="qr_scan">QR Scan</option>
                  <option value="checkin_time">Check-in Time</option>
                </select>
              </div>

              {/* QR Code Button */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code
                </label>
                <button
                  type="button"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium transition-colors disabled:bg-gray-100 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Scan QR Code
                </button>
              </div>
            </div>
          )}

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
