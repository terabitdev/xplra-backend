'use client';

import { useState, useEffect } from 'react';
import { StoreItem } from '@/lib/domain/models/storeItem';
import { Close } from '@carbon/icons-react';
import Image from 'next/image';

interface StoreFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Partial<StoreItem>, imageFile: File | null) => Promise<void>;
  item?: StoreItem | null;
  adminId: string;
}

export default function StoreFormModal({
  isOpen,
  onClose,
  onSubmit,
  item: initialItem,
  adminId,
}: StoreFormModalProps) {
  const [item, setItem] = useState<Partial<StoreItem>>({
    title: '',
    xpCost: 0,
    imageUrl: '',
    isAvailable: true,
    inventoryCount: undefined,
    userId: adminId,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialItem) {
      setItem(initialItem);
      setImagePreview(initialItem.imageUrl || null);
    } else {
      // Reset form for new item
      setItem({
        title: '',
        xpCost: 0,
        imageUrl: '',
        isAvailable: true,
        inventoryCount: undefined,
        userId: adminId,
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [initialItem, adminId, isOpen]);

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
      await onSubmit(item, imageFile);
      onClose();
    } catch (error) {
      console.error('Error submitting item:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] scrollbar-hide overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 text-black px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {initialItem ? 'Edit Store Item' : 'Create New Store Item'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <Close size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Item Title *
            </label>
            <input
              type="text"
              value={item.title || ''}
              onChange={(e) => setItem({ ...item, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter item title"
              required
            />
          </div>

          {/* XP Cost */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              XP Cost *
            </label>
            <input
              type="number"
              value={item.xpCost || 0}
              onChange={(e) => setItem({ ...item, xpCost: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter XP cost"
              min="0"
              required
            />
          </div>

          {/* Inventory Count (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Inventory Count <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              value={item.inventoryCount ?? ''}
              onChange={(e) => setItem({ ...item, inventoryCount: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Leave empty for unlimited"
              min="0"
            />
          </div>

          {/* Image Upload */}
          <div>
            {imagePreview && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Image:</label>
                <Image
                  src={imagePreview}
                  alt="Item Preview"
                  width={200}
                  height={200}
                  className="object-cover rounded-lg border-2 border-gray-200"
                />
              </div>
            )}
            <label htmlFor="image" className="block text-sm font-semibold text-gray-700 mb-2">
              {imagePreview ? 'Change Image' : 'Upload Image *'}
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required={!initialItem}
            />
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isAvailable"
              checked={item.isAvailable ?? true}
              onChange={(e) => setItem({ ...item, isAvailable: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isAvailable" className="text-sm font-semibold text-gray-700 cursor-pointer">
              Item is available for purchase
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </span>
              ) : initialItem ? (
                'Update Item'
              ) : (
                'Create Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
