'use client';

import { useState, useEffect, useRef } from 'react';
import { Category } from '@/lib/domain/models/category';
import { Close } from '@carbon/icons-react';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: Partial<Category>, iconFile?: File) => Promise<void>;
  category?: Category | null;
  parentCategory?: Category | null;
  allCategories: Category[];
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  category: initialCategory,
  parentCategory,
  allCategories,
}: CategoryFormModalProps) {
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    interestName: '',
    icon: '',
    isActive: true,
    isVisibleInInterests: true,
    interestsOrder: 0,
    placeOrder: 0,
    parentId: null,
    level: 0,
    ancestorIds: [],
  });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Populate form for edit or reset for create
  useEffect(() => {
    if (initialCategory) {
      setFormData({
        name: initialCategory.name || '',
        interestName: initialCategory.interestName || '',
        icon: initialCategory.icon || '',
        isActive: initialCategory.isActive ?? true,
        isVisibleInInterests: initialCategory.isVisibleInInterests ?? true,
        interestsOrder: initialCategory.interestsOrder ?? 0,
        placeOrder: initialCategory.placeOrder ?? 0,
        parentId: initialCategory.parentId || null,
        level: initialCategory.level ?? 0,
        ancestorIds: initialCategory.ancestorIds || [],
      });
      setIconPreview(initialCategory.icon || '');
    } else {
      setFormData({
        name: '',
        interestName: '',
        icon: '',
        isActive: true,
        isVisibleInInterests: true,
        interestsOrder: 0,
        placeOrder: 0,
        parentId: parentCategory?.id || null,
        level: parentCategory ? (parentCategory.level || 0) + 1 : 0,
        ancestorIds: parentCategory
          ? [...(parentCategory.ancestorIds || []), parentCategory.id]
          : [],
      });
      setIconPreview('');
    }
    setIconFile(null);
  }, [initialCategory, parentCategory, isOpen]);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Icon file must be less than 2MB');
      return;
    }

    setIconFile(file);
    const reader = new FileReader();
    reader.onload = () => setIconPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const getParentBreadcrumb = (): string => {
    if (!formData.parentId) return 'Root Category';
    const parts: string[] = [];
    for (const ancestorId of formData.ancestorIds || []) {
      const ancestor = allCategories.find(c => c.id === ancestorId);
      if (ancestor) parts.push(ancestor.name);
    }
    return parts.join(' > ') || 'Root Category';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData, iconFile || undefined);
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {initialCategory ? 'Edit Category' : parentCategory ? 'Create New Sub Category' : 'Create New Category'}
            </h2>
            {formData.parentId && (
              <p className="text-sm text-gray-500 mt-1">
                Path: {getParentBreadcrumb()}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            disabled={loading}
          >
            <Close size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="category-name-input" className="block text-sm font-medium text-gray-700 mb-1.5">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              id="category-name-input"
              name="category-name-field"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={formData.name}
              onChange={(e) => {
                e.stopPropagation();
                setFormData(prev => ({ ...prev, name: e.target.value }));
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

          {/* Interest Name */}
          <div>
            <label htmlFor="interest-name-input" className="block text-sm font-medium text-gray-700 mb-1.5">
              Interest Name
            </label>
            <input
              type="text"
              id="interest-name-input"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={formData.interestName}
              onChange={(e) => {
                e.stopPropagation();
                setFormData(prev => ({ ...prev, interestName: e.target.value }));
              }}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Defaults to category name"
              disabled={loading}
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
            />
          </div>

          {/* Icon Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Icon (SVG/PNG/JPG, max 2MB)
            </label>
            <div className="flex items-center gap-4">
              {iconPreview && (
                <div className="flex-shrink-0 w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img src={iconPreview} alt="Icon preview" className="w-10 h-10 object-contain" />
                </div>
              )}
              <input
                type="file"
                accept=".svg,.png,.jpg,.jpeg,.webp"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                onChange={handleIconChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Toggles Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* isActive Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <label htmlFor="is-active-toggle" className="text-sm font-medium text-gray-700">
                Active
              </label>
              <button
                type="button"
                id="is-active-toggle"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isActive ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                disabled={loading}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    formData.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* isVisibleInInterests Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <label htmlFor="is-visible-toggle" className="text-sm font-medium text-gray-700">
                Visible in Interests
              </label>
              <button
                type="button"
                id="is-visible-toggle"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isVisibleInInterests ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, isVisibleInInterests: !prev.isVisibleInInterests }))}
                disabled={loading}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    formData.isVisibleInInterests ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Ordering Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="interests-order-input" className="block text-sm font-medium text-gray-700 mb-1.5">
                Interests Order
              </label>
              <input
                type="number"
                id="interests-order-input"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={formData.interestsOrder ?? 0}
                onChange={(e) => {
                  e.stopPropagation();
                  setFormData(prev => ({ ...prev, interestsOrder: parseInt(e.target.value) || 0 }));
                }}
                onKeyDown={(e) => e.stopPropagation()}
                min={0}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="place-order-input" className="block text-sm font-medium text-gray-700 mb-1.5">
                Place Order
              </label>
              <input
                type="number"
                id="place-order-input"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={formData.placeOrder ?? 0}
                onChange={(e) => {
                  e.stopPropagation();
                  setFormData(prev => ({ ...prev, placeOrder: parseInt(e.target.value) || 0 }));
                }}
                onKeyDown={(e) => e.stopPropagation()}
                min={0}
                disabled={loading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 bg-white pb-2">
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
