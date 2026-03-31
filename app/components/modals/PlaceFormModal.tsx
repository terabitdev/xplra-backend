'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Close, ChevronDown, ChevronRight } from '@carbon/icons-react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { Category } from '@/lib/domain/models/category';
import { ValidationConfig } from '@/lib/domain/models/validationConfig';

export interface CategorySelection_ {
  selectedId: string;
  path: string[];
}

export interface Place_ {
  placeId: string;
  name: string;
  geo: {
    lat: number;
    lng: number;
  };
  geohash: string;
  categorySelections: CategorySelection_[];
  location?: string;
  description?: string;
  source: "seed" | "user_contribution";
  status: "active" | "hidden" | "pending";
  type?: "checkin_time" | "qr_scan";
  requirements?: {
    minTimeSeconds?: number;
    radiusMeters?: number;
    qrData?: string;
  };
  xp?: number;
  imageUrls?: string[];
  validationConfigId?: string;
  validationConfig?: Partial<ValidationConfig>;
}

interface PlaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (place: Place_, imageFiles: File[]) => void;
  place?: Place_ | null;
  availableCategories?: Category[];
  availableValidationConfigs?: ValidationConfig[];
}

export default function PlaceFormModal({
  isOpen,
  onClose,
  onSubmit,
  place: initialPlace,
  availableCategories = [],
  availableValidationConfigs = [],
}: PlaceFormModalProps) {
  const [place, setPlace] = useState<Partial<Place_>>({
    placeId: '',
    name: '',
    geo: { lat: 0, lng: 0 },
    geohash: '',
    categorySelections: [],
    location: '',
    description: '',
    source: 'seed',
    status: 'active',
    type: 'checkin_time',
    requirements: {},
    imageUrls: [],
  });
  const [vcForm, setVcForm] = useState<Partial<ValidationConfig>>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formErrorMsg, setFormErrorMsg] = useState<string | null>(null);
  const [minTimeSeconds, setMinTimeSeconds] = useState<number>(0);
  const [radiusMeters, setRadiusMeters] = useState<number>(0);
  const [qrData, setQrData] = useState<string>('');
  const qrRef = useRef<HTMLDivElement>(null);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reverse geocode lat/lng to location name via Nominatim
  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    // Skip only when both are exactly 0 (no coordinates entered)
    if (lat === 0 && lng === 0) return;
    geocodeTimerRef.current = setTimeout(async () => {
      setLocationLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (data.address) {
          const a = data.address;
          const locality = a.city || a.town || a.village || a.hamlet || a.county || a.suburb || '';
          const code = a.country_code ? a.country_code.toUpperCase() : '';
          const short = [locality, code].filter(Boolean).join(', ');
          setPlace(prev => ({ ...prev, location: short || data.display_name || '' }));
        } else if (data.display_name) {
          setPlace(prev => ({ ...prev, location: data.display_name }));
        } else {
          setPlace(prev => ({ ...prev, location: '' }));
        }
      } catch {
        setPlace(prev => ({ ...prev, location: '' }));
      } finally {
        setLocationLoading(false);
      }
    }, 800);
  }, []);

  // Category picker state
  const [catPickerOpen, setCatPickerOpen] = useState(false);

  // Validation config field helpers (stable across renders)
  const setVcField = useCallback((field: string, value: unknown) => {
    setVcForm(prev => ({ ...prev, [field]: value }));
    setFormErrorMsg(null);
  }, []);

  const categoryMap = new Map(availableCategories.map(c => [c.id, c]));
  const selectedIds = new Set((place.categorySelections || []).map(cs => cs.selectedId));

  // Group categories: roots with their children
  const groupedCategories = useMemo(() => {
    const roots = availableCategories
      .filter(c => c.level === 0)
      .sort((a, b) => a.interestsOrder - b.interestsOrder);
    return roots.map(root => ({
      root,
      children: availableCategories
        .filter(c => c.parentId === root.id)
        .sort((a, b) => a.interestsOrder - b.interestsOrder),
    }));
  }, [availableCategories]);

  useEffect(() => {
    if (initialPlace) {
      setPlace(initialPlace);
      setImagePreviews(initialPlace.imageUrls || []);
      if (initialPlace.type === 'checkin_time' && initialPlace.requirements) {
        setMinTimeSeconds(initialPlace.requirements.minTimeSeconds || 0);
        setRadiusMeters(initialPlace.requirements.radiusMeters || 0);
      }
      if (initialPlace.type === 'qr_scan' && initialPlace.requirements?.qrData) {
        setQrData(initialPlace.requirements.qrData);
      }
    } else {
      const newPlaceId = `place_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setPlace({
        placeId: newPlaceId,
        name: '',
        geo: { lat: 0, lng: 0 },
        geohash: '',
        categorySelections: [],
        location: '',
        description: '',
        source: 'seed',
        status: 'active',
        type: 'checkin_time',
        requirements: {},
        imageUrls: [],
      });
      setImagePreviews([]);
      setMinTimeSeconds(0);
      setRadiusMeters(0);
      setQrData('');
    }
    // Load validation config for edit: from embedded data or by looking up the selected config
    if (initialPlace?.validationConfig) {
      setVcForm({ ...initialPlace.validationConfig });
    } else if (initialPlace?.validationConfigId) {
      const vc = availableValidationConfigs.find(c => c.id === initialPlace.validationConfigId);
      if (vc) setVcForm({ ...vc });
      else setVcForm({});
    } else {
      setVcForm({});
    }
    setFormErrorMsg(null);
    setImageFiles([]);
    setUploadError(null);
    setCatPickerOpen(false);
  }, [initialPlace, isOpen]);

  const handleToggleCategory = useCallback((cat: Category) => {
    setPlace(prev => {
      const current = prev.categorySelections || [];
      const exists = current.some(cs => cs.selectedId === cat.id);
      if (exists) {
        return { ...prev, categorySelections: current.filter(cs => cs.selectedId !== cat.id) };
      } else {
        const path = [...(cat.ancestorIds || []), cat.id];
        return { ...prev, categorySelections: [...current, { selectedId: cat.id, path }] };
      }
    });
  }, []);

  const handleRemoveCategory = useCallback((catId: string) => {
    setPlace(prev => {
      const current = prev.categorySelections || [];
      return { ...prev, categorySelections: current.filter(cs => cs.selectedId !== catId) };
    });
  }, []);

  const handleMinTimeSecondsChange = (value: number) => {
    setMinTimeSeconds(value);
    const newRequirements = { minTimeSeconds: value, radiusMeters };
    setPlace(prev => ({ ...prev, requirements: newRequirements }));
  };

  const handleRadiusMetersChange = (value: number) => {
    setRadiusMeters(value);
    const newRequirements = { minTimeSeconds, radiusMeters: value };
    setPlace(prev => ({ ...prev, requirements: newRequirements }));
  };

  const generateQRCode = () => {
    const randomString = Math.random().toString(36).substring(2, 15);
    const newQrData = `${place.placeId}_verify_${randomString}`;
    setQrData(newQrData);
    setPlace(prev => ({ ...prev, requirements: { qrData: newQrData } }));
  };

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
      link.download = `qr_${place.placeId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setUploadError(null);
    if (imageFiles.length + files.length > 4) {
      setUploadError('Maximum 4 images allowed');
      return;
    }
    for (const file of files) {
      if (file.size > 4 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds 4MB limit`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        setUploadError(`File "${file.name}" is not an image`);
        return;
      }
    }
    setImageFiles((prevFiles) => [...prevFiles, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    const preview = imagePreviews[index];
    if (preview?.startsWith('data:')) {
      // New file — find its index among only data: previews
      const newFileIndex = imagePreviews.slice(0, index).filter(p => p.startsWith('data:')).length;
      setImageFiles(prev => prev.filter((_, i) => i !== newFileIndex));
    } else {
      // Existing URL — remove it from place.imageUrls too
      setPlace(prev => ({
        ...prev,
        imageUrls: (prev.imageUrls || []).filter(url => url !== preview),
      }));
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  const validateForm = (): boolean => {
    const missing: string[] = [];

    // Place fields
    if (!place.name?.trim()) missing.push('Name');
    if (!place.geo?.lat) missing.push('Latitude');
    if (!place.geo?.lng) missing.push('Longitude');
    if (!place.description?.trim()) missing.push('Description');
    if (!place.categorySelections || place.categorySelections.length === 0) missing.push('Categories');

    // Validation config fields with labels
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
      if (val === undefined || val === null || val === '') {
        missing.push(label);
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
    if (imagePreviews.length === 0) {
      setUploadError('At least 1 image is required');
      return;
    }
    setLoading(true);
    try {
      const placeWithVc = { ...place, validationConfig: vcForm } as Place_;
      await onSubmit(placeWithVc, imageFiles);
      onClose();
    } catch (error) {
      console.error('Error submitting place:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 border-green-300 text-green-700';
      case 'hidden': return 'bg-gray-50 border-gray-300 text-gray-600';
      case 'pending': return 'bg-amber-50 border-amber-300 text-amber-700';
      default: return 'bg-gray-50 border-gray-300 text-gray-600';
    }
  };

  const resolveCategoryName = (catId: string) => categoryMap.get(catId)?.name || catId;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialPlace ? 'Edit Place' : 'New Place'}
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
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={place.name}
              onChange={(e) => { setPlace(prev => ({ ...prev, name: e.target.value })); if (formErrorMsg) setFormErrorMsg(null); }}
              disabled={loading}
              placeholder="Place name"
            />
          </div>

          {/* Geo Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Latitude *</label>
              <input
                type="number"
                step="any"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={place.geo?.lat || ''}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value) || 0;
                  setPlace(prev => ({ ...prev, geo: { ...prev.geo!, lat } }));
                  reverseGeocode(lat, place.geo?.lng || 0);
                  if (formErrorMsg) setFormErrorMsg(null);
                }}
                disabled={loading}
                placeholder="24.8607"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Longitude *</label>
              <input
                type="number"
                step="any"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={place.geo?.lng || ''}
                onChange={(e) => {
                  const lng = parseFloat(e.target.value) || 0;
                  setPlace(prev => ({ ...prev, geo: { ...prev.geo!, lng } }));
                  reverseGeocode(place.geo?.lat || 0, lng);
                  if (formErrorMsg) setFormErrorMsg(null);
                }}
                disabled={loading}
                placeholder="67.0011"
              />
            </div>
          </div>

          {/* Location (auto-generated from lat/lng) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
            <div className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 min-h-[34px] flex items-center">
              {locationLoading ? (
                <span className="text-gray-400 flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Fetching location...
                </span>
              ) : place.location ? (
                <span className="text-gray-700">{place.location}</span>
              ) : (
                <span className="text-gray-400">Enter coordinates to auto-detect location</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <textarea
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              rows={3}
              value={place.description || ''}
              onChange={(e) => { setPlace(prev => ({ ...prev, description: e.target.value })); if (formErrorMsg) setFormErrorMsg(null); }}
              disabled={loading}
              placeholder="Brief description of the place"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Categories <span className="text-red-500">*</span>
            </label>

            {/* Selected categories as chips */}
            {(place.categorySelections || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(place.categorySelections || []).map((cs) => (
                  <span
                    key={cs.selectedId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
                    title={resolveCategoryName(cs.selectedId)}
                  >
                    {resolveCategoryName(cs.selectedId)}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cs.selectedId)}
                      className="hover:text-indigo-900 ml-0.5"
                    >
                      <Close size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Toggle button */}
            <button
              type="button"
              onClick={() => setCatPickerOpen(!catPickerOpen)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-left text-gray-500 hover:border-gray-400 flex items-center justify-between"
            >
              <span>{catPickerOpen ? 'Close' : 'Select categories...'}</span>
              {catPickerOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {catPickerOpen && (
              <div className="mt-1.5 border border-gray-200 rounded-lg max-h-52 overflow-y-auto bg-white">
                {groupedCategories.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">No categories available</p>
                ) : (
                  groupedCategories.map(({ root, children }) => (
                    <div key={root.id}>
                      {/* Group header */}
                      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 sticky top-0">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{root.name}</span>
                      </div>
                      {/* Children */}
                      {children.length > 0 ? (
                        children.map(child => (
                          <label
                            key={child.id}
                            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-indigo-50 transition-colors ${
                              selectedIds.has(child.id) ? 'bg-indigo-50' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.has(child.id)}
                              onChange={() => handleToggleCategory(child)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                            />
                            <span className="text-sm text-gray-700">{child.name}</span>
                          </label>
                        ))
                      ) : (
                        <p className="px-3 py-1.5 text-xs text-gray-400 italic">No subcategories</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* QR Scan */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">QR Code</label>
              <button
                type="button"
                onClick={generateQRCode}
                className="w-full px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                {qrData ? 'Regenerate QR' : 'Generate QR Code'}
              </button>
            </div>

            {qrData && (
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                <div ref={qrRef} className="bg-white p-1.5 rounded-lg shadow-sm flex-shrink-0">
                  <QRCodeSVG value={qrData} size={80} level="H" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-gray-400 font-mono break-all leading-tight mb-1.5">
                    {qrData}
                  </p>
                  <button
                    type="button"
                    onClick={downloadQRCode}
                    className="px-2 py-1 text-[10px] bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded transition-colors font-medium inline-flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PNG
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* XP, Source & Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">XP *</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={place.xp || ''}
                onChange={(e) => setPlace(prev => ({ ...prev, xp: parseInt(e.target.value) || 0 }))}
                disabled={loading}
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Source *</label>
              <select
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={place.source}
                onChange={(e) => setPlace(prev => ({ ...prev, source: e.target.value as Place_['source'] }))}
                disabled={loading}
              >
                <option value="seed">Seed (Admin)</option>
                <option value="user_contribution">User Contribution</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${getStatusColor(place.status || 'active')}`}
                value={place.status}
                onChange={(e) => setPlace(prev => ({ ...prev, status: e.target.value as Place_['status'] }))}
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="hidden">Hidden</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Validation Config */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Validation Config</label>
            <select
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={place.validationConfigId || ''}
              onChange={(e) => {
                const selectedId = e.target.value || undefined;
                setPlace(prev => ({ ...prev, validationConfigId: selectedId }));
                if (selectedId) {
                  const vc = availableValidationConfigs.find(c => c.id === selectedId);
                  if (vc) {
                    setVcForm({ ...vc });
                  }
                } else {
                  setVcForm({});
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
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Geofence</h3>
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
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Sampling & Timing</h3>
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
                  <input type="number" min="5" max="20" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.timeToValidateSec ?? ''} onChange={(e) => setVcField('timeToValidateSec', parseInt(e.target.value) || 0)} disabled={loading} placeholder="5-20" />
                </div>
              </div>
            </div>

            {/* Dwell */}
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Dwell</h3>
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
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Availability Window</h3>
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
                    <div className="flex gap-1.5">
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((name, i) => (
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
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Completion</h3>
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
              <h3 className="text-sm font-semibold text-gray-800 mb-2">QR / Code Gating</h3>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={vcForm.requireQrOrCode ?? false} onChange={(e) => setVcField('requireQrOrCode', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
                Require QR or Code
              </label>
              {vcForm.requireQrOrCode && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">QR Token TTL (sec) *</label>
                    <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.qrTokenTtlSec ?? ''} onChange={(e) => setVcField('qrTokenTtlSec', parseInt(e.target.value) || 0)} disabled={loading} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Max Code Attempts *</label>
                    <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.maxCodeAttempts ?? ''} onChange={(e) => setVcField('maxCodeAttempts', parseInt(e.target.value) || 0)} disabled={loading} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Code Attempt Window (sec) *</label>
                    <input type="number" min="0" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.codeAttemptWindowSec ?? ''} onChange={(e) => setVcField('codeAttemptWindowSec', parseInt(e.target.value) || 0)} disabled={loading} />
                  </div>
                </div>
              )}
            </div>

            {/* Fraud & Limits */}
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Fraud & Limits</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Active Sessions/User *</label>
                  <input type="number" min="1" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.maxActiveSessionsPerUser ?? ''} onChange={(e) => setVcField('maxActiveSessionsPerUser', parseInt(e.target.value) || 1)} disabled={loading} placeholder="e.g. 1" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Audit Log Level *</label>
                  <select className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" value={vcForm.auditLogLevel || 'basic'} onChange={(e) => setVcField('auditLogLevel', e.target.value)} disabled={loading}>
                    <option value="off">Off</option>
                    <option value="basic">Basic</option>
                    <option value="verbose">Verbose</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={vcForm.denyIfMockLocationSuspected ?? true} onChange={(e) => setVcField('denyIfMockLocationSuspected', e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" disabled={loading} />
                Deny If Mock Location Suspected
              </label>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Upload Place Images <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(Max 4 images, 4MB each)</span>
            </label>
            <input
              type="file"
              id="placeImages"
              accept="image/*"
              multiple
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              onChange={handleImageChange}
              disabled={loading || imagePreviews.length >= 4}
              value=""
            />
            {uploadError && (
              <p className="text-red-500 text-xs mt-1">{uploadError}</p>
            )}

            {imagePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={preview}
                      alt={`Place Image ${index + 1}`}
                      width={200}
                      height={200}
                      className="object-cover rounded-md border-2 border-gray-200 w-full h-24"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 disabled:opacity-50 text-xs"
                      disabled={loading}
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imagePreviews.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">No images uploaded</p>
            )}
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
            {loading ? 'Saving...' : (initialPlace ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}
