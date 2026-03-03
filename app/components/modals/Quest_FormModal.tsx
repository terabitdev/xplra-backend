'use client';

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Close } from '@carbon/icons-react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { fetchPlaces } from '../../store/slices/placesSlice';
import { AppDispatch, RootState } from '../../store';

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
  const dispatch = useDispatch<AppDispatch>();
  const { places } = useSelector((state: RootState) => state.places);
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
  const [loading, setLoading] = useState(false);
  const [isPlaceDropdownOpen, setIsPlaceDropdownOpen] = useState(false);
  const [minTimeSeconds, setMinTimeSeconds] = useState<number>(300);
  const [radiusMeters, setRadiusMeters] = useState<number>(50);
  const [qrData, setQrData] = useState<string>('');
  const qrRef = useRef<HTMLDivElement>(null);

  // Fetch places when modal opens
  useEffect(() => {
    if (isOpen && places.length === 0) {
      dispatch(fetchPlaces({}));
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
      // Extract minTimeSeconds and radiusMeters if they exist
      if (initialQuest.type === 'checkin_time' && initialQuest.requirements) {
        if (initialQuest.requirements.minTimeSeconds) {
          setMinTimeSeconds(initialQuest.requirements.minTimeSeconds);
        }
        if (initialQuest.requirements.radiusMeters) {
          setRadiusMeters(initialQuest.requirements.radiusMeters);
        }
      }
      // Extract qrData if it exists (for QR Scan type)
      if (initialQuest.type === 'qr_scan' && initialQuest.requirements?.qrData) {
        setQrData(initialQuest.requirements.qrData);
      }
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
      setMinTimeSeconds(300);
      setRadiusMeters(50);
      setQrData('');
    }
  }, [initialQuest, isOpen]);

  const handleMinTimeSecondsChange = (value: number) => {
    setMinTimeSeconds(value);
    const newRequirements = { minTimeSeconds: value, radiusMeters };
    setQuest({ ...quest, requirements: newRequirements });
  };

  const handleRadiusMetersChange = (value: number) => {
    setRadiusMeters(value);
    const newRequirements = { minTimeSeconds, radiusMeters: value };
    setQuest({ ...quest, requirements: newRequirements });
  };

  // Generate unique QR code data
  const generateQRCode = () => {
    const randomString = Math.random().toString(36).substring(2, 15);
    const newQrData = `${quest.questId}_verify_${randomString}`;
    setQrData(newQrData);
    setQuest({ ...quest, requirements: { qrData: newQrData } });
  };

  // Download QR code as PNG
  const downloadQRCode = () => {
    if (!qrRef.current || !qrData) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();

    img.onload = () => {
      canvas.width = 256;
      canvas.height = 256;
      ctx?.fillStyle && (ctx.fillStyle = '#ffffff');
      ctx?.fillRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0, 256, 256);

      const link = document.createElement('a');
      link.download = `qr_${quest.questId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-0 sm:p-3">
      <div className="bg-white rounded-none sm:rounded-xl shadow-xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col safe-area-inset">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-3 border-b border-gray-200 bg-white pt-safe">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {initialQuest ? 'Edit Quest' : 'New Quest'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors" disabled={loading}>
            <Close size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Title & Place */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
              <input
                type="text"
                className="w-full px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={quest.title}
                onChange={(e) => setQuest({ ...quest, title: e.target.value })}
                required
                disabled={loading}
                placeholder="Quest title"
              />
            </div>
            <div className="relative place-dropdown-container">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Place</label>
              {/* Custom Dropdown Button */}
              <button
                type="button"
                onClick={() => !loading && setIsPlaceDropdownOpen(!isPlaceDropdownOpen)}
                className="w-full px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-left flex items-center justify-between disabled:bg-gray-100"
                disabled={loading}
              >
                {quest.placeId ? (
                  <div className="flex items-center gap-2 flex-1">
                    {places.find(p => p.placeId === quest.placeId)?.imageUrls?.[0] && (
                      <Image
                        src={places.find(p => p.placeId === quest.placeId)!.imageUrls![0]}
                        alt=""
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <span className="text-gray-900">{places.find(p => p.placeId === quest.placeId)?.name || 'Unknown'}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">Select your places</span>
                )}
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isPlaceDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 sm:max-h-60 overflow-y-auto">
                  {/* None Option */}
                  <div
                    onClick={() => {
                      setQuest({ ...quest, placeId: null });
                      setIsPlaceDropdownOpen(false);
                    }}
                    className="px-3 sm:px-3 py-3 sm:py-2 hover:bg-gray-100 active:bg-gray-200 cursor-pointer text-sm sm:text-sm text-gray-500 border-b border-gray-100"
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
                      className={`px-3 py-3 sm:py-2.5 hover:bg-indigo-50 active:bg-indigo-100 cursor-pointer flex items-center gap-3 transition-colors ${
                        quest.placeId === place.placeId ? 'bg-indigo-50' : ''
                      }`}
                    >
                      {place.imageUrls?.[0] ? (
                        <Image
                          src={place.imageUrls[0]}
                          alt={place.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-10 sm:h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-sm font-medium text-gray-900 truncate">{place.name}</p>
                        {place.location && <p className="text-xs text-gray-500 truncate mt-0.5">{place.location}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
            <textarea
              rows={3}
              className="w-full px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              value={quest.description}
              onChange={(e) => setQuest({ ...quest, description: e.target.value })}
              required
              disabled={loading}
              placeholder="Quest description"
            />
          </div>

          {/* Type & Min Time / Radius or QR Code */}
          {quest.type === 'checkin_time' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
                <select
                  className="w-full px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={quest.type}
                  onChange={(e) => setQuest({ ...quest, type: e.target.value as Quest_['type'], requirements: {} })}
                  disabled={loading}
                >
                  <option value="checkin_time">Time & Location</option>
                  <option value="qr_scan">QR Scan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Min Time <span className="text-blue-600 font-semibold">(sec)</span> *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={minTimeSeconds || ''}
                  onChange={(e) => handleMinTimeSecondsChange(parseInt(e.target.value) || 0)}
                  required
                  disabled={loading}
                  placeholder="100sec"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Radius <span className="text-blue-600 font-semibold">(meters)</span> *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={radiusMeters || ''}
                  onChange={(e) => handleRadiusMetersChange(parseInt(e.target.value) || 0)}
                  required
                  disabled={loading}
                  placeholder="100meter"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
                  <select
                    className="w-full px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={quest.type}
                    onChange={(e) => {
                      setQuest({ ...quest, type: e.target.value as Quest_['type'], requirements: {} });
                      setQrData('');
                    }}
                    disabled={loading}
                  >
                    <option value="checkin_time">Time & Location</option>
                    <option value="qr_scan">QR Scan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">QR Code</label>
                  <button
                    type="button"
                    onClick={generateQRCode}
                    className="w-full px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    {qrData ? 'Regenerate QR' : 'Generate QR Code'}
                  </button>
                </div>
              </div>

              {/* QR Code Display */}
              {qrData && (
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div ref={qrRef} className="bg-white p-2 rounded-lg shadow-sm flex-shrink-0">
                    <QRCodeSVG value={qrData} size={100} level="H" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 font-mono break-all leading-tight mb-2">
                      {qrData}
                    </p>
                    <button
                      type="button"
                      onClick={downloadQRCode}
                      className="px-3 py-1.5 text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md transition-colors font-medium inline-flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PNG
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cooldown & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cooldown (seconds) *</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-16"
                  value={quest.cooldownSeconds || ''}
                  onChange={(e) => setQuest({ ...quest, cooldownSeconds: parseInt(e.target.value) || 0 })}
                  required
                  disabled={loading}
                  placeholder="3600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                  {quest.cooldownSeconds ? formatCooldown(quest.cooldownSeconds) : ''}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <button
                type="button"
                onClick={() => setQuest({ ...quest, active: !quest.active })}
                className={`w-full px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm sm:text-base rounded-lg border transition-colors font-medium ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
              <input
                type="datetime-local"
                className="w-full px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={quest.startAt ? quest.startAt.slice(0, 16) : ''}
                onChange={(e) => setQuest({ ...quest, startAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
              <input
                type="datetime-local"
                className="w-full px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={quest.endAt ? quest.endAt.slice(0, 16) : ''}
                onChange={(e) => setQuest({ ...quest, endAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                disabled={loading}
              />
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="flex gap-3 px-4 sm:px-5 py-3.5 sm:py-3 pb-safe border-t border-gray-200 bg-gray-50 rounded-none sm:rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : (initialQuest ? 'Update Quest' : 'Create Quest')}
          </button>
        </div>
      </div>
    </div>
  );
}
