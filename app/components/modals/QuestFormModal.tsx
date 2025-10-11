'use client';

import { useState, useEffect } from 'react';
import { Quest } from '@/lib/domain/models/quest';
import { Category } from '@/lib/domain/models/category';
import { Close } from '@carbon/icons-react';
import Image from 'next/image';

interface QuestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quest: Partial<Quest>, imageFile: File | null) => Promise<void>;
  quest?: Quest | null;
  categories: Category[];
  adminId: string;
}

export default function QuestFormModal({
  isOpen,
  onClose,
  onSubmit,
  quest: initialQuest,
  categories,
  adminId,
}: QuestFormModalProps) {
  const [quest, setQuest] = useState<Partial<Quest>>({
    title: '',
    shortDescription: '',
    longDescription: '',
    experience: 0,
    imageUrl: '',
    stepCode: '',
    stepLatitude: 0,
    stepLongitude: 0,
    stepType: 'qr',
    timeInSeconds: 0,
    userId: adminId,
    distance: 0,
    category: '',
    hoursToCompleteAgain: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialQuest) {
      setQuest(initialQuest);
      setImagePreview(initialQuest.imageUrl || null);
    } else {
      // Reset form for new quest
      setQuest({
        title: '',
        shortDescription: '',
        longDescription: '',
        experience: 0,
        imageUrl: '',
        stepCode: '',
        stepLatitude: 0,
        stepLongitude: 0,
        stepType: 'qr',
        timeInSeconds: 0,
        userId: adminId,
        distance: 0,
        category: '',
        hoursToCompleteAgain: 0,
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [initialQuest, adminId, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);

    if (file) {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setImagePreview(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(quest, imageFile);
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col my-auto">
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
              value={quest.title}
              onChange={(e) => setQuest({ ...quest, title: e.target.value })}
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
              value={quest.shortDescription}
              onChange={(e) => setQuest({ ...quest, shortDescription: e.target.value })}
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
              value={quest.longDescription}
              onChange={(e) => setQuest({ ...quest, longDescription: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Category and Experience Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm  font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                className="w-full px-4 py-2 border border-gray-300  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={quest.category || ''}
                onChange={(e) => setQuest({ ...quest, category: e.target.value })}
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
                value={quest.experience}
                onChange={(e) => setQuest({ ...quest, experience: parseInt(e.target.value) })}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Hours to Complete and Distance Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="hoursToCompleteAgain" className="block text-sm font-medium text-gray-700 mb-2">
                Hours to Complete Again *
              </label>
              <input
                type="number"
                id="hoursToCompleteAgain"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={quest.hoursToCompleteAgain}
                onChange={(e) => setQuest({ ...quest, hoursToCompleteAgain: parseInt(e.target.value) })}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-2">
                Distance (meters) *
              </label>
              <input
                type="number"
                id="distance"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={(quest.distance as number) || 0}
                onChange={(e) => setQuest({ ...quest, distance: parseInt(e.target.value) })}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Step Code */}
          <div>
            <label htmlFor="stepCode" className="block text-sm font-medium text-gray-700 mb-2">
              Step Code *
            </label>
            <input
              type="text"
              id="stepCode"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={quest.stepCode}
              onChange={(e) => setQuest({ ...quest, stepCode: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Latitude and Longitude Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="stepLatitude" className="block text-sm font-medium text-gray-700 mb-2">
                Step Latitude *
              </label>
              <input
                type="text"
                id="stepLatitude"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={quest.stepLatitude as number}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^-?\d*\.?\d*$/.test(value) || value === '-') {
                    setQuest({ ...quest, stepLatitude: value as any });
                  }
                }}
                onBlur={() => {
                  if (
                    quest.stepLatitude === '-' ||
                    quest.stepLatitude === '' ||
                    isNaN(Number(quest.stepLatitude))
                  ) {
                    setQuest({ ...quest, stepLatitude: 0 });
                  } else {
                    setQuest({ ...quest, stepLatitude: parseFloat(quest.stepLatitude as string) });
                  }
                }}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="stepLongitude" className="block text-sm font-medium text-gray-700 mb-2">
                Step Longitude *
              </label>
              <input
                type="text"
                id="stepLongitude"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={quest.stepLongitude as number}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^-?\d*\.?\d*$/.test(value) || value === '-') {
                    setQuest({ ...quest, stepLongitude: value as any });
                  }
                }}
                onBlur={() => {
                  if (
                    quest.stepLongitude === '-' ||
                    quest.stepLongitude === '' ||
                    isNaN(Number(quest.stepLongitude))
                  ) {
                    setQuest({ ...quest, stepLongitude: 0 });
                  } else {
                    setQuest({ ...quest, stepLongitude: parseFloat(quest.stepLongitude as string) });
                  }
                }}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Step Type and Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="stepType" className="block text-sm font-medium text-gray-700 mb-2">
                Step Type *
              </label>
              <select
                id="stepType"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={quest.stepType}
                onChange={(e) => setQuest({ ...quest, stepType: e.target.value })}
                disabled={loading}
              >
                <option value="qr">QR</option>
                <option value="location">Location</option>
                <option value="timeLocation">Time & Location</option>
              </select>
            </div>

            <div>
              <label htmlFor="timeInSeconds" className="block text-sm font-medium text-gray-700 mb-2">
                Time In Seconds *
              </label>
              <input
                type="number"
                id="timeInSeconds"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={quest.timeInSeconds}
                onChange={(e) => setQuest({ ...quest, timeInSeconds: parseInt(e.target.value) })}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            {imagePreview && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Image:</label>
                <Image
                  src={imagePreview}
                  alt="Quest Preview"
                  width={200}
                  height={200}
                  className="object-cover rounded-lg border-2 border-gray-200"
                />
              </div>
            )}
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              {imagePreview ? 'Change Image' : 'Upload Image'}
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
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200  bg-white pb-2 -mx-6 px-6">
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