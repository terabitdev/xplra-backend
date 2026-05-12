'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Close } from '@carbon/icons-react';
import Image from 'next/image';
import { ValidationConfig } from '@/lib/domain/models/validationConfig';
import { fetchPlaces } from '../../store/slices/placesSlice';
import { fetchQuestCategories } from '../../store/slices/questCategoriesSlice';
import { fetchValidationConfigs } from '../../store/slices/validationConfigsSlice';
import { fetchEvents } from '../../store/slices/eventsSlice';
import { AppDispatch, RootState } from '../../store';
import { ContextPillSettings } from '@/lib/domain/models/quest';

export interface Quest_ {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  xp: number;
  type: 'checkin' | 'dwell' | 'accrual' | 'qrCode' | 'codePhrase';
  isActive: boolean;
  visibility: { hideAfterOneTimeCompletion: boolean };
  placeId?: string | null;
  location: string;
  geoOverride?: { lat: number; lng: number } | null;
  resolvedGeo?: { lat: number; lng: number };
  validationConfigId?: string | null;
  validationConfig?: Partial<ValidationConfig> | null;
  contextPillSettings?: ContextPillSettings | null;
  createdAt?: string;
  updatedAt?: string;
}

interface PillsState {
  nearby: { enabled: boolean };
  today: {
    enabled: boolean;
    startDateTime: string;
    endDateTime: string;
    outsideWindowBehavior: 'hidePill' | 'hideQuest' | '';
  };
  limited: {
    enabled: boolean;
    label: string;
    startDateTime: string;
    endDateTime: string;
    outsideWindowBehavior: 'hidePill' | 'hideQuest' | '';
  };
  event: { enabled: boolean; eventId: string };
  featured: {
    enabled: boolean;
    restrictToWindow: boolean;
    startDateTime: string;
    endDateTime: string;
  };
}

const DEFAULT_PILLS: PillsState = {
  nearby: { enabled: false },
  today: { enabled: false, startDateTime: '', endDateTime: '', outsideWindowBehavior: '' },
  limited: { enabled: false, label: '', startDateTime: '', endDateTime: '', outsideWindowBehavior: '' },
  event: { enabled: false, eventId: '' },
  featured: { enabled: false, restrictToWindow: false, startDateTime: '', endDateTime: '' },
};

const QUEST_TYPES: { value: Quest_['type']; label: string }[] = [
  { value: 'checkin', label: 'Check-In' },
  { value: 'dwell', label: 'Dwell' },
  { value: 'accrual', label: 'Accrual' },
  { value: 'qrCode', label: 'QR Code' },
  { value: 'codePhrase', label: 'Code Phrase' },
];

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
  const { categories: questCategories } = useSelector((state: RootState) => state.questCategories);
  const { configs: validationConfigs } = useSelector((state: RootState) => state.validationConfigs);
  const { events } = useSelector((state: RootState) => state.events);
  const activeEvents = events.filter(e => e.isActive);

  const [quest, setQuest] = useState<Partial<Quest_>>({
    id: '',
    categoryId: '',
    title: '',
    description: '',
    xp: 0,
    type: 'checkin',
    isActive: true,
    visibility: { hideAfterOneTimeCompletion: false },
    placeId: null,
    location: '',
    geoOverride: null,
    validationConfigId: null,
    validationConfig: null,
  });
  const [vcForm, setVcForm] = useState<Partial<ValidationConfig>>({});
  const [pills, setPills] = useState<PillsState>(DEFAULT_PILLS);
  const [geoOverrideEnabled, setGeoOverrideEnabled] = useState(false);
  const [geoOverrideLat, setGeoOverrideLat] = useState<number>(0);
  const [geoOverrideLng, setGeoOverrideLng] = useState<number>(0);
  const [location, setLocation] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [geocodeFailed, setGeocodeFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrorMsg, setFormErrorMsg] = useState<string | null>(null);
  const [isPlaceDropdownOpen, setIsPlaceDropdownOpen] = useState(false);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch dropdown data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (places.length === 0) dispatch(fetchPlaces({}));
      if (questCategories.length === 0) dispatch(fetchQuestCategories());
      if (validationConfigs.length === 0) dispatch(fetchValidationConfigs());
      if (events.length === 0) dispatch(fetchEvents({}));
    }
  }, [isOpen, dispatch, places.length, questCategories.length, validationConfigs.length, events.length]);

  // Close place dropdown on outside click
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

  const reverseGeocodeCoords = useCallback((lat: number, lng: number) => {
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    if (!lat || !lng) {
      setLocation('');
      setGeocodeFailed(false);
      return;
    }
    geocodeTimerRef.current = setTimeout(async () => {
      setLocationLoading(true);
      setGeocodeFailed(false);
      try {
        const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        if (data.location) {
          setLocation(data.location);
        } else {
          setLocation('');
          setGeocodeFailed(true);
        }
      } catch {
        setLocation('');
        setGeocodeFailed(true);
      } finally {
        setLocationLoading(false);
      }
    }, 800);
  }, []);

  // Initialize form state when modal opens or initialQuest changes
  useEffect(() => {
    if (initialQuest) {
      const hasOverride = !!initialQuest.geoOverride;
      setGeoOverrideEnabled(hasOverride);
      setGeoOverrideLat(initialQuest.geoOverride?.lat || 0);
      setGeoOverrideLng(initialQuest.geoOverride?.lng || 0);
      setLocation(initialQuest.location || '');
      setGeocodeFailed(false);
      setQuest({
        id: initialQuest.id,
        categoryId: initialQuest.categoryId || '',
        title: initialQuest.title || '',
        description: initialQuest.description || '',
        xp: initialQuest.xp ?? 0,
        type: initialQuest.type || 'checkin',
        isActive: initialQuest.isActive ?? true,
        visibility: {
          hideAfterOneTimeCompletion: initialQuest.visibility?.hideAfterOneTimeCompletion ?? false,
        },
        placeId: initialQuest.placeId || null,
        location: initialQuest.location || '',
        geoOverride: initialQuest.geoOverride || null,
        validationConfigId: initialQuest.validationConfigId || null,
        validationConfig: initialQuest.validationConfig || null,
      });
      // Load context pills
      const cps = initialQuest.contextPillSettings;
      const toLocal = (iso: string | null | undefined) => iso ? iso.slice(0, 16) : '';
      if (cps) {
        setPills({
          nearby: { enabled: cps.nearbyEligible ?? false },
          today: {
            enabled: cps.todayEligible ?? false,
            startDateTime: toLocal(cps.todaySettings?.startDateTime),
            endDateTime: toLocal(cps.todaySettings?.endDateTime),
            outsideWindowBehavior: cps.todaySettings?.outsideWindowBehavior ?? '',
          },
          limited: {
            enabled: cps.limitedEligible ?? false,
            label: cps.limitedSettings?.label ?? '',
            startDateTime: toLocal(cps.limitedSettings?.startDateTime),
            endDateTime: toLocal(cps.limitedSettings?.endDateTime),
            outsideWindowBehavior: cps.limitedSettings?.outsideWindowBehavior ?? '',
          },
          event: {
            enabled: cps.eventEligible ?? false,
            eventId: cps.eventSettings?.eventId ?? '',
          },
          featured: {
            enabled: cps.featuredEligible ?? false,
            restrictToWindow: !!cps.featuredSettings,
            startDateTime: toLocal(cps.featuredSettings?.startDateTime),
            endDateTime: toLocal(cps.featuredSettings?.endDateTime),
          },
        });
      } else {
        setPills(DEFAULT_PILLS);
      }
      // Load validation config
      if (initialQuest.validationConfig) {
        setVcForm({ ...initialQuest.validationConfig });
      } else if (initialQuest.validationConfigId) {
        const vc = validationConfigs.find(c => c.id === initialQuest.validationConfigId);
        setVcForm(vc ? { ...vc } : {});
      } else {
        setVcForm({});
      }
    } else {
      const newId = `quest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setQuest({
        id: newId,
        categoryId: '',
        title: '',
        description: '',
        xp: 0,
        type: 'checkin',
        isActive: true,
        visibility: { hideAfterOneTimeCompletion: false },
        placeId: null,
        location: '',
        geoOverride: null,
        validationConfigId: null,
        validationConfig: null,
      });
      setVcForm({});
      setPills(DEFAULT_PILLS);
      setGeoOverrideEnabled(false);
      setGeoOverrideLat(0);
      setGeoOverrideLng(0);
      setLocation('');
      setGeocodeFailed(false);
    }
    setFormErrorMsg(null);
    setIsPlaceDropdownOpen(false);
  }, [initialQuest, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const setVcField = useCallback((field: string, value: unknown) => {
    setVcForm(prev => ({ ...prev, [field]: value }));
    setFormErrorMsg(null);
  }, []);

  const handlePlaceChange = (placeId: string | null) => {
    setQuest(prev => ({ ...prev, placeId }));
    if (!geoOverrideEnabled) {
      if (placeId) {
        const place = places.find(p => p.placeId === placeId);
        setLocation(place?.location || '');
        setGeocodeFailed(false);
      } else {
        setLocation('');
      }
    }
    setFormErrorMsg(null);
  };

  const handleGeoOverrideToggle = (enabled: boolean) => {
    setGeoOverrideEnabled(enabled);
    if (!enabled) {
      setGeoOverrideLat(0);
      setGeoOverrideLng(0);
      const place = places.find(p => p.placeId === quest.placeId);
      setLocation(place?.location || '');
      setGeocodeFailed(false);
    } else if (geoOverrideLat && geoOverrideLng) {
      reverseGeocodeCoords(geoOverrideLat, geoOverrideLng);
    } else {
      setLocation('');
    }
  };

  const validateForm = (): boolean => {
    const missing: string[] = [];
    if (!quest.categoryId?.trim()) missing.push('Category');
    if (!quest.title?.trim()) missing.push('Title');
    if (!quest.description?.trim()) missing.push('Description');
    if (quest.xp === undefined || quest.xp === null) missing.push('XP');
    if (!quest.type) missing.push('Type');

    if (!geoOverrideEnabled && !quest.placeId) {
      missing.push('Place (or enable Geo Override)');
    }
    if (geoOverrideEnabled && (!geoOverrideLat || !geoOverrideLng)) {
      missing.push('Geo Override coordinates');
    }

    // Required validation config fields
    const requiredVcFields: { key: keyof ValidationConfig; label: string }[] = [
      { key: 'radiusM', label: 'Radius (m)' },
      { key: 'minAccuracyM', label: 'Min Accuracy (m)' },
      { key: 'minAcceptedSamplesToLock', label: 'Min Accepted Samples' },
      { key: 'pingRecommendedIntervalSec', label: 'Ping Interval (sec)' },
      { key: 'maxStalePingSec', label: 'Max Stale Ping (sec)' },
      { key: 'sessionTtlSec', label: 'Session TTL (sec)' },
      { key: 'timeToValidateSec', label: 'Time to Validate (sec)' },
      { key: 'dwellRequiredSec', label: 'Dwell Required (sec)' },
      { key: 'graceConsecutiveOutsideSec', label: 'Grace Consecutive Outside (sec)' },
      { key: 'graceTotalOutsideSec', label: 'Grace Total Outside (sec)' },
      { key: 'maxActiveSessionsPerUser', label: 'Max Active Sessions/User' },
      { key: 'maxSpeedMps', label: 'Max Speed (m/s)' },
      { key: 'cooldownSec', label: 'Cooldown (sec)' },
    ];
    for (const { key, label } of requiredVcFields) {
      const val = vcForm[key];
      if (val === undefined || val === null || val === '') missing.push(label);
    }
    if (vcForm.requireQrOrCode) {
      if (vcForm.qrTokenTtlSec === undefined || vcForm.qrTokenTtlSec === null) missing.push('QR Token TTL (sec)');
      if (vcForm.maxCodeAttempts === undefined || vcForm.maxCodeAttempts === null) missing.push('Max Code Attempts');
      if (vcForm.codeAttemptWindowSec === undefined || vcForm.codeAttemptWindowSec === null) missing.push('Code Attempt Window (sec)');
    }
    if (vcForm.useScheduleWindow) {
      if (!vcForm.schedule?.startTime) missing.push('Schedule Start Time');
      if (!vcForm.schedule?.endTime) missing.push('Schedule End Time');
      if (!vcForm.schedule?.daysOfWeek?.length) missing.push('Schedule Days of Week');
    }

    // Context pills validation
    if (pills.today.enabled) {
      if (!pills.today.startDateTime) missing.push('Today Pill: Start Date & Time');
      if (!pills.today.endDateTime) missing.push('Today Pill: End Date & Time');
      if (!pills.today.outsideWindowBehavior) missing.push('Today Pill: Outside Window Behavior');
      if (pills.today.startDateTime && pills.today.endDateTime && pills.today.startDateTime >= pills.today.endDateTime) {
        missing.push('Today Pill: Start must be before End');
      }
    }
    if (pills.limited.enabled) {
      if (!pills.limited.label.trim()) missing.push('Limited Pill: Label');
      if (!pills.limited.startDateTime) missing.push('Limited Pill: Start Date & Time');
      if (!pills.limited.endDateTime) missing.push('Limited Pill: End Date & Time');
      if (!pills.limited.outsideWindowBehavior) missing.push('Limited Pill: Outside Window Behavior');
      if (pills.limited.startDateTime && pills.limited.endDateTime && pills.limited.startDateTime >= pills.limited.endDateTime) {
        missing.push('Limited Pill: Start must be before End');
      }
    }
    if (pills.event.enabled) {
      if (!pills.event.eventId) missing.push('Event Pill: Event');
    }
    if (pills.featured.enabled && pills.featured.restrictToWindow) {
      if (!pills.featured.startDateTime) missing.push('Featured Pill: Start Date & Time');
      if (!pills.featured.endDateTime) missing.push('Featured Pill: End Date & Time');
      if (pills.featured.startDateTime && pills.featured.endDateTime && pills.featured.startDateTime >= pills.featured.endDateTime) {
        missing.push('Featured Pill: Start must be before End');
      }
    }

    if (missing.length > 0) {
      setFormErrorMsg(`Please fill: ${missing.join(', ')}`);
      return false;
    }

    // Location check last — empty means geocoding failed
    if (!location?.trim()) {
      setFormErrorMsg('Location could not be determined, adjust coordinates');
      return false;
    }

    setFormErrorMsg(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const nearbyAllowed = !!(vcForm.requireLocationServices && vcForm.radiusM && vcForm.radiusM > 0);
      const contextPillSettings: ContextPillSettings = {
        nearbyEligible: pills.nearby.enabled && nearbyAllowed,
        todayEligible: pills.today.enabled,
        todaySettings: pills.today.enabled
          ? {
              startDateTime: pills.today.startDateTime,
              endDateTime: pills.today.endDateTime,
              outsideWindowBehavior: pills.today.outsideWindowBehavior as 'hidePill' | 'hideQuest',
            }
          : null,
        limitedEligible: pills.limited.enabled,
        limitedSettings: pills.limited.enabled
          ? {
              label: pills.limited.label,
              startDateTime: pills.limited.startDateTime,
              endDateTime: pills.limited.endDateTime,
              outsideWindowBehavior: pills.limited.outsideWindowBehavior as 'hidePill' | 'hideQuest',
            }
          : null,
        eventEligible: pills.event.enabled,
        eventSettings: pills.event.enabled ? { eventId: pills.event.eventId } : null,
        featuredEligible: pills.featured.enabled,
        featuredSettings: pills.featured.enabled && pills.featured.restrictToWindow
          ? { startDateTime: pills.featured.startDateTime, endDateTime: pills.featured.endDateTime }
          : null,
      };

      const questToSubmit: Quest_ = {
        id: quest.id!,
        categoryId: quest.categoryId!,
        title: quest.title!,
        description: quest.description!,
        xp: quest.xp!,
        type: quest.type!,
        isActive: quest.isActive!,
        visibility: quest.visibility!,
        placeId: quest.placeId || null,
        location,
        geoOverride: geoOverrideEnabled ? { lat: geoOverrideLat, lng: geoOverrideLng } : null,
        validationConfigId: quest.validationConfigId || null,
        validationConfig: { ...vcForm },
        contextPillSettings,
      };
      onSubmit(questToSubmit);
      onClose();
    } catch (error) {
      console.error('Error submitting quest:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-0 sm:p-3">
      <div className="bg-white rounded-none sm:rounded-xl shadow-xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-3 border-b border-gray-200 bg-white">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {initialQuest ? 'Edit Quest' : 'New Quest'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            disabled={loading}
          >
            <Close size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {formErrorMsg && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600 font-medium">{formErrorMsg}</p>
            </div>
          )}

          {/* Title + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={quest.title || ''}
                onChange={(e) => { setQuest(prev => ({ ...prev, title: e.target.value })); setFormErrorMsg(null); }}
                disabled={loading}
                placeholder="Quest title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={quest.categoryId || ''}
                onChange={(e) => { setQuest(prev => ({ ...prev, categoryId: e.target.value })); setFormErrorMsg(null); }}
                disabled={loading}
              >
                <option value="">Select category...</option>
                {questCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              value={quest.description || ''}
              onChange={(e) => { setQuest(prev => ({ ...prev, description: e.target.value })); setFormErrorMsg(null); }}
              disabled={loading}
              placeholder="Quest description"
            />
          </div>

          {/* Type + XP */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={quest.type || 'checkin'}
                onChange={(e) => setQuest(prev => ({ ...prev, type: e.target.value as Quest_['type'] }))}
                disabled={loading}
              >
                {QUEST_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">XP *</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={quest.xp !== undefined && quest.xp !== null ? quest.xp : ''}
                onChange={(e) => setQuest(prev => ({ ...prev, xp: e.target.value === '' ? 0 : (parseInt(e.target.value) || 0) }))}
                disabled={loading}
                placeholder="100"
              />
            </div>
          </div>

          {/* Status + Visibility */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <button
                type="button"
                onClick={() => setQuest(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors font-medium ${
                  quest.isActive
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600'
                }`}
                disabled={loading}
              >
                {quest.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
              <button
                type="button"
                onClick={() =>
                  setQuest(prev => ({
                    ...prev,
                    visibility: {
                      hideAfterOneTimeCompletion: !prev.visibility?.hideAfterOneTimeCompletion,
                    },
                  }))
                }
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors font-medium ${
                  quest.visibility?.hideAfterOneTimeCompletion
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600'
                }`}
                disabled={loading}
              >
                {quest.visibility?.hideAfterOneTimeCompletion ? 'Hide After Completion' : 'Always Visible'}
              </button>
            </div>
          </div>

          {/* Place Selector */}
          <div className="relative place-dropdown-container">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Place</label>
            <button
              type="button"
              onClick={() => !loading && setIsPlaceDropdownOpen(!isPlaceDropdownOpen)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              disabled={loading}
            >
              {quest.placeId ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {places.find(p => p.placeId === quest.placeId)?.imageUrls?.[0] && (
                    <Image
                      src={places.find(p => p.placeId === quest.placeId)!.imageUrls![0]}
                      alt=""
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <span className="text-gray-900 truncate">
                    {places.find(p => p.placeId === quest.placeId)?.name || 'Unknown'}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500">Select a place (optional)</span>
              )}
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isPlaceDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div
                  onClick={() => { handlePlaceChange(null); setIsPlaceDropdownOpen(false); }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-500 border-b border-gray-100"
                >
                  None
                </div>
                {places.map((place) => (
                  <div
                    key={place.placeId}
                    onClick={() => { handlePlaceChange(place.placeId); setIsPlaceDropdownOpen(false); }}
                    className={`px-3 py-2.5 hover:bg-indigo-50 cursor-pointer flex items-center gap-3 transition-colors ${
                      quest.placeId === place.placeId ? 'bg-indigo-50' : ''
                    }`}
                  >
                    {place.imageUrls?.[0] ? (
                      <Image
                        src={place.imageUrls[0]}
                        alt={place.name}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{place.name}</p>
                      {place.location && (
                        <p className="text-xs text-gray-500 truncate">{place.location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Geo Override */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={geoOverrideEnabled}
                onChange={(e) => handleGeoOverrideToggle(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">Override Coordinates</span>
              <span className="text-xs text-gray-400">(overrides place geo)</span>
            </label>
            {geoOverrideEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={geoOverrideLat || ''}
                    onChange={(e) => {
                      const lat = parseFloat(e.target.value) || 0;
                      setGeoOverrideLat(lat);
                      reverseGeocodeCoords(lat, geoOverrideLng);
                      setFormErrorMsg(null);
                    }}
                    disabled={loading}
                    placeholder="-90 to 90"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={geoOverrideLng || ''}
                    onChange={(e) => {
                      const lng = parseFloat(e.target.value) || 0;
                      setGeoOverrideLng(lng);
                      reverseGeocodeCoords(geoOverrideLat, lng);
                      setFormErrorMsg(null);
                    }}
                    disabled={loading}
                    placeholder="-180 to 180"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
            <div
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-gray-50 min-h-[36px] flex items-center ${
                geocodeFailed ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              {locationLoading ? (
                <span className="text-gray-400 flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Fetching location...
                </span>
              ) : location ? (
                <span className="text-gray-700">{location}</span>
              ) : geocodeFailed ? (
                <span className="text-red-500 text-xs">
                  Location could not be determined, adjust coordinates
                </span>
              ) : (
                <span className="text-gray-400">Select a place or enable geo override</span>
              )}
            </div>
          </div>

          {/* Validation Config Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Validation Config</label>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={quest.validationConfigId || ''}
              onChange={(e) => {
                const selectedId = e.target.value || null;
                setQuest(prev => ({ ...prev, validationConfigId: selectedId }));
                if (selectedId) {
                  const vc = validationConfigs.find(c => c.id === selectedId);
                  if (vc) setVcForm({ ...vc });
                } else {
                  setVcForm({});
                }
              }}
              disabled={loading}
            >
              <option value="">Select a validation config...</option>
              {validationConfigs.map((vc) => (
                <option key={vc.id} value={vc.id}>{vc.name}</option>
              ))}
            </select>
          </div>

          {/* Validation Config Embedded Fields */}
          <div className="space-y-4">
            {/* Geofence */}
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-800">Geofence</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Radius (m) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.radiusM ?? ''} onChange={(e) => setVcField('radiusM', parseFloat(e.target.value) || 0)} disabled={loading} placeholder="150" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Accuracy (m) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.minAccuracyM ?? ''} onChange={(e) => setVcField('minAccuracyM', parseFloat(e.target.value) || 0)} disabled={loading} placeholder="40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Speed (m/s) *</label>
                  <input type="number" min="0" step="any" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.maxSpeedMps ?? ''} onChange={(e) => setVcField('maxSpeedMps', e.target.value ? parseFloat(e.target.value) : undefined)} disabled={loading} placeholder="5" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={vcForm.requireLocationServices ?? false} onChange={(e) => setVcField('requireLocationServices', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
                Require Location Services
              </label>
            </div>

            {/* Sampling & Timing */}
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-800">Sampling & Timing</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Accepted Samples *</label>
                  <input type="number" min="1" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.minAcceptedSamplesToLock ?? ''} onChange={(e) => setVcField('minAcceptedSamplesToLock', parseInt(e.target.value) || 0)} disabled={loading} placeholder="2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ping Interval (sec) *</label>
                  <input type="number" min="1" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.pingRecommendedIntervalSec ?? ''} onChange={(e) => setVcField('pingRecommendedIntervalSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Stale Ping (sec) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.maxStalePingSec ?? ''} onChange={(e) => setVcField('maxStalePingSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="90" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Session TTL (sec) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.sessionTtlSec ?? ''} onChange={(e) => setVcField('sessionTtlSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="1800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Time to Validate (sec) *</label>
                  <input type="number" min="5" max="20" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.timeToValidateSec ?? ''} onChange={(e) => setVcField('timeToValidateSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="5–20" />
                </div>
              </div>
            </div>

            {/* Dwell */}
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-800">Dwell</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dwell Required (sec) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.dwellRequiredSec ?? ''} onChange={(e) => setVcField('dwellRequiredSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Grace Consecutive Outside (sec) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.graceConsecutiveOutsideSec ?? ''} onChange={(e) => setVcField('graceConsecutiveOutsideSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="60" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Grace Total Outside (sec) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.graceTotalOutsideSec ?? ''} onChange={(e) => setVcField('graceTotalOutsideSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="120" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={vcForm.requireInsideOnComplete ?? false} onChange={(e) => setVcField('requireInsideOnComplete', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
                Require Inside On Complete
              </label>
            </div>

            {/* Availability Window */}
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-800">Availability Window</h3>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={vcForm.useScheduleWindow ?? false} onChange={(e) => setVcField('useScheduleWindow', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
                Use Schedule Window
              </label>
              {vcForm.useScheduleWindow && (
                <div className="ml-6 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Time *</label>
                      <input type="time" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.schedule?.startTime || ''} onChange={(e) => setVcForm(prev => ({ ...prev, schedule: { ...prev.schedule, startTime: e.target.value } }))} disabled={loading} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Time *</label>
                      <input type="time" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.schedule?.endTime || ''} onChange={(e) => setVcForm(prev => ({ ...prev, schedule: { ...prev.schedule, endTime: e.target.value } }))} disabled={loading} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Days of Week *</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            const current = vcForm.schedule?.daysOfWeek || [];
                            const updated = current.includes(i)
                              ? current.filter((d: number) => d !== i)
                              : [...current, i].sort();
                            setVcForm(prev => ({ ...prev, schedule: { ...prev.schedule, daysOfWeek: updated } }));
                          }}
                          className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                            (vcForm.schedule?.daysOfWeek || []).includes(i)
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                          }`}
                          disabled={loading}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Completion */}
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-800">Completion</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cooldown (sec) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.cooldownSec ?? ''} onChange={(e) => setVcField('cooldownSec', e.target.value ? parseInt(e.target.value) : undefined)} disabled={loading} placeholder="3600" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={vcForm.oneTimeOnly ?? false} onChange={(e) => setVcField('oneTimeOnly', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
                    One-Time Only
                  </label>
                </div>
              </div>
            </div>

            {/* QR / Code Gating */}
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-800">QR / Code Gating</h3>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={vcForm.requireQrOrCode ?? false} onChange={(e) => setVcField('requireQrOrCode', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
                Require QR or Code
              </label>
              {vcForm.requireQrOrCode && (
                <div className="ml-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">QR Token TTL (sec) *</label>
                    <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.qrTokenTtlSec ?? ''} onChange={(e) => setVcField('qrTokenTtlSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Max Code Attempts *</label>
                    <input type="number" min="1" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.maxCodeAttempts ?? ''} onChange={(e) => setVcField('maxCodeAttempts', parseInt(e.target.value) || 0)} disabled={loading} placeholder="3" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Code Attempt Window (sec) *</label>
                    <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.codeAttemptWindowSec ?? ''} onChange={(e) => setVcField('codeAttemptWindowSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="600" />
                  </div>
                </div>
              )}
            </div>

            {/* Fraud & Limits */}
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-800">Fraud & Limits</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Active Sessions/User *</label>
                  <input type="number" min="1" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.maxActiveSessionsPerUser ?? ''} onChange={(e) => setVcField('maxActiveSessionsPerUser', parseInt(e.target.value) || 1)} disabled={loading} placeholder="1" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Audit Log Level</label>
                  <select className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.auditLogLevel || 'basic'} onChange={(e) => setVcField('auditLogLevel', e.target.value)} disabled={loading}>
                    <option value="off">Off</option>
                    <option value="basic">Basic</option>
                    <option value="verbose">Verbose</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={vcForm.denyIfMockLocationSuspected ?? false} onChange={(e) => setVcField('denyIfMockLocationSuspected', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
                Deny If Mock Location Suspected
              </label>
            </div>
          </div>

          {/* ── Context Pills ── */}
          <div className="border-t border-gray-200 pt-4 space-y-1">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Context Pills</h3>

            {/* Nearby */}
            {(() => {
              const nearbyAllowed = !!(vcForm.requireLocationServices && vcForm.radiusM && vcForm.radiusM > 0);
              return (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50">
                    <div>
                      <span className="text-sm font-medium text-gray-800">Nearby</span>
                      <p className="text-xs text-gray-500 mt-0.5">Shows when user is within the quest's validation radius</p>
                    </div>
                    <button
                      type="button"
                      disabled={loading || !nearbyAllowed}
                      onClick={() => setPills(p => ({ ...p, nearby: { enabled: !p.nearby.enabled } }))}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                        !nearbyAllowed ? 'opacity-40 cursor-not-allowed' : ''
                      } ${pills.nearby.enabled && nearbyAllowed ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${pills.nearby.enabled && nearbyAllowed ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  {!nearbyAllowed && (
                    <div className="px-3 py-2 bg-amber-50 border-t border-amber-100">
                      <p className="text-xs text-amber-700">⚠ Requires Location Services and Radius to be configured in Validation Config</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Today */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50">
                <div>
                  <span className="text-sm font-medium text-gray-800">Today</span>
                  <p className="text-xs text-gray-500 mt-0.5">Shows when current time is within the configured window</p>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setPills(p => ({ ...p, today: { ...p.today, enabled: !p.today.enabled } }))}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${pills.today.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${pills.today.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              {pills.today.enabled && (
                <div className="px-3 py-3 space-y-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Date & Time *</label>
                      <input type="datetime-local" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={pills.today.startDateTime} onChange={(e) => { setPills(p => ({ ...p, today: { ...p.today, startDateTime: e.target.value } })); setFormErrorMsg(null); }} disabled={loading} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Date & Time *</label>
                      <input type="datetime-local" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={pills.today.endDateTime} onChange={(e) => { setPills(p => ({ ...p, today: { ...p.today, endDateTime: e.target.value } })); setFormErrorMsg(null); }} disabled={loading} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Outside Window *</label>
                    <div className="flex gap-4">
                      {(['hidePill', 'hideQuest'] as const).map(opt => (
                        <label key={opt} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                          <input type="radio" name="today-outside" value={opt} checked={pills.today.outsideWindowBehavior === opt} onChange={() => { setPills(p => ({ ...p, today: { ...p.today, outsideWindowBehavior: opt } })); setFormErrorMsg(null); }} disabled={loading} className="text-indigo-600 focus:ring-indigo-500" />
                          {opt === 'hidePill' ? 'Hide Pill' : 'Hide Quest'}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Limited */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50">
                <div>
                  <span className="text-sm font-medium text-gray-800">Limited</span>
                  <p className="text-xs text-gray-500 mt-0.5">Shows during the configured period</p>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setPills(p => ({ ...p, limited: { ...p.limited, enabled: !p.limited.enabled } }))}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${pills.limited.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${pills.limited.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              {pills.limited.enabled && (
                <div className="px-3 py-3 space-y-3 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Pill Label *</label>
                    <input type="text" placeholder="e.g. This Weekend" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={pills.limited.label} onChange={(e) => { setPills(p => ({ ...p, limited: { ...p.limited, label: e.target.value } })); setFormErrorMsg(null); }} disabled={loading} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Date & Time *</label>
                      <input type="datetime-local" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={pills.limited.startDateTime} onChange={(e) => { setPills(p => ({ ...p, limited: { ...p.limited, startDateTime: e.target.value } })); setFormErrorMsg(null); }} disabled={loading} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Date & Time *</label>
                      <input type="datetime-local" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={pills.limited.endDateTime} onChange={(e) => { setPills(p => ({ ...p, limited: { ...p.limited, endDateTime: e.target.value } })); setFormErrorMsg(null); }} disabled={loading} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Outside Window *</label>
                    <div className="flex gap-4">
                      {(['hidePill', 'hideQuest'] as const).map(opt => (
                        <label key={opt} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                          <input type="radio" name="limited-outside" value={opt} checked={pills.limited.outsideWindowBehavior === opt} onChange={() => { setPills(p => ({ ...p, limited: { ...p.limited, outsideWindowBehavior: opt } })); setFormErrorMsg(null); }} disabled={loading} className="text-indigo-600 focus:ring-indigo-500" />
                          {opt === 'hidePill' ? 'Hide Pill' : 'Hide Quest'}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Event */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50">
                <div>
                  <span className="text-sm font-medium text-gray-800">Event</span>
                  <p className="text-xs text-gray-500 mt-0.5">Shows when the linked event is active and within its time window</p>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setPills(p => ({ ...p, event: { ...p.event, enabled: !p.event.enabled } }))}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${pills.event.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${pills.event.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              {pills.event.enabled && (
                <div className="px-3 py-3 border-t border-gray-100">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Event *</label>
                  <select
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={pills.event.eventId}
                    onChange={(e) => { setPills(p => ({ ...p, event: { ...p.event, eventId: e.target.value } })); setFormErrorMsg(null); }}
                    disabled={loading}
                  >
                    <option value="">Select an event...</option>
                    {activeEvents.map(ev => (
                      <option key={ev.eventId} value={ev.eventId}>{ev.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Featured */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50">
                <div>
                  <span className="text-sm font-medium text-gray-800">Featured</span>
                  <p className="text-xs text-gray-500 mt-0.5">Shows while featured is enabled. Optionally restrict to a time window.</p>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setPills(p => ({ ...p, featured: { ...p.featured, enabled: !p.featured.enabled } }))}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${pills.featured.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${pills.featured.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              {pills.featured.enabled && (
                <div className="px-3 py-3 space-y-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Restrict to time window</span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setPills(p => ({ ...p, featured: { ...p.featured, restrictToWindow: !p.featured.restrictToWindow } }))}
                      className={`relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${pills.featured.restrictToWindow ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform ${pills.featured.restrictToWindow ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  {pills.featured.restrictToWindow && (
                    <div className="grid grid-cols-2 gap-3 pl-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Start Date & Time *</label>
                        <input type="datetime-local" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={pills.featured.startDateTime} onChange={(e) => { setPills(p => ({ ...p, featured: { ...p.featured, startDateTime: e.target.value } })); setFormErrorMsg(null); }} disabled={loading} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">End Date & Time *</label>
                        <input type="datetime-local" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={pills.featured.endDateTime} onChange={(e) => { setPills(p => ({ ...p, featured: { ...p.featured, endDateTime: e.target.value } })); setFormErrorMsg(null); }} disabled={loading} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-4 sm:px-5 py-3.5 sm:py-3 border-t border-gray-200 bg-gray-50 rounded-none sm:rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 sm:py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 sm:py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : initialQuest ? 'Update Quest' : 'Create Quest'}
          </button>
        </div>
      </div>
    </div>
  );
}
