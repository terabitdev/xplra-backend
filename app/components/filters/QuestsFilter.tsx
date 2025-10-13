'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setSelectedCategory, clearFilters } from '@/app/store/slices/filterSlice';
import { Category } from '@/lib/domain/models/category';
import { Filter, ChevronDown, X, Check } from 'lucide-react';

interface QuestsFilterProps {
  categories: Category[];
}

export default function QuestsFilter({ categories }: QuestsFilterProps) {
  const dispatch = useAppDispatch();
  const { selectedCategory } = useAppSelector((state) => state.filter);
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

  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      dispatch(setSelectedCategory(null));
    } else {
      dispatch(setSelectedCategory(categoryId));
    }
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const selectedCategoryName = selectedCategory
    ? categories.find((cat) => cat.id === selectedCategory)?.name
    : null;

  return (
    <div className="mb-6 flex items-center gap-3">
      {/* Filter Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
            selectedCategory
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">
            {selectedCategoryName || 'Filter by Category'}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
            {/* All Categories Option */}
            <button
              onClick={() => {
                dispatch(setSelectedCategory(null));
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                !selectedCategory ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <span className="font-medium">All Categories</span>
              {!selectedCategory && <Check className="w-4 h-4 text-blue-600" />}
            </button>

            <div className="border-t border-gray-100 my-2"></div>

            {/* Category Options */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  selectedCategory === category.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700'
                }`}
              >
                <span>{category.name}</span>
                {selectedCategory === category.id && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear Filter Button */}
      {selectedCategory && (
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
