'use client';

import { useState, useEffect } from 'react';
import { Adventure } from '@/lib/domain/models/adventures';
import { Category } from '@/lib/domain/models/category';
import { Close } from '@carbon/icons-react';
import Image from 'next/image';

interface AdventureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (adventure: Partial<Adventure>, imageFile: File | null, multiImageFiles: File[]) => Promise<void>;
  adventure?: Adventure | null;
  categories: Category[];
  adminId: string;
}

export default function AdventureFormModal({
  isOpen,
  onClose,
  onSubmit,
  adventure: initialAdventure,
  categories,
  adminId,
}: AdventureFormModalProps) {
  const [adventure, setAdventure] = useState<Partial<Adventure>>({
    title: '',
    shortDescription: '',
    longDescription: '',
    imageUrl: '',
    latitude: 0,
    longitude: 0,
    distance: 30,
    experience: 0,
    featured: false,
    userId: adminId,
    featuredImages: [],
    timeInSeconds: 0,
    hoursToCompleteAgain: 0,
    category: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [multiImageFiles, setMultiImageFiles] = useState<File[]>([]);
  const [multiImagePreviews, setMultiImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialAdventure) {
      setAdventure(initialAdventure);
      setImagePreview(initialAdventure.imageUrl || null);
      setMultiImagePreviews(initialAdventure.featuredImages || []);
    } else {
      // Reset form for new adventure
      setAdventure({
        title: '',
        shortDescription: '',
        longDescription: '',
        imageUrl: '',
        latitude: 0,
        longitude: 0,
        distance: 30,
        experience: 0,
        featured: false,
        userId: adminId,
        featuredImages: [],
        timeInSeconds: 0,
        hoursToCompleteAgain: 0,
        category: '',
      });
      setImageFile(null);
      setImagePreview(null);
      setMultiImageFiles([]);
      setMultiImagePreviews([]);
    }
  }, [initialAdventure, adminId, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (adventure.featured) {
      const files = e.target.files ? Array.from(e.target.files) : [];
      setMultiImageFiles(prevFiles => [...prevFiles, ...files]);

      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setMultiImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    } else {
      const file = e.target.files ? e.target.files[0] : null;
      setImageFile(file);
      if (file) {
        const fileReader = new FileReader();
        fileReader.onload = () => setImagePreview(fileReader.result as string);
        fileReader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setMultiImageFiles(prev => prev.filter((_, i) => i !== index));
    setMultiImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(adventure, imageFile, multiImageFiles);
      onClose();
    } catch (error) {
      console.error('Error submitting adventure:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900 flex-1 min-w-0 pr-4">
            {initialAdventure ? 'Edit Adventure' : 'Create New Adventure'}
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
              value={adventure.title}
              onChange={(e) => setAdventure({ ...adventure, title: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Short Description */}
          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Short Description *
            </label>
            <input
              type="text"
              id="shortDescription"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={adventure.shortDescription}
              onChange={(e) => setAdventure({ ...adventure, shortDescription: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Long Description */}
          <div>
            <label htmlFor="longDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Long Description *
            </label>
            <textarea
              id="longDescription"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={adventure.longDescription}
              onChange={(e) => setAdventure({ ...adventure, longDescription: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Category and Experience Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={adventure.category || ''}
                onChange={(e) => setAdventure({ ...adventure, category: e.target.value })}
                required
                disabled={loading}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                Experience Points *
              </label>
              <input
                type="number"
                id="experience"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={adventure.experience}
                onChange={(e) => setAdventure({ ...adventure, experience: parseInt(e.target.value) })}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Distance, Hours to Complete, and Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-2">
                Distance (meters) *
              </label>
              <input
                type="number"
                id="distance"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={(adventure.distance as number) || 30}
                onChange={(e) => setAdventure({ ...adventure, distance: parseFloat(e.target.value) })}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="hoursToCompleteAgain" className="block text-sm font-medium text-gray-700 mb-2">
                Hours to Complete *
              </label>
              <input
                type="number"
                id="hoursToCompleteAgain"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={adventure.hoursToCompleteAgain || 0}
                onChange={(e) => setAdventure({ ...adventure, hoursToCompleteAgain: parseInt(e.target.value) })}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="timeInSeconds" className="block text-sm font-medium text-gray-700 mb-2">
                Time In Seconds *
              </label>
              <input
                type="number"
                id="timeInSeconds"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={adventure.timeInSeconds}
                onChange={(e) => setAdventure({ ...adventure, timeInSeconds: parseInt(e.target.value) })}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Latitude and Longitude Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                Latitude *
              </label>
              <input
                type="text"
                id="latitude"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={adventure.latitude as number}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^-?\d*\.?\d*$/.test(value) || value === '-') {
                    setAdventure({ ...adventure, latitude: value as any });
                  }
                }}
                onBlur={() => {
                  if (
                    adventure.latitude === '-' ||
                    adventure.latitude === '' ||
                    isNaN(Number(adventure.latitude))
                  ) {
                    setAdventure({ ...adventure, latitude: 0 });
                  } else {
                    setAdventure({ ...adventure, latitude: parseFloat(adventure.latitude as string) });
                  }
                }}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                Longitude *
              </label>
              <input
                type="text"
                id="longitude"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={adventure.longitude as number}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^-?\d*\.?\d*$/.test(value) || value === '-') {
                    setAdventure({ ...adventure, longitude: value as any });
                  }
                }}
                onBlur={() => {
                  if (
                    adventure.longitude === '-' ||
                    adventure.longitude === '' ||
                    isNaN(Number(adventure.longitude))
                  ) {
                    setAdventure({ ...adventure, longitude: 0 });
                  } else {
                    setAdventure({ ...adventure, longitude: parseFloat(adventure.longitude as string) });
                  }
                }}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Featured Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              checked={adventure.featured}
              onChange={(e) => setAdventure({ ...adventure, featured: e.target.checked })}
              disabled={loading}
            />
            <label className="ml-2 text-sm font-medium text-gray-700" htmlFor="featured">
              Featured Adventure
            </label>
          </div>

          {/* Image Upload */}
          <div>
            {adventure.featured ? (
              <>
                <label htmlFor="featuredImages" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Featured Images
                </label>
                <input
                  type="file"
                  id="featuredImages"
                  accept="image/*"
                  multiple
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={handleImageChange}
                  disabled={loading}
                  value=""
                />
                {multiImagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {multiImagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={preview}
                          alt={`Featured Image ${index + 1}`}
                          width={200}
                          height={200}
                          className="object-cover rounded-lg border-2 border-gray-200 w-full h-32"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                          disabled={loading}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {imagePreview && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Image:</label>
                    <Image
                      src={imagePreview}
                      alt="Adventure Preview"
                      width={200}
                      height={200}
                      className="object-cover rounded-lg border-2 border-gray-200"
                    />
                  </div>
                )}
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                  {imagePreview ? 'Change Main Image' : 'Upload Main Image'}
                </label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={handleImageChange}
                  disabled={loading}
                  value=""
                />
              </>
            )}
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
                initialAdventure ? 'Update Adventure' : 'Create Adventure'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
