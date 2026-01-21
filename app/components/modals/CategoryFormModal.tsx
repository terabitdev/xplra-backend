'use client';

import { useState, useEffect, useRef } from 'react';
import { Category } from '@/lib/domain/models/category';
import { Close } from '@carbon/icons-react';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: Partial<Category>) => Promise<void>;
  category?: Category | null;
  adminId: string;
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  category: initialCategory,
  adminId,
}: CategoryFormModalProps) {
  const [category, setCategory] = useState<Partial<Category>>({
    name: '',
    userId: adminId,
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Blur any currently focused element (like search bar)
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      // Small delay to ensure modal is rendered, then focus input
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    } else {
      // Reset form for new category
      setCategory({
        name: '',
        userId: adminId,
      });
    }
  }, [initialCategory, adminId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(category);
      onClose();
    } catch (error) {
      console.error('Error submitting category:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      onInput={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900 flex-1 min-w-0 pr-4">
            {initialCategory ? 'Edit Category' : 'Create New Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            disabled={loading}
          >
            <Close size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="category-name-input" className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              ref={inputRef}
              type="text"
              id="category-name-input"
              name="category-name-field"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={category.name}
              onChange={(e) => {
                e.stopPropagation();
                setCategory({ ...category, name: e.target.value });
              }}
              onKeyDown={(e) => e.stopPropagation()}
              required
              disabled={loading}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              data-lpignore="true"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 bg-white pb-2">
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
                initialCategory ? 'Update Category' : 'Create Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
