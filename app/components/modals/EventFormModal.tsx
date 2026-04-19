'use client';

import { useState, useEffect, useCallback } from 'react';
import { Close } from '@carbon/icons-react';
import { ValidationConfig, ValidationMode } from '@/lib/domain/models/validationConfig';
import { Event } from '@/lib/domain/models/event';
import { Place } from '@/lib/domain/models/place';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: Partial<Event>) => void;
  event?: Event | null;
  availableValidationConfigs?: ValidationConfig[];
  availablePlaces?: Place[];
}

function toDatetimeLocal(iso?: string): string {
  if (!iso) return '';
  // datetime-local requires "YYYY-MM-DDTHH:mm"
  return iso.slice(0, 16);
}

export default function EventFormModal({
  isOpen,
  onClose,
  onSubmit,
  event: initialEvent,
  availableValidationConfigs = [],
  availablePlaces = [],
}: EventFormModalProps) {
  const [form, setForm] = useState<Partial<Event>>({
    title: '',
    placeId: null,
    geoOverride: undefined,
    startTime: '',
    endTime: '',
    eventPreGraceMin: undefined,
    eventPostGraceMin: undefined,
    validationConfigId: null,
    isActive: true,
  });
  const [vcForm, setVcForm] = useState<Partial<ValidationConfig>>({ mode: 'CHECKIN' });
  const [hasGeoOverride, setHasGeoOverride] = useState(false);
  const [geoLat, setGeoLat] = useState('');
  const [geoLng, setGeoLng] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrorMsg, setFormErrorMsg] = useState<string | null>(null);

  const setVcField = useCallback((field: string, value: unknown) => {
    setVcForm(prev => ({ ...prev, [field]: value }));
    setFormErrorMsg(null);
  }, []);

  useEffect(() => {
    if (initialEvent) {
      setForm({
        ...initialEvent,
        startTime: toDatetimeLocal(initialEvent.startTime),
        endTime: toDatetimeLocal(initialEvent.endTime),
      });
      if (initialEvent.geoOverride) {
        setHasGeoOverride(true);
        setGeoLat(String(initialEvent.geoOverride.lat));
        setGeoLng(String(initialEvent.geoOverride.lng));
      } else {
        setHasGeoOverride(!initialEvent.placeId);
        setGeoLat('');
        setGeoLng('');
      }
      if (initialEvent.validationConfig) {
        // Prefer inline snapshot (has the user's saved mode + field values)
        const inline = initialEvent.validationConfig;
        if (initialEvent.validationConfigId) {
          const vc = availableValidationConfigs.find(c => c.id === initialEvent.validationConfigId);
          // Merge: live VC fields as base, inline overrides (mode + any edited values)
          setVcForm({ ...(vc || {}), ...inline });
        } else {
          setVcForm({ ...inline });
        }
      } else if (initialEvent.validationConfigId) {
        const vc = availableValidationConfigs.find(c => c.id === initialEvent.validationConfigId);
        setVcForm(vc ? { ...vc } : {});
      } else {
        setVcForm({});
      }
    } else {
      setForm({
        title: '',
        placeId: null,
        geoOverride: undefined,
        startTime: '',
        endTime: '',
        eventPreGraceMin: undefined,
        eventPostGraceMin: undefined,
        validationConfigId: null,
        isActive: true,
      });
      setHasGeoOverride(true); // default: no placeId, so geoOverride required
      setGeoLat('');
      setGeoLng('');
      setVcForm({ mode: 'CHECKIN' });
    }
    setFormErrorMsg(null);
  }, [initialEvent, isOpen, availableValidationConfigs]);

  const handlePlaceSelect = (placeId: string) => {
    const pid = placeId || null;
    setForm(prev => ({ ...prev, placeId: pid }));
    setFormErrorMsg(null);
  };

  const mode = vcForm.mode || 'CHECKIN';

  const showSampling = ['CHECKIN', 'ACCRUAL', 'HYBRID'].includes(mode);
  const showDwell = ['DWELL', 'HYBRID'].includes(mode);
  const showQr = ['QR_CODE', 'CODE_PHRASE', 'HYBRID'].includes(mode);

  const validateForm = (): boolean => {
    const missing: string[] = [];

    if (!form.title?.trim()) missing.push('Title');
    if (!form.startTime) missing.push('Start Time');
    if (!form.endTime) missing.push('End Time');
    if (form.startTime && form.endTime && new Date(form.startTime) >= new Date(form.endTime)) {
      setFormErrorMsg('End Time must be after Start Time');
      return false;
    }
    if (!form.placeId && !hasGeoOverride) {
      missing.push('Geo Override (required when no Place ID)');
    }
    if (hasGeoOverride && (!geoLat || !geoLng)) {
      missing.push('Geo Override Lat/Lng');
    }
    if (geoLat) {
      const lat = parseFloat(geoLat);
      if (lat < -90 || lat > 90) {
        setFormErrorMsg('Latitude must be between -90 and 90');
        return false;
      }
    }
    if (geoLng) {
      const lng = parseFloat(geoLng);
      if (lng < -180 || lng > 180) {
        setFormErrorMsg('Longitude must be between -180 and 180');
        return false;
      }
    }

    // Always required
    const alwaysRequired: { key: keyof ValidationConfig; label: string }[] = [
      { key: 'radiusM', label: 'Radius (m)' },
      { key: 'minAccuracyM', label: 'Min Accuracy (m)' },
      { key: 'maxActiveSessionsPerUser', label: 'Max Active Sessions/User' },
      { key: 'cooldownSec', label: 'Cooldown (sec)' },
    ];

    // Mode-conditional required fields
    const samplingRequired: { key: keyof ValidationConfig; label: string }[] = showSampling ? [
      { key: 'minAcceptedSamplesToLock', label: 'Min Accepted Samples' },
      { key: 'pingRecommendedIntervalSec', label: 'Ping Interval (sec)' },
      { key: 'maxStalePingSec', label: 'Max Stale Ping (sec)' },
      { key: 'sessionTtlSec', label: 'Session TTL (sec)' },
      { key: 'timeToValidateSec', label: 'Time to Validate (sec)' },
      { key: 'maxSpeedMps', label: 'Max Speed (m/s)' },
    ] : [];

    const dwellRequired: { key: keyof ValidationConfig; label: string }[] = showDwell ? [
      { key: 'dwellRequiredSec', label: 'Dwell Required (sec)' },
      { key: 'graceConsecutiveOutsideSec', label: 'Grace Consecutive Outside (sec)' },
      { key: 'graceTotalOutsideSec', label: 'Grace Total Outside (sec)' },
    ] : [];

    for (const { key, label } of [...alwaysRequired, ...samplingRequired, ...dwellRequired]) {
      const val = vcForm[key];
      if (val === undefined || val === null || val === '') missing.push(label);
    }

    // Availability Window validation (when schedule window is enabled)
    if (vcForm.useScheduleWindow) {
      if (!vcForm.schedule?.startTime) missing.push('Schedule Start Time');
      if (!vcForm.schedule?.endTime) missing.push('Schedule End Time');
      if (!vcForm.schedule?.daysOfWeek || vcForm.schedule.daysOfWeek.length === 0) {
        missing.push('Days of Week');
      }
    }

    if (missing.length > 0) {
      setFormErrorMsg(`Please fill: ${missing.join(', ')}`);
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
      const geoOverride = geoLat && geoLng
        ? { lat: parseFloat(geoLat), lng: parseFloat(geoLng), geohash: '' }
        : undefined;

      const payload: Partial<Event> = {
        ...form,
        startTime: new Date(form.startTime!).toISOString(),
        endTime: new Date(form.endTime!).toISOString(),
        geoOverride,
        validationConfig: vcForm,
      };
      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error('Error submitting event:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialEvent ? 'Edit Event' : 'New Event'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors" disabled={loading}>
            <Close size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
          {formErrorMsg && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600 font-medium">{formErrorMsg}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.title || ''}
              onChange={(e) => { setForm(prev => ({ ...prev, title: e.target.value })); setFormErrorMsg(null); }}
              disabled={loading}
              placeholder="Event title"
            />
          </div>

          {/* Start & End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Time *</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={form.startTime || ''}
                onChange={(e) => { setForm(prev => ({ ...prev, startTime: e.target.value })); setFormErrorMsg(null); }}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Time *</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={form.endTime || ''}
                onChange={(e) => { setForm(prev => ({ ...prev, endTime: e.target.value })); setFormErrorMsg(null); }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Grace Periods */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pre Grace (min)</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={form.eventPreGraceMin !== undefined ? form.eventPreGraceMin : ''}
                onChange={(e) => setForm(prev => ({ ...prev, eventPreGraceMin: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 }))}
                disabled={loading}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Post Grace (min)</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={form.eventPostGraceMin !== undefined ? form.eventPostGraceMin : ''}
                onChange={(e) => setForm(prev => ({ ...prev, eventPostGraceMin: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 }))}
                disabled={loading}
                placeholder="0"
              />
            </div>
          </div>

          {/* Place (dropdown) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Place <span className="text-gray-400 font-normal">(optional — or set coordinates below)</span>
            </label>
            <select
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.placeId || ''}
              onChange={(e) => handlePlaceSelect(e.target.value)}
              disabled={loading}
            >
              <option value="">— No place selected —</option>
              {availablePlaces.map((p) => (
                <option key={p.placeId} value={p.placeId}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Geo Override */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-2">
            <span className="text-xs font-medium text-gray-700">
              Geo Override
              {!form.placeId && <span className="text-red-500 ml-1">*</span>}
              {form.placeId
                ? <span className="text-gray-400 font-normal ml-1">(optional — overrides place location)</span>
                : <span className="text-gray-400 font-normal ml-1">(required if no place selected)</span>
              }
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Latitude {!form.placeId && '*'}</label>
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={geoLat}
                  onChange={(e) => { setGeoLat(e.target.value); setFormErrorMsg(null); }}
                  disabled={loading}
                  placeholder="e.g. -90 to 90"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Longitude {!form.placeId && '*'}</label>
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={geoLng}
                  onChange={(e) => { setGeoLng(e.target.value); setFormErrorMsg(null); }}
                  disabled={loading}
                  placeholder="e.g. -180 to 180"
                />
              </div>
            </div>
          </div>

          {/* Is Active */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">Active</span>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                form.isActive ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mode</label>
            <select
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={mode}
              onChange={(e) => setVcField('mode', e.target.value as ValidationMode)}
              disabled={loading}
            >
              {(['CHECKIN', 'DWELL', 'QR_CODE', 'CODE_PHRASE', 'ACCRUAL', 'HYBRID'] as ValidationMode[]).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Validation Config Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Validation Config</label>
            <select
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.validationConfigId || ''}
              onChange={(e) => {
                const selectedId = e.target.value || null;
                setForm(prev => ({ ...prev, validationConfigId: selectedId }));
                if (selectedId) {
                  const vc = availableValidationConfigs.find(c => c.id === selectedId);
                  if (vc) setVcForm(prev => ({ ...vc, mode: prev.mode }));
                } else {
                  setVcForm(prev => ({ mode: prev.mode }));
                }
              }}
              disabled={loading}
            >
              <option value="">Select a validation config...</option>
              {availableValidationConfigs.map((vc) => (
                <option key={vc.id} value={vc.id}>{vc.name}</option>
              ))}
            </select>
          </div>

          {/* Validation Config Fields */}
          <div className="space-y-4">

            {/* Geofence */}
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-800">Geofence</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Radius (m) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.radiusM ?? ''} onChange={(e) => setVcField('radiusM', parseFloat(e.target.value) || 0)} disabled={loading} placeholder="e.g. 150" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Accuracy (m) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.minAccuracyM ?? ''} onChange={(e) => setVcField('minAccuracyM', parseFloat(e.target.value) || 0)} disabled={loading} placeholder="e.g. 40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Speed (m/s) *</label>
                  <input type="number" min="0" step="any" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.maxSpeedMps ?? ''} onChange={(e) => setVcField('maxSpeedMps', e.target.value ? parseFloat(e.target.value) : undefined)} disabled={loading} placeholder="e.g. 5" />
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
                  <input type="number" min="1" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.minAcceptedSamplesToLock ?? ''} onChange={(e) => setVcField('minAcceptedSamplesToLock', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ping Interval (sec) *</label>
                  <input type="number" min="1" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.pingRecommendedIntervalSec ?? ''} onChange={(e) => setVcField('pingRecommendedIntervalSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Stale Ping (sec) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.maxStalePingSec ?? ''} onChange={(e) => setVcField('maxStalePingSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 90" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Session TTL (sec) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.sessionTtlSec ?? ''} onChange={(e) => setVcField('sessionTtlSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 1800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Time to Validate (sec) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.timeToValidateSec ?? ''} onChange={(e) => setVcField('timeToValidateSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 10" />
                </div>
              </div>
            </div>

            {/* Dwell */}
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-800">Dwell</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dwell Required (sec) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.dwellRequiredSec ?? ''} onChange={(e) => setVcField('dwellRequiredSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Grace Consecutive Outside (sec) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.graceConsecutiveOutsideSec ?? ''} onChange={(e) => setVcField('graceConsecutiveOutsideSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 60" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Grace Total Outside (sec) *</label>
                  <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.graceTotalOutsideSec ?? ''} onChange={(e) => setVcField('graceTotalOutsideSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 120" />
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
                      <input type="time" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.schedule?.startTime || ''} onChange={(e) => { setVcForm(prev => ({ ...prev, schedule: { ...prev.schedule, startTime: e.target.value } })); setFormErrorMsg(null); }} disabled={loading} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Time *</label>
                      <input type="time" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.schedule?.endTime || ''} onChange={(e) => { setVcForm(prev => ({ ...prev, schedule: { ...prev.schedule, endTime: e.target.value } })); setFormErrorMsg(null); }} disabled={loading} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Days of Week *</label>
                    <div className="flex gap-1.5">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name, i) => (
                        <button key={i} type="button" onClick={() => {
                          const current = vcForm.schedule?.daysOfWeek || [];
                          const updated = current.includes(i) ? current.filter((d: number) => d !== i) : [...current, i].sort();
                          setVcForm(prev => ({ ...prev, schedule: { ...prev.schedule, daysOfWeek: updated } }));
                        }} className={`px-2 py-1 text-xs rounded-lg border transition-colors ${(vcForm.schedule?.daysOfWeek || []).includes(i) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`} disabled={loading}>{name}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Completion */}
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-800">Completion</h3>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={vcForm.oneTimeOnly ?? false} onChange={(e) => setVcField('oneTimeOnly', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
                One-Time Only
              </label>
              <div className="w-48">
                <label className="block text-xs font-medium text-gray-600 mb-1">Cooldown (sec) *</label>
                <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.cooldownSec ?? ''} onChange={(e) => setVcField('cooldownSec', e.target.value ? parseInt(e.target.value) : undefined)} disabled={loading} placeholder="e.g. 300" />
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
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">QR Token TTL (sec)</label>
                    <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.qrTokenTtlSec ?? ''} onChange={(e) => setVcField('qrTokenTtlSec', parseInt(e.target.value) || 0)} disabled={loading} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Max Code Attempts</label>
                    <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.maxCodeAttempts ?? ''} onChange={(e) => setVcField('maxCodeAttempts', parseInt(e.target.value) || 0)} disabled={loading} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Code Attempt Window (sec)</label>
                    <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.codeAttemptWindowSec ?? ''} onChange={(e) => setVcField('codeAttemptWindowSec', parseInt(e.target.value) || 0)} disabled={loading} />
                  </div>
                </div>
              )}
            </div>

            {/* Fraud & Limits */}
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-800">Fraud & Limits</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Active Sessions/User *</label>
                  <input type="number" min="1" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.maxActiveSessionsPerUser ?? ''} onChange={(e) => setVcField('maxActiveSessionsPerUser', parseInt(e.target.value) || 1)} disabled={loading} placeholder="e.g. 1" />
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
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : (initialEvent ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}
