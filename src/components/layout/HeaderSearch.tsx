import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { Search, XCircle, CornerDownLeft, PawPrint } from 'lucide-react';
import { LOCATION_LABELS, SPECIES_LABELS, Animal } from '../../types/animal';
import { searchMatchesAnimal } from '../dashboard/dashboardUtils';

const MAX_RESULTS = 10;

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim() || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-emerald-200 dark:bg-emerald-800 text-slate-900 dark:text-white rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function getStatusLabel(status: string): string {
  if (status === 'adotado') return 'Adotado';
  if (status === 'obito') return 'Óbito';
  return 'No abrigo';
}

const STATUS_BADGES: Record<string, string> = {
  no_abrigo: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  adotado: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  obito: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
};

export const HeaderSearch: React.FC = () => {
  const { animals, navigateToAnimal } = useAnimalContext();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { allResults, totalMatches } = useMemo(() => {
    if (!query.trim()) return { allResults: [], totalMatches: 0 };
    const matched = animals.filter((a) => searchMatchesAnimal(a, query));
    return { allResults: matched.slice(0, MAX_RESULTS), totalMatches: matched.length };
  }, [query, animals]);

  const results = allResults;

  const showDropdown = focused && query.trim().length > 0;

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const handleSelect = useCallback((animal: Animal) => {
    navigateToAnimal(animal.id);
    setQuery('');
    setFocused(false);
    inputRef.current?.blur();
  }, [navigateToAnimal]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setFocused(false);
      inputRef.current?.blur();
    }
  }, [showDropdown, results, selectedIndex, handleSelect]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === '/' && !focused && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [focused]);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar: nome, microchip, tutor, raça, cor, espécie, status..."
          className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 shadow-sm font-medium transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Limpar busca"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
        {!query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 rounded">
              /
            </kbd>
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              Nenhum animal encontrado para "{query}".
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {results.map((a, idx) => {
                const loc = LOCATION_LABELS[a.currentLocation];
                return (
                  <button
                    key={a.id}
                    onClick={() => handleSelect(a)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                      idx === selectedIndex
                        ? 'bg-emerald-50 dark:bg-emerald-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <PawPrint className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {highlightMatch(a.name, query)}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {a.microchip && (
                          <span className="inline-flex items-center gap-0.5">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">MC:</span> {highlightMatch(a.microchip, query)}
                          </span>
                        )}
                        {a.originTutorName && (
                          <span className="inline-flex items-center gap-0.5">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Tutor:</span> {highlightMatch(a.originTutorName, query)}
                          </span>
                        )}
                        {a.raca && (
                          <span>{highlightMatch(a.raca, query)}</span>
                        )}
                        {a.cor && (
                          <span>{highlightMatch(a.cor, query)}</span>
                        )}
                        <span>{SPECIES_LABELS[a.species]}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right space-y-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${STATUS_BADGES[a.status] || STATUS_BADGES.no_abrigo}`}>
                        {getStatusLabel(a.status)}
                      </span>
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${loc.badge}`}>
                          {loc.label}
                        </span>
                      </div>
                    </div>
                    {idx === selectedIndex && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-400 flex items-center justify-between">
            <span>{totalMatches} resultado(s) encontrado(s)</span>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-bold">↑↓</kbd>
              <span>navegar</span>
              <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-bold">Enter</kbd>
              <span>abrir</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
