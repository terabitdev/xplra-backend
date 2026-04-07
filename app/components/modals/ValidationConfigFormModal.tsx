'use client';

import { useState, useEffect } from 'react';
import { Close } from '@carbon/icons-react';
import { ValidationConfig } from '@/lib/domain/models/validationConfig';

interface ValidationConfigFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: Partial<ValidationConfig>) => void;
  config?: ValidationConfig | null;
  usageCount?: number;
}

export default function ValidationConfigFormModal({
  isOpen,
  onClose,
  onSubmit,
  config: initialConfig,
  usageCount = 0,
}: ValidationConfigFormModalProps) {
  const [form, setForm] = useState<Partial<ValidationConfig>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formErrorMsg, setFormErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialConfig) {
      setForm({ ...initialConfig });
    } else {
      setForm({
        name: '',
        radiusM: undefined,
        minAccuracyM: undefined,
        maxSpeedMps: undefined,
        requireLocationServices: false,
        minAcceptedSamplesToLock: undefined,
        pingRecommendedIntervalSec: undefined,
        maxStalePingSec: undefined,
        sessionTtlSec: undefined,
        timeToValidateSec: undefined,
        dwellRequiredSec: undefined,
        graceConsecutiveOutsideSec: undefined,
        graceTotalOutsideSec: undefined,
        requireInsideOnComplete: false,
        useScheduleWindow: false,
        schedule: { startTime: '', endTime: '', daysOfWeek: [] },
        oneTimeOnly: false,
        cooldownSec: undefined,
        requireQrOrCode: false,
        qrTokenTtlSec: undefined,
        maxCodeAttempts: undefined,
        codeAttemptWindowSec: undefined,
        maxActiveSessionsPerUser: undefined,
        denyIfMockLocationSuspected: true,
        auditLogLevel: 'basic',
      });
    }
    setErrors({});
    setFormErrorMsg(null);
  }, [initialConfig, isOpen]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    // Required fields check — show "Required" under each empty field
    const requiredFields: { key: keyof ValidationConfig; label: string }[] = [
      { key: 'name', label: 'Name' },
      { key: 'radiusM', label: 'Radius (m)' },
      { key: 'minAccuracyM', label: 'Min Accuracy (m)' },
      { key: 'maxSpeedMps', label: 'Max Speed (m/s)' },
      { key: 'minAcceptedSamplesToLock', label: 'Min Accepted Samples' },
      { key: 'pingRecommendedIntervalSec', label: 'Ping Interval (sec)' },
      { key: 'maxStalePingSec', label: 'Max Stale Ping (sec)' },
      { key: 'sessionTtlSec', label: 'Session TTL (sec)' },
      { key: 'timeToValidateSec', label: 'Time to Validate (sec)' },
      { key: 'dwellRequiredSec', label: 'Dwell Required (sec)' },
      { key: 'graceConsecutiveOutsideSec', label: 'Grace Consecutive Outside (sec)' },
      { key: 'graceTotalOutsideSec', label: 'Grace Total Outside (sec)' },
      { key: 'maxActiveSessionsPerUser', label: 'Max Active Sessions/User' },
      { key: 'cooldownSec', label: 'Cooldown (sec)' },
    ];

    for (const { key } of requiredFields) {
      const val = key === 'name' ? form.name?.trim() : form[key];
      if (val === undefined || val === null || val === '') {
        errs[key] = 'Required';
      }
    }

    // Additional validations
    if (form.timeToValidateSec !== undefined && (form.timeToValidateSec < 5 || form.timeToValidateSec > 20)) {
      errs.timeToValidateSec = 'Must be between 5 and 20 seconds';
    }
    if (form.useScheduleWindow) {
      if (!form.schedule?.startTime) errs.startTime = 'Start time is required';
      if (!form.schedule?.endTime) errs.endTime = 'End time is required';
      if (!form.schedule?.daysOfWeek || form.schedule.daysOfWeek.length === 0) {
        errs.daysOfWeek = 'Select at least one day';
      }
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      setFormErrorMsg('Please fill all required fields');
      return false;
    }

    setFormErrorMsg(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const setField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (formErrorMsg) setFormErrorMsg(null);
  };

  const handleDayToggle = (day: number) => {
    const current = form.schedule?.daysOfWeek || [];
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day].sort();
    setForm(prev => ({ ...prev, schedule: { ...prev.schedule, daysOfWeek: updated } }));
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const sectionClass = "space-y-3 border-t border-gray-200 pt-3";
  const sectionTitle = "text-sm font-semibold text-gray-800 mb-2";
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialConfig ? 'Edit Validation Config' : 'New Validation Config'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors" disabled={loading}>
            <Close size={20} />
          </button>
        </div>

        {/* Usage warning */}
        {initialConfig && usageCount > 0 && (
          <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 font-medium">
              This config is used by {usageCount} place(s). Changes will affect all of them.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {formErrorMsg && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600 font-medium">{formErrorMsg}</p>
            </div>
          )}
          {/* Name */}
          <div>
            <label className={labelClass}>Name *</label>
            <input
              type="text"
              className={`${inputClass} ${errors.name ? 'border-red-400' : ''}`}
              value={form.name || ''}
              onChange={(e) => setField('name', e.target.value)}
              required
              disabled={loading}
              placeholder="e.g. Caf\u00e9 Standard"
            />
          </div>

          {/* Geofence */}
          <div className={sectionClass}>
            <h3 className={sectionTitle}>Geofence</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Radius (m) *</label>
                <input type="number" min="0" className={`${inputClass} ${errors.radiusM ? 'border-red-400' : ''}`} value={form.radiusM ?? ''} onChange={(e) => setField('radiusM', parseFloat(e.target.value) || 0)} disabled={loading} placeholder="e.g. 150" />
              </div>
              <div>
                <label className={labelClass}>Min Accuracy (m) *</label>
                <input type="number" min="0" className={`${inputClass} ${errors.minAccuracyM ? 'border-red-400' : ''}`} value={form.minAccuracyM ?? ''} onChange={(e) => setField('minAccuracyM', parseFloat(e.target.value) || 0)} disabled={loading} placeholder="e.g. 40" />
              </div>
              <div>
                <label className={labelClass}>Max Speed (m/s) *</label>
                <input type="number" min="0" step="any" className={`${inputClass} ${errors.maxSpeedMps ? 'border-red-400' : ''}`} value={form.maxSpeedMps ?? ''} onChange={(e) => setField('maxSpeedMps', e.target.value ? parseFloat(e.target.value) : undefined)} disabled={loading} placeholder="e.g. 5" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.requireLocationServices ?? false} onChange={(e) => setField('requireLocationServices', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
              Require Location Services
            </label>
          </div>

          {/* Sampling & Timing */}
          <div className={sectionClass}>
            <h3 className={sectionTitle}>Sampling & Timing</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Min Accepted Samples *</label>
                <input type="number" min="1" className={`${inputClass} ${errors.minAcceptedSamplesToLock ? 'border-red-400' : ''}`} value={form.minAcceptedSamplesToLock ?? ''} onChange={(e) => setField('minAcceptedSamplesToLock', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 2" />
              </div>
              <div>
                <label className={labelClass}>Ping Interval (sec) *</label>
                <input type="number" min="1" className={`${inputClass} ${errors.pingRecommendedIntervalSec ? 'border-red-400' : ''}`} value={form.pingRecommendedIntervalSec ?? ''} onChange={(e) => setField('pingRecommendedIntervalSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 20" />
              </div>
              <div>
                <label className={labelClass}>Max Stale Ping (sec) *</label>
                <input type="number" min="0" className={`${inputClass} ${errors.maxStalePingSec ? 'border-red-400' : ''}`} value={form.maxStalePingSec ?? ''} onChange={(e) => setField('maxStalePingSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 90" />
              </div>
              <div>
                <label className={labelClass}>Session TTL (sec) *</label>
                <input type="number" min="0" className={`${inputClass} ${errors.sessionTtlSec ? 'border-red-400' : ''}`} value={form.sessionTtlSec ?? ''} onChange={(e) => setField('sessionTtlSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 1800" />
              </div>
              <div>
                <label className={labelClass}>Time to Validate (sec) *</label>
                <input type="number" min="5" max="20" className={`${inputClass} ${errors.timeToValidateSec ? 'border-red-400' : ''}`} value={form.timeToValidateSec ?? ''} onChange={(e) => setField('timeToValidateSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="5-20" />
              </div>
            </div>
          </div>

          {/* Dwell */}
          <div className={sectionClass}>
            <h3 className={sectionTitle}>Dwell</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Dwell Required (sec) *</label>
                <input type="number" min="0" className={`${inputClass} ${errors.dwellRequiredSec ? 'border-red-400' : ''}`} value={form.dwellRequiredSec ?? ''} onChange={(e) => setField('dwellRequiredSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 300" />
              </div>
              <div>
                <label className={labelClass}>Grace Consecutive Outside (sec) *</label>
                <input type="number" min="0" className={`${inputClass} ${errors.graceConsecutiveOutsideSec ? 'border-red-400' : ''}`} value={form.graceConsecutiveOutsideSec ?? ''} onChange={(e) => setField('graceConsecutiveOutsideSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 60" />
              </div>
              <div>
                <label className={labelClass}>Grace Total Outside (sec) *</label>
                <input type="number" min="0" className={`${inputClass} ${errors.graceTotalOutsideSec ? 'border-red-400' : ''}`} value={form.graceTotalOutsideSec ?? ''} onChange={(e) => setField('graceTotalOutsideSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="e.g. 120" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.requireInsideOnComplete ?? false} onChange={(e) => setField('requireInsideOnComplete', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
              Require Inside On Complete
            </label>
          </div>

          {/* Availability Window */}
          <div className={sectionClass}>
            <h3 className={sectionTitle}>Availability Window</h3>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.useScheduleWindow ?? false} onChange={(e) => setField('useScheduleWindow', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
              Use Schedule Window
            </label>
            {form.useScheduleWindow && (
              <div className="space-y-3 ml-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Start Time *</label>
                    <input type="time" className={`${inputClass} ${errors.startTime ? 'border-red-400' : ''}`} value={form.schedule?.startTime || ''} onChange={(e) => { setForm(prev => ({ ...prev, schedule: { ...prev.schedule, startTime: e.target.value } })); if (errors.startTime) setErrors(prev => ({ ...prev, startTime: '' })); }} disabled={loading} />
                  </div>
                  <div>
                    <label className={labelClass}>End Time *</label>
                    <input type="time" className={`${inputClass} ${errors.endTime ? 'border-red-400' : ''}`} value={form.schedule?.endTime || ''} onChange={(e) => { setForm(prev => ({ ...prev, schedule: { ...prev.schedule, endTime: e.target.value } })); if (errors.endTime) setErrors(prev => ({ ...prev, endTime: '' })); }} disabled={loading} />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Overnight windows supported (e.g., 22:00 to 06:00)</p>
                <div>
                  <label className={labelClass}>Days of Week *</label>
                  <div className="flex gap-1.5">
                    {dayNames.map((name, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleDayToggle(i)}
                        className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                          (form.schedule?.daysOfWeek || []).includes(i)
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
          <div className={sectionClass}>
            <h3 className={sectionTitle}>Completion</h3>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.oneTimeOnly ?? false} onChange={(e) => setField('oneTimeOnly', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
              One-Time Only
            </label>
            <div className="w-48">
              <label className={labelClass}>Cooldown (sec) *</label>
              <input type="number" min="0" className={`${inputClass} ${errors.cooldownSec ? 'border-red-400' : ''}`} value={form.cooldownSec ?? ''} onChange={(e) => setField('cooldownSec', e.target.value ? parseInt(e.target.value) : undefined)} disabled={loading} placeholder="e.g. 300" />
            </div>
          </div>

          {/* QR / Code Gating */}
          <div className={sectionClass}>
            <h3 className={sectionTitle}>QR / Code Gating</h3>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.requireQrOrCode ?? false} onChange={(e) => setField('requireQrOrCode', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
              Require QR or Code
            </label>
            {form.requireQrOrCode && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>QR Token TTL (sec) *</label>
                  <input type="number" min="0" className={inputClass} value={form.qrTokenTtlSec ?? ''} onChange={(e) => setField('qrTokenTtlSec', parseInt(e.target.value) || 0)} disabled={loading} />
                </div>
                <div>
                  <label className={labelClass}>Max Code Attempts *</label>
                  <input type="number" min="0" className={inputClass} value={form.maxCodeAttempts ?? ''} onChange={(e) => setField('maxCodeAttempts', parseInt(e.target.value) || 0)} disabled={loading} />
                </div>
                <div>
                  <label className={labelClass}>Code Attempt Window (sec) *</label>
                  <input type="number" min="0" className={inputClass} value={form.codeAttemptWindowSec ?? ''} onChange={(e) => setField('codeAttemptWindowSec', parseInt(e.target.value) || 0)} disabled={loading} />
                </div>
              </div>
            )}
          </div>

          {/* Fraud & Limits */}
          <div className={sectionClass}>
            <h3 className={sectionTitle}>Fraud & Limits</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Max Active Sessions/User *</label>
                <input type="number" min="1" className={`${inputClass} ${errors.maxActiveSessionsPerUser ? 'border-red-400' : ''}`} value={form.maxActiveSessionsPerUser ?? ''} onChange={(e) => setField('maxActiveSessionsPerUser', parseInt(e.target.value) || 1)} disabled={loading} placeholder="e.g. 1" />
              </div>
              <div>
                <label className={labelClass}>Audit Log Level *</label>
                <select className={inputClass} value={form.auditLogLevel || 'basic'} onChange={(e) => setField('auditLogLevel', e.target.value)} disabled={loading}>
                  <option value="off">Off</option>
                  <option value="basic">Basic</option>
                  <option value="verbose">Verbose</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.denyIfMockLocationSuspected ?? false} onChange={(e) => setField('denyIfMockLocationSuspected', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
              Deny If Mock Location Suspected
            </label>
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
            disabled={loading}
          >
            {loading ? 'Saving...' : (initialConfig ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}
