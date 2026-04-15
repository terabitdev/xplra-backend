'use client';

import { useState, useEffect } from 'react';
import { Close } from '@carbon/icons-react';
import { QuestCategory } from '@/lib/domain/models/questCategory';

interface QuestCategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: Partial<QuestCategory>) => void;
  category?: QuestCategory | null;
}

export default function QuestCategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  category: initialCategory,
}: QuestCategoryFormModalProps) {
  const [form, setForm] = useState<Partial<QuestCategory>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formErrorMsg, setFormErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setForm({ ...initialCategory });
    } else {
      setForm({
        name: '',
        priority: undefined,
        isActive: false,
      });
    }
    setErrors({});
    setFormErrorMsg(null);
  }, [initialCategory, isOpen]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.name?.trim()) {
      errs.name = 'Required';
    }
    if (form.priority === undefined || form.priority === null || Number.isNaN(form.priority)) {
      errs.priority = 'Required';
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
      await onSubmit({
        name: form.name?.trim(),
        priority: form.priority,
        isActive: form.isActive ?? false,
      });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const setField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (formErrorMsg) setFormErrorMsg(null);
  };

  if (!isOpen) return null;

  const inputClass =
    'w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialCategory ? 'Edit Quest Category' : 'New Quest Category'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            disabled={loading}
          >
            <Close size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {formErrorMsg && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600 font-medium">{formErrorMsg}</p>
            </div>
          )}

          <div>
            <label className={labelClass}>Name *</label>
            <input
              type="text"
              className={`${inputClass} ${errors.name ? 'border-red-400' : ''}`}
              value={form.name || ''}
              onChange={(e) => setField('name', e.target.value)}
              disabled={loading}
              placeholder="e.g. Adventure"
            />
          </div>

          <div>
            <label className={labelClass}>Priority *</label>
            <input
              type="number"
              className={`${inputClass} ${errors.priority ? 'border-red-400' : ''}`}
              value={form.priority ?? ''}
              onChange={(e) =>
                setField('priority', e.target.value === '' ? undefined : parseInt(e.target.value))
              }
              disabled={loading}
              placeholder="e.g. 1"
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers are shown first in the app.</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive ?? false}
              onChange={(e) => setField('isActive', e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
              disabled={loading}
            />
            Active (visible in the app)
          </label>
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
            {loading ? 'Saving...' : initialCategory ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
