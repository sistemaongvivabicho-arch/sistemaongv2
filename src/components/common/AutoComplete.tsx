import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface AutoCompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  onBlur?: () => void;
}

export const AutoComplete: React.FC<AutoCompleteProps> = ({
  value,
  onChange,
  suggestions,
  placeholder = '',
  disabled = false,
  required = false,
  label,
  error,
  onBlur
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredSuggestions = useMemo(() => {
    if (!inputValue || inputValue.length < 1) return [];
    const term = inputValue.toLowerCase();
    return suggestions
      .filter((s) => s.toLowerCase().includes(term) && s.toLowerCase() !== term)
      .slice(0, 8);
  }, [inputValue, suggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [isOpen]);

  const handleSelect = useCallback((selected: string) => {
    setInputValue(selected);
    onChange(selected);
    setIsOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.blur();
  }, [onChange]);

  const handleClear = useCallback(() => {
    setInputValue('');
    onChange('');
    setIsOpen(false);
    setFocusedIndex(-1);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredSuggestions.length) {
          handleSelect(filteredSuggestions[focusedIndex]);
        } else {
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  }, [isOpen, focusedIndex, filteredSuggestions, handleSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
  }, []);

  const handleFocus = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsOpen(false);
      setFocusedIndex(-1);
      onBlur?.();
    }, 150);
  }, [onBlur]);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {label}{required && ' *'}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          className={`w-full py-2.5 pl-3 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
            error
              ? 'border-rose-300 dark:border-rose-700'
              : 'border-slate-200 dark:border-slate-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}

      {isOpen && filteredSuggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-h-48 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <li key={suggestion}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(suggestion);
                }}
                className={`w-full text-left px-3 py-2.5 text-base transition-colors ${
                  index === focusedIndex
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {highlightMatch(suggestion, inputValue)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-emerald-600 dark:text-emerald-400">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}
