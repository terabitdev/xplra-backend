'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setSelectedTriggerType, clearTriggerFilter } from '@/app/store/slices/filterSlice';
import { Filter, ChevronDown, X, Check } from 'lucide-react';

const TRIGGER_TYPES = [
  { value: 'experience', label: 'Experience', icon: '⭐' },
  { value: 'level', label: 'Level', icon: '📈' },
  { value: 'achievement', label: 'Achievement', icon: '🏅' },
  { value: 'quest', label: 'Quest', icon: '🎯' },
];

export default function AchievementsFilter() {
  const dispatch = useAppDispatch();
  const { selectedTriggerType } = useAppSelector((state) => state.filter);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTriggerSelect = (triggerType: string) => {
    if (selectedTriggerType === triggerType) {
      dispatch(setSelectedTriggerType(null));
    } else {
      dispatch(setSelectedTriggerType(triggerType));
    }
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    dispatch(clearTriggerFilter());
  };

  const selectedTriggerLabel = selectedTriggerType
    ? TRIGGER_TYPES.find((type) => type.value === selectedTriggerType)?.label
    : null;

  return (
    <div className="mb-6 flex items-center gap-3">
      {/* Filter Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
            selectedTriggerType
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">
            {selectedTriggerLabel || 'Filter by Trigger Type'}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
            {/* All Types Option */}
            <button
              onClick={() => {
                dispatch(setSelectedTriggerType(null));
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                !selectedTriggerType ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <span className="font-medium">All Trigger Types</span>
              {!selectedTriggerType && <Check className="w-4 h-4 text-blue-600" />}
            </button>

            <div className="border-t border-gray-100 my-2"></div>

            {/* Trigger Type Options */}
            {TRIGGER_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTriggerSelect(type.value)}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  selectedTriggerType === type.value
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{type.icon}</span>
                  <span>{type.label}</span>
                </div>
                {selectedTriggerType === type.value && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear Filter Button */}
      {selectedTriggerType && (
        <button
          onClick={handleClearFilters}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
        >
          <X className="w-4 h-4" />
          Clear Filter
        </button>
      )}
    </div>
  );
}
