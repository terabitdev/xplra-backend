'use client';

import { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, X, Check } from 'lucide-react';

interface EventsFilterProps {
  selectedVisibility: boolean | null;
  onVisibilityChange: (visibility: boolean | null) => void;
}

export default function EventsFilter({ selectedVisibility, onVisibilityChange }: EventsFilterProps) {
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

  const handleVisibilitySelect = (visibility: boolean | null) => {
    onVisibilityChange(visibility);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    onVisibilityChange(null);
  };

  const getFilterLabel = () => {
    if (selectedVisibility === null) return 'Filter by Visibility';
    return selectedVisibility ? 'Visible Events' : 'Hidden Events';
  };

  return (
    <div className="mb-6 flex items-center gap-3">
      {/* Filter Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
            selectedVisibility !== null
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">
            {getFilterLabel()}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            {/* All Events Option */}
            <button
              onClick={() => handleVisibilitySelect(null)}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                selectedVisibility === null ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <span className="font-medium">All Events</span>
              {selectedVisibility === null && <Check className="w-4 h-4 text-blue-600" />}
            </button>

            <div className="border-t border-gray-100 my-2"></div>

            {/* Visible Events Option */}
            <button
              onClick={() => handleVisibilitySelect(true)}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                selectedVisibility === true
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Visible Events</span>
              </div>
              {selectedVisibility === true && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>

            {/* Hidden Events Option */}
            <button
              onClick={() => handleVisibilitySelect(false)}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                selectedVisibility === false
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span>Hidden Events</span>
              </div>
              {selectedVisibility === false && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Clear Filter Button */}
      {selectedVisibility !== null && (
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
