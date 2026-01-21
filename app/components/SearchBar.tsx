"use client";

import { useState, useEffect } from "react";
import { Search, Close } from "@carbon/icons-react";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  value?: string;
}

export default function SearchBar({
  placeholder = "Search...",
  onSearch,
  className = "",
  value: externalValue
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(externalValue || "");
  const [isFocused, setIsFocused] = useState(false);

  // Sync local state with external value when it changes
  useEffect(() => {
    if (externalValue !== undefined) {
      setSearchQuery(externalValue);
    }
  }, [externalValue]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleClear = () => {
    setSearchQuery("");
    onSearch?.("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative ${className}`}
    >
      <div
        className={`flex items-center gap-2 px-4 py-2 bg-gray-50 border rounded-lg transition-all duration-200 ${
          isFocused
            ? "border-blue-500 bg-white shadow-sm"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <Search
          size={20}
          className={`transition-colors ${
            isFocused ? "text-blue-500" : "text-gray-400"
          }`}
        />

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <Close size={20} />
          </button>
        )}
      </div>
    </form>
  );
}
