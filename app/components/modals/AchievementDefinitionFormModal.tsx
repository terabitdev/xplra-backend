'use client';

import { useState, useEffect } from 'react';
import { Close } from '@carbon/icons-react';
import { AchievementDefinition, AchievementDefinitionInput } from '@/lib/domain/models/achievementDefinition';

interface CategoryOption {
  id: string;
  name: string;
}

interface AchievementDefinitionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<AchievementDefinitionInput>) => void;
  definition?: AchievementDefinition | null;
}

const ASSET_TYPES = ['IMAGE', 'LOTTIE'];
const CATEGORIES = ['EXPLORATION', 'SOCIAL', 'QUESTS', 'EVENTS', 'CONTRIBUTION', 'MILESTONE', 'SEASONAL', 'OTHER'];
const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const VISIBILITIES = ['DISCOVERABLE', 'HIDDEN', 'SECRET'];
const RULE_TYPES = ['COUNT', 'THRESHOLD', 'STREAK', 'MANUAL'];
const EVENT_TYPES = ['PLACE_VISITED', 'QUEST_COMPLETED', 'EVENT_ATTENDED', 'CONTRIBUTION_APPROVED'];

const emptyForm: Partial<AchievementDefinitionInput> = {
  title: '',
  description: '',
  unlock_hint: '',
  badge_asset_url: '',
  thumbnail_url: '',
  asset_type: 'IMAGE',
  category: 'EXPLORATION',
  rarity: 'COMMON',
  status: 'DRAFT',
  visibility: 'DISCOVERABLE',
  rule_type: 'COUNT',
  rule_config: { event_type: 'PLACE_VISITED', place_category: '', target: 1 },
  xp_reward: 0,
  retroactive_enabled: false,
  sort_order: 0,
};

export default function AchievementDefinitionFormModal({
  isOpen,
  onClose,
  onSubmit,
  definition: initialDefinition,
}: AchievementDefinitionFormModalProps) {
  const [form, setForm] = useState<Partial<AchievementDefinitionInput>>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placeCategories, setPlaceCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    if (initialDefinition) {
      setForm({
        ...initialDefinition,
        rule_config: initialDefinition.rule_config || { event_type: '', target: 0 },
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [initialDefinition, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/categories/list')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPlaceCategories(data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
        }
      })
      .catch(() => {
        // Non-fatal — place_category just falls back to free text.
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const inputClass =
    'w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
  const sectionClass = 'space-y-3 border-t border-gray-200 pt-3';
  const sectionTitle = 'text-sm font-semibold text-gray-800 mb-2';

  const setField = <K extends keyof AchievementDefinitionInput>(field: K, value: AchievementDefinitionInput[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const setRuleConfigField = (field: 'event_type' | 'place_category' | 'target', value: string | number) => {
    setForm((prev) => ({
      ...prev,
      rule_config: { ...(prev.rule_config || { event_type: '', target: 0 }), [field]: value },
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title?.trim()) errs.title = 'Title is required';
    if (!form.description?.trim()) errs.description = 'Description is required';
    if (form.rule_config?.event_type === 'PLACE_VISITED' && !form.rule_config?.target) {
      errs.target = 'Target count is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: Partial<AchievementDefinitionInput> = { ...form };
      if (payload.rule_config?.event_type !== 'PLACE_VISITED') {
        payload.rule_config = { event_type: payload.rule_config?.event_type || '', target: payload.rule_config?.target || 0 };
      }
      await onSubmit(payload);
      onClose();
    } catch {
      // Error handled by parent (toast).
    } finally {
      setLoading(false);
    }
  };

  const showPlaceCategory = form.rule_config?.event_type === 'PLACE_VISITED';

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialDefinition ? 'Edit Achievement' : 'New Achievement'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors" disabled={loading}>
            <Close size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Basic info */}
          <div>
            <label className={labelClass}>Title *</label>
            <input
              className={inputClass}
              value={form.title || ''}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Beach Explorer"
              disabled={loading}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className={labelClass}>Description *</label>
            <textarea
              className={inputClass}
              rows={2}
              value={form.description || ''}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Awarded for visiting five qualifying beaches."
              disabled={loading}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className={labelClass}>Unlock Hint</label>
            <input
              className={inputClass}
              value={form.unlock_hint || ''}
              onChange={(e) => setField('unlock_hint', e.target.value)}
              placeholder="Visit 5 beaches."
              disabled={loading}
            />
          </div>

          {/* Presentation */}
          <div className={sectionClass}>
            <p className={sectionTitle}>Presentation</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Badge Asset URL</label>
                <input
                  className={inputClass}
                  value={form.badge_asset_url || ''}
                  onChange={(e) => setField('badge_asset_url', e.target.value)}
                  placeholder="https://…"
                  disabled={loading}
                />
              </div>
              <div>
                <label className={labelClass}>Thumbnail URL</label>
                <input
                  className={inputClass}
                  value={form.thumbnail_url || ''}
                  onChange={(e) => setField('thumbnail_url', e.target.value)}
                  placeholder="https://…"
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Asset Type</label>
              <select
                className={inputClass}
                value={form.asset_type || 'IMAGE'}
                onChange={(e) => setField('asset_type', e.target.value)}
                disabled={loading}
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Classification */}
          <div className={sectionClass}>
            <p className={sectionTitle}>Classification</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Category</label>
                <select
                  className={inputClass}
                  value={form.category || 'EXPLORATION'}
                  onChange={(e) => setField('category', e.target.value)}
                  disabled={loading}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Rarity</label>
                <select
                  className={inputClass}
                  value={form.rarity || 'COMMON'}
                  onChange={(e) => setField('rarity', e.target.value)}
                  disabled={loading}
                >
                  {RARITIES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  className={inputClass}
                  value={form.status || 'DRAFT'}
                  onChange={(e) => setField('status', e.target.value)}
                  disabled={loading}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Visibility</label>
                <select
                  className={inputClass}
                  value={form.visibility || 'DISCOVERABLE'}
                  onChange={(e) => setField('visibility', e.target.value)}
                  disabled={loading}
                >
                  {VISIBILITIES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Sort Order</label>
              <input
                type="number"
                className={inputClass}
                value={form.sort_order ?? 0}
                onChange={(e) => setField('sort_order', Number(e.target.value))}
                disabled={loading}
              />
            </div>
          </div>

          {/* Unlock rule */}
          <div className={sectionClass}>
            <p className={sectionTitle}>Unlock Rule</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Rule Type</label>
                <select
                  className={inputClass}
                  value={form.rule_type || 'COUNT'}
                  onChange={(e) => setField('rule_type', e.target.value)}
                  disabled={loading}
                >
                  {RULE_TYPES.map((rt) => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Event Type</label>
                <select
                  className={inputClass}
                  value={form.rule_config?.event_type || ''}
                  onChange={(e) => setRuleConfigField('event_type', e.target.value)}
                  disabled={loading}
                >
                  {EVENT_TYPES.map((et) => (
                    <option key={et} value={et}>{et}</option>
                  ))}
                </select>
              </div>
            </div>

            {showPlaceCategory && (
              <div>
                <label className={labelClass}>Place Category</label>
                <select
                  className={inputClass}
                  value={form.rule_config?.place_category || ''}
                  onChange={(e) => setRuleConfigField('place_category', e.target.value)}
                  disabled={loading}
                >
                  <option value="">Any category</option>
                  {placeCategories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={labelClass}>Target Count *</label>
              <input
                type="number"
                className={inputClass}
                value={form.rule_config?.target ?? 0}
                onChange={(e) => setRuleConfigField('target', Number(e.target.value))}
                disabled={loading}
              />
              {errors.target && <p className="text-xs text-red-500 mt-1">{errors.target}</p>}
            </div>
          </div>

          {/* Rewards */}
          <div className={sectionClass}>
            <p className={sectionTitle}>Rewards</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>XP Reward</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.xp_reward ?? 0}
                  onChange={(e) => setField('xp_reward', Number(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  checked={form.retroactive_enabled ?? false}
                  onChange={(e) => setField('retroactive_enabled', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  disabled={loading}
                />
                <label className="text-xs text-gray-600">
                  Retroactively unlock for players who already qualify
                </label>
              </div>
            </div>
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
            {loading ? 'Saving...' : initialDefinition ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
