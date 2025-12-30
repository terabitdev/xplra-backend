'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { Close, Menu } from '@carbon/icons-react';

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
  source: "seed" | "user_contribution";
  status: "active" | "hidden" | "pending";
}

interface PlaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (place: Place_) => void;
  place?: Place_ | null;
}

export default function PlaceFormModal({
  isOpen,
  onClose,
  onSubmit,
  place: initialPlace,
}: PlaceFormModalProps) {
  const dispatch = useDispatch();
  const [place, setPlace] = useState<Partial<Place_>>({
    placeId: '',
    name: '',
    geo: { lat: 0, lng: 0 },
    geohash: '',
    categories: [],
    address: '',
    source: 'seed',
    status: 'active',
  });
  const [categoryInput, setCategoryInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialPlace) {
      setPlace(initialPlace);
    } else {
      const newPlaceId = `place_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setPlace({
        placeId: newPlaceId,
        name: '',
        geo: { lat: 0, lng: 0 },
        geohash: '',
        categories: [],
        address: '',
        source: 'seed',
        status: 'active',
      });
    }
    setCategoryInput('');
  }, [initialPlace, isOpen]);

  const handleAddCategory = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const category = categoryInput.trim();
      if (category && !place.categories?.includes(category)) {
        setPlace({ ...place, categories: [...(place.categories || []), category] });
        setCategoryInput('');
      }
    }
  };

  const handleRemoveCategory = (index: number) => {
    const newCategories = place.categories?.filter((_, i) => i !== index) || [];
    setPlace({ ...place, categories: newCategories });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      onSubmit(place as Place_);
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
              {initialPlace ? 'Edit Place' : 'New Place'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded" disabled={loading}>
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

          {/* Geohash */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Geohash</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={place.geohash}
              onChange={(e) => setPlace({ ...place, geohash: e.target.value })}
              disabled={loading}
              placeholder="tt3q8c9"
            />
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

          {/* Categories */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Categories <span className="text-gray-400 font-normal">— Press Enter to add</span>
            </label>

            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              onKeyDown={handleAddCategory}
              disabled={loading}
              placeholder="Type category and press Enter"
            />

            {/* Category chips */}
            {place.categories && place.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {place.categories.map((cat, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs">
                    {cat}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(index)}
                      className="hover:text-indigo-900"
                      disabled={loading}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

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

          {/* Place ID */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Place ID</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono"
              value={place.placeId}
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
            disabled={loading}
          >
            {loading ? 'Saving...' : (initialPlace ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}
