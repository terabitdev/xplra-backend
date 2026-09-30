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
  onSubmit: (formData: FormData) => void;
  definition?: AchievementDefinition | null;
}

const ASSET_TYPES = ['IMAGE', 'LOTTIE'];
const CATEGORIES = ['EXPLORATION', 'SOCIAL', 'QUESTS', 'EVENTS', 'CONTRIBUTION', 'MILESTONE', 'SEASONAL', 'OTHER'];
const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const VISIBILITIES = ['DISCOVERABLE', 'HIDDEN', 'SECRET'];
// Stored value IS the display label (underscores render as spaces) — keep
// these in sync with whatever the dropdown shows, so the DB never ends up
// with a legacy name (e.g. "STREAK"/"MANUAL") that doesn't match what the
// admin actually picked.
const RULE_TYPES = ['COUNT', 'THRESHOLD', 'COMBINATION', 'SPECIFIC_ACTION'];
// Old records saved before this rename may still have the legacy values.
const LEGACY_RULE_TYPE_MAP: Record<string, string> = {
  STREAK: 'COMBINATION',
  MANUAL: 'SPECIFIC_ACTION',
};
const EVENT_TYPES = ['PLACE_VISITED', 'QUEST_COMPLETED', 'EVENT_ATTENDED', 'CONTRIBUTION_APPROVED'];
const THRESHOLD_EVENT_TYPES = ['LEVEL', 'XP'];
const THRESHOLD_EVENT_TYPE_LABELS: Record<string, string> = {
  LEVEL: 'Levels',
  XP: 'XP',
};
const MAX_ASSET_BYTES = 4 * 1024 * 1024;

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
  const [questCategories, setQuestCategories] = useState<CategoryOption[]>([]);
  const [places, setPlaces] = useState<CategoryOption[]>([]);
  const [quests, setQuests] = useState<CategoryOption[]>([]);
  const [events, setEvents] = useState<CategoryOption[]>([]);

  const [badgeFile, setBadgeFile] = useState<File | null>(null);
  const [badgePreview, setBadgePreview] = useState<string>('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [assetError, setAssetError] = useState<string | null>(null);

  useEffect(() => {
    if (initialDefinition) {
      setForm({
        ...initialDefinition,
        rule_type: LEGACY_RULE_TYPE_MAP[initialDefinition.rule_type] || initialDefinition.rule_type,
        rule_config: initialDefinition.rule_config || { event_type: '', target: 0 },
      });
      // Older records (from before this form uploaded real files) may have
      // plain text saved where a URL belongs — don't preview that as an image.
      const isUrl = (v: string) => v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/');
      const badgeUrl = initialDefinition.badge_asset_url || '';
      const thumbUrl = initialDefinition.thumbnail_url || '';
      setBadgePreview(isUrl(badgeUrl) ? badgeUrl : '');
      setThumbnailPreview(isUrl(thumbUrl) ? thumbUrl : '');
    } else {
      setForm(emptyForm);
      setBadgePreview('');
      setThumbnailPreview('');
    }
    setBadgeFile(null);
    setThumbnailFile(null);
    setAssetError(null);
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

  const specificActionEventType = form.rule_type === 'SPECIFIC_ACTION' ? form.rule_config?.event_type : undefined;

  useEffect(() => {
    if (specificActionEventType === 'PLACE_VISITED' && places.length === 0) {
      fetch('/api/places/list?limit=500&fresh=true')
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data.data) ? data.data : [];
          setPlaces(list.map((p: { placeId: string; name: string }) => ({ id: p.placeId, name: p.name })));
        })
        .catch(() => {});
    } else if (specificActionEventType === 'QUEST_COMPLETED' && quests.length === 0) {
      fetch('/api/quests/list?limit=500&fresh=true')
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data.data) ? data.data : [];
          setQuests(list.map((q: { id: string; title: string }) => ({ id: q.id, name: q.title })));
        })
        .catch(() => {});
    } else if (specificActionEventType === 'EVENT_ATTENDED' && events.length === 0) {
      fetch('/api/events/list?limit=500&fresh=true')
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data.data) ? data.data : [];
          setEvents(list.map((e: { eventId: string; title: string }) => ({ id: e.eventId, name: e.title })));
        })
        .catch(() => {});
    }
  }, [specificActionEventType, places.length, quests.length, events.length]);

  const questCategoryNeeded =
    (form.rule_type === 'COUNT' || form.rule_type === 'COMBINATION') &&
    (form.rule_config?.event_type === 'QUEST_COMPLETED' || form.rule_config?.event_type_2 === 'QUEST_COMPLETED');

  useEffect(() => {
    if (!questCategoryNeeded || questCategories.length > 0) return;
    fetch('/api/quest-categories/list?fresh=true')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data.data) ? data.data : [];
        setQuestCategories(list.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {});
  }, [questCategoryNeeded, questCategories.length]);

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

  const setRuleConfigField = (
    field:
      | 'event_type'
      | 'place_category'
      | 'quest_category'
      | 'target'
      | 'event_type_2'
      | 'place_category_2'
      | 'quest_category_2'
      | 'target_2'
      | 'target_id'
      | 'target_name',
    value: string | number
  ) => {
    setForm((prev) => ({
      ...prev,
      rule_config: { ...(prev.rule_config || { event_type: '', target: 0 }), [field]: value },
    }));
  };

  const handleRuleTypeChange = (value: string) => {
    setField('rule_type', value);
    const wasThreshold = form.rule_type === 'THRESHOLD';
    const isNowThreshold = value === 'THRESHOLD';
    if (isNowThreshold && !wasThreshold) {
      setRuleConfigField('event_type', 'LEVEL');
    } else if (!isNowThreshold && wasThreshold) {
      setRuleConfigField('event_type', EVENT_TYPES[0]);
    }
    if (value === 'COMBINATION' && !form.rule_config?.event_type_2) {
      setRuleConfigField('event_type_2', EVENT_TYPES[0]);
    }
    if (value === 'SPECIFIC_ACTION' && form.rule_config?.event_type === 'CONTRIBUTION_APPROVED') {
      setRuleConfigField('event_type', EVENT_TYPES[0]);
    }
  };

  const readAsset = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  const validateAssetFile = (file: File): string | null => {
    if (file.size > MAX_ASSET_BYTES) return `"${file.name}" exceeds the 4MB limit`;
    if (!file.type.startsWith('image/')) return `"${file.name}" is not an image`;
    return null;
  };

  const handleBadgeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const err = validateAssetFile(file);
    if (err) {
      setAssetError(err);
      return;
    }
    setAssetError(null);
    setBadgeFile(file);
    setBadgePreview(await readAsset(file));
  };

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const err = validateAssetFile(file);
    if (err) {
      setAssetError(err);
      return;
    }
    setAssetError(null);
    setThumbnailFile(file);
    setThumbnailPreview(await readAsset(file));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title?.trim()) errs.title = 'Title is required';
    if (!form.description?.trim()) errs.description = 'Description is required';
    if (form.rule_config?.event_type === 'PLACE_VISITED' && !form.rule_config?.target) {
      errs.target = 'Target count is required';
    }
    if (form.rule_type === 'COMBINATION' && form.rule_config?.event_type_2 === 'PLACE_VISITED' && !form.rule_config?.target_2) {
      errs.target_2 = 'Target count is required';
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
      const rc = payload.rule_config;
      if (rc) {
        payload.rule_config = {
          event_type: rc.event_type || '',
          target: rc.target || 0,
          ...(showPlaceCategory && rc.place_category ? { place_category: rc.place_category } : {}),
          ...(showQuestCategory && rc.quest_category ? { quest_category: rc.quest_category } : {}),
          ...(isSpecificAction && rc.target_id
            ? { target_id: rc.target_id, ...(rc.target_name ? { target_name: rc.target_name } : {}) }
            : {}),
          ...(isCombination
            ? {
                event_type_2: rc.event_type_2 || '',
                target_2: rc.target_2 || 0,
                ...(showPlaceCategory2 && rc.place_category_2 ? { place_category_2: rc.place_category_2 } : {}),
                ...(showQuestCategory2 && rc.quest_category_2 ? { quest_category_2: rc.quest_category_2 } : {}),
              }
            : {}),
        };
      }

      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));
      if (badgeFile) formData.append('badge_asset', badgeFile);
      if (thumbnailFile) formData.append('thumbnail_asset', thumbnailFile);

      await onSubmit(formData);
      onClose();
    } catch {
      // Error handled by parent (toast).
    } finally {
      setLoading(false);
    }
  };

  const isSecret = form.visibility === 'SECRET';
  const isThreshold = form.rule_type === 'THRESHOLD';
  const isCombination = form.rule_type === 'COMBINATION';
  const isSpecificAction = form.rule_type === 'SPECIFIC_ACTION';
  const isCount = form.rule_type === 'COUNT';
  const categoryApplicable = isCount || isCombination;
  const primaryEventType = form.rule_config?.event_type;
  const showPlaceCategory =
    categoryApplicable && (primaryEventType === 'PLACE_VISITED' || primaryEventType === 'CONTRIBUTION_APPROVED');
  const showQuestCategory = categoryApplicable && primaryEventType === 'QUEST_COMPLETED';
  const secondaryEventType = form.rule_config?.event_type_2;
  const showPlaceCategory2 =
    isCombination && (secondaryEventType === 'PLACE_VISITED' || secondaryEventType === 'CONTRIBUTION_APPROVED');
  const showQuestCategory2 = isCombination && secondaryEventType === 'QUEST_COMPLETED';
  const specificActionOptions: { list: CategoryOption[]; label: string } | null = !isSpecificAction
    ? null
    : form.rule_config?.event_type === 'PLACE_VISITED'
    ? { list: places, label: 'Place' }
    : form.rule_config?.event_type === 'QUEST_COMPLETED'
    ? { list: quests, label: 'Quest' }
    : form.rule_config?.event_type === 'EVENT_ATTENDED'
    ? { list: events, label: 'Event' }
    : null;

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
          {assetError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600 font-medium">{assetError}</p>
            </div>
          )}

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
            {!isSecret && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Badge Asset</label>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 shrink-0 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                      {badgePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={badgePreview} alt="Badge preview" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-gray-400">None</span>
                      )}
                    </div>
                    <label className="px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer transition-colors">
                      {badgePreview ? 'Replace' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleBadgeChange} disabled={loading} />
                    </label>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Thumbnail</label>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 shrink-0 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                      {thumbnailPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-gray-400">None</span>
                      )}
                    </div>
                    <label className="px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer transition-colors">
                      {thumbnailPreview ? 'Replace' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} disabled={loading} />
                    </label>
                  </div>
                </div>
              </div>
            )}
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
                  onChange={(e) => handleRuleTypeChange(e.target.value)}
                  disabled={loading}
                >
                  {RULE_TYPES.map((rt) => (
                    <option key={rt} value={rt}>{rt.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{isCombination ? 'Event Type (1st condition)' : 'Event Type'}</label>
                <select
                  className={inputClass}
                  value={form.rule_config?.event_type || ''}
                  onChange={(e) => {
                    setRuleConfigField('event_type', e.target.value);
                    if (isSpecificAction) {
                      setRuleConfigField('target_id', '');
                      setRuleConfigField('target_name', '');
                    }
                  }}
                  disabled={loading}
                >
                  {isThreshold
                    ? THRESHOLD_EVENT_TYPES.map((et) => (
                        <option key={et} value={et}>{THRESHOLD_EVENT_TYPE_LABELS[et] || et}</option>
                      ))
                    : EVENT_TYPES.filter((et) => !isSpecificAction || et !== 'CONTRIBUTION_APPROVED').map((et) => (
                        <option key={et} value={et}>{et}</option>
                      ))}
                </select>
              </div>
            </div>

            {showPlaceCategory && (
              <div>
                <label className={labelClass}>{isCombination ? 'Place Category (1st condition)' : 'Place Category'}</label>
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

            {showQuestCategory && (
              <div>
                <label className={labelClass}>{isCombination ? 'Quest Category (1st condition)' : 'Quest Category'}</label>
                <select
                  className={inputClass}
                  value={form.rule_config?.quest_category || ''}
                  onChange={(e) => setRuleConfigField('quest_category', e.target.value)}
                  disabled={loading}
                >
                  <option value="">Any category</option>
                  {questCategories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {specificActionOptions && (
              <div>
                <label className={labelClass}>{specificActionOptions.label}</label>
                <select
                  className={inputClass}
                  value={form.rule_config?.target_id || ''}
                  onChange={(e) => {
                    const selected = specificActionOptions.list.find((item) => item.id === e.target.value);
                    setRuleConfigField('target_id', e.target.value);
                    setRuleConfigField('target_name', selected?.name || '');
                  }}
                  disabled={loading}
                >
                  <option value="">Select a {specificActionOptions.label.toLowerCase()}</option>
                  {specificActionOptions.list.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
            )}

            {isCombination && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Event Type (2nd condition)</label>
                  <select
                    className={inputClass}
                    value={form.rule_config?.event_type_2 || ''}
                    onChange={(e) => setRuleConfigField('event_type_2', e.target.value)}
                    disabled={loading}
                  >
                    {EVENT_TYPES.map((et) => (
                      <option key={et} value={et}>{et}</option>
                    ))}
                  </select>
                </div>
                {showPlaceCategory2 && (
                  <div>
                    <label className={labelClass}>Place Category (2nd condition)</label>
                    <select
                      className={inputClass}
                      value={form.rule_config?.place_category_2 || ''}
                      onChange={(e) => setRuleConfigField('place_category_2', e.target.value)}
                      disabled={loading}
                    >
                      <option value="">Any category</option>
                      {placeCategories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {showQuestCategory2 && (
                  <div>
                    <label className={labelClass}>Quest Category (2nd condition)</label>
                    <select
                      className={inputClass}
                      value={form.rule_config?.quest_category_2 || ''}
                      onChange={(e) => setRuleConfigField('quest_category_2', e.target.value)}
                      disabled={loading}
                    >
                      <option value="">Any category</option>
                      {questCategories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className={isCombination ? 'grid grid-cols-2 gap-3' : undefined}>
              <div>
                <label className={labelClass}>{isCombination ? 'Target Count (1st condition) *' : 'Target Count *'}</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.rule_config?.target ?? 0}
                  onChange={(e) => setRuleConfigField('target', Number(e.target.value))}
                  disabled={loading}
                />
                {errors.target && <p className="text-xs text-red-500 mt-1">{errors.target}</p>}
              </div>

              {isCombination && (
                <div>
                  <label className={labelClass}>Target Count (2nd condition) *</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={form.rule_config?.target_2 ?? 0}
                    onChange={(e) => setRuleConfigField('target_2', Number(e.target.value))}
                    disabled={loading}
                  />
                  {errors.target_2 && <p className="text-xs text-red-500 mt-1">{errors.target_2}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Rewards */}
          <div className={sectionClass}>
            <p className={sectionTitle}>Rewards</p>
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
