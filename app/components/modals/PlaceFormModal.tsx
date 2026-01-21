'use client';

import { useState, useEffect, useRef } from 'react';
import { Close } from '@carbon/icons-react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';

export interface Place_ {
  placeId: string;
  name: string;
  geo: {
    lat: number;
    lng: number;
  };
  geohash: string;
  categories: string[];
  address?: string;
  description?: string;
  source: "seed" | "user_contribution";
  status: "active" | "hidden" | "pending";
  type?: "checkin_time" | "qr_scan";
  requirements?: {
    minTimeSeconds?: number;
    radiusMeters?: number;
    qrData?: string;
  };
  imageUrls?: string[];
}

interface CategoryOption {
  id: string;
  name: string;
}

interface PlaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (place: Place_, imageFiles: File[]) => void;
  place?: Place_ | null;
  availableCategories?: CategoryOption[];
}

export default function PlaceFormModal({
  isOpen,
  onClose,
  onSubmit,
  place: initialPlace,
  availableCategories = [],
}: PlaceFormModalProps) {
  const [place, setPlace] = useState<Partial<Place_>>({
    placeId: '',
    name: '',
    geo: { lat: 0, lng: 0 },
    geohash: '',
    categories: [],
    address: '',
    description: '',
    source: 'seed',
    status: 'active',
    type: 'checkin_time',
    requirements: {},
    imageUrls: [],
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [minTimeSeconds, setMinTimeSeconds] = useState<number>(0);
  const [radiusMeters, setRadiusMeters] = useState<number>(0);
  const [qrData, setQrData] = useState<string>('');
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPlace) {
      setPlace(initialPlace);
      setImagePreviews(initialPlace.imageUrls || []);
      // Extract type-specific requirements
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
        categories: [],
        address: '',
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
    setImageFiles([]);
    setUploadError(null);
  }, [initialPlace, isOpen]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategory = e.target.value;
    if (selectedCategory) {
      setPlace({ ...place, categories: [selectedCategory] });
    } else {
      setPlace({ ...place, categories: [] });
    }
  };

  const handleMinTimeSecondsChange = (value: number) => {
    setMinTimeSeconds(value);
    const newRequirements = { minTimeSeconds: value, radiusMeters };
    setPlace({ ...place, requirements: newRequirements });
  };

  const handleRadiusMetersChange = (value: number) => {
    setRadiusMeters(value);
    const newRequirements = { minTimeSeconds, radiusMeters: value };
    setPlace({ ...place, requirements: newRequirements });
  };

  // Generate unique QR code data
  const generateQRCode = () => {
    const randomString = Math.random().toString(36).substring(2, 15);
    const newQrData = `${place.placeId}_verify_${randomString}`;
    setQrData(newQrData);
    setPlace({ ...place, requirements: { qrData: newQrData } });
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
      link.download = `qr_${place.placeId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setUploadError(null);

    // Check max 4 images limit
    if (imageFiles.length + files.length > 4) {
      setUploadError('Maximum 4 images allowed');
      return;
    }

    // Validate each file
    for (const file of files) {
      // Check file size (4MB = 4 * 1024 * 1024 bytes)
      if (file.size > 4 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds 4MB limit`);
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setUploadError(`File "${file.name}" is not an image`);
        return;
      }
    }

    // Add new files to existing ones
    setImageFiles((prevFiles) => [...prevFiles, ...files]);

    // Create previews for new files
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(place as Place_, imageFiles);
      onClose();
    } catch (error) {
      console.error('Error submitting place:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 border-green-300 text-green-700';
      case 'hidden':
        return 'bg-gray-50 border-gray-300 text-gray-600';
      case 'pending':
        return 'bg-amber-50 border-amber-300 text-amber-700';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-600';
    }
  };

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
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={place.name}
              onChange={(e) => setPlace({ ...place, name: e.target.value })}
              required
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
                onChange={(e) => setPlace({ ...place, geo: { ...place.geo!, lat: parseFloat(e.target.value) || 0 } })}
                required
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
                onChange={(e) => setPlace({ ...place, geo: { ...place.geo!, lng: parseFloat(e.target.value) || 0 } })}
                required
                disabled={loading}
                placeholder="67.0011"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={place.address || ''}
              onChange={(e) => setPlace({ ...place, address: e.target.value })}
              disabled={loading}
              placeholder="Street address (optional)"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              rows={3}
              value={place.description || ''}
              onChange={(e) => setPlace({ ...place, description: e.target.value })}
              disabled={loading}
              placeholder="Brief description of the place (optional)"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Category
            </label>
            <select
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={place.categories?.[0] || ''}
              onChange={handleCategoryChange}
              disabled={loading}
            >
              <option value="">Select a category</option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Section - Different fields based on type */}
          {place.type === 'checkin_time' ? (
            /* Time & Location: Type | Min Time | Radius */
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={place.type}
                  onChange={(e) => setPlace({ ...place, type: e.target.value as Place_['type'], requirements: {} })}
                  disabled={loading}
                >
                  <option value="checkin_time">Time & Location</option>
                  <option value="qr_scan">QR Scan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Min Time <span className="text-blue-600 font-semibold">(sec)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={minTimeSeconds || ''}
                  onChange={(e) => handleMinTimeSecondsChange(parseInt(e.target.value) || 0)}
                  disabled={loading}
                  placeholder="100sec"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Radius <span className="text-blue-600 font-semibold">(meters)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={radiusMeters || ''}
                  onChange={(e) => handleRadiusMetersChange(parseInt(e.target.value) || 0)}
                  disabled={loading}
                  placeholder="100meter"
                />
              </div>
            </div>
          ) : (
            /* QR Scan: Type | QR Code Button */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={place.type}
                    onChange={(e) => {
                      setPlace({ ...place, type: e.target.value as Place_['type'], requirements: {} });
                      setQrData('');
                    }}
                    disabled={loading}
                  >
                    <option value="checkin_time">Time & Location</option>
                    <option value="qr_scan">QR Scan</option>
                  </select>
                </div>
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
              </div>

              {/* QR Code Display */}
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
          )}

          {/* Source & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Source *</label>
              <select
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={place.source}
                onChange={(e) => setPlace({ ...place, source: e.target.value as Place_['source'] })}
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
                onChange={(e) => setPlace({ ...place, status: e.target.value as Place_['status'] })}
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="hidden">Hidden</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Upload Place Images <span className="text-gray-400 font-normal">(Max 4 images, 4MB each)</span>
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

            {/* Image Previews Grid */}
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
            type="submit"
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
