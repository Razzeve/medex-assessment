'use client';

import { Search, X } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (search: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search services, providers, or categories (e.g. check-up, Bangkok)...',
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const [, startTransition] = useTransition();

  // Sync external changes (e.g. URL update or Reset Filters) to local input
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce user keystrokes by 300ms per engineering guidelines
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        startTransition(() => {
          onChange(localValue);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
        <Search className="h-4 w-4" aria-hidden="true" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search healthcare catalog"
        className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search input"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
