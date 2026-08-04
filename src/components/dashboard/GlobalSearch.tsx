import React, { useMemo, useState } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { Search, XCircle, CornerDownLeft, PawPrint } from 'lucide-react';
import { LOCATION_LABELS, SPECIES_LABELS } from '../../types/animal';
import { searchMatchesAnimal } from './dashboardUtils';

const MAX_RESULTS = 8;

export const GlobalSearch: React.FC = () => {
  const { animals, dashboardFilters, setDashboardFilters, navigateToAnimal } = useAnimalContext();
  const [focused, setFocused] = useState(false);

  const query = dashboardFilters.query;

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return animals
      .filter((a) => searchMatchesAnimal(a, query))
      .slice(0, MAX_RESULTS);
  }, [query, animals]);

  const hasMore = query.trim().length > 0 && animals.filter((a) => searchMatchesAnimal(a, query)).length > MAX_RESULTS;

  const showDropdown = focused && query.trim().length > 0;

  return (
    <div className="relative w-full max-w-xl">
      <Search className="w-4.5 h-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) =>
          setDashboardFilters({ ...dashboardFilters, query: e.target.value })
        }
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Busca global: nome, microchip, protocolo, origem, observações..."
        className="w-full pl-11 pr-9 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm font-medium transition-all"
      />
      {query && (
        <button
          onClick={() => setDashboardFilters({ ...dashboardFilters, query: '' })}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          title="Limpar busca"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute z-40 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              Nenhum animal encontrado para "{query}".
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((a) => {
                const loc = LOCATION_LABELS[a.currentLocation];
                return (
                  <button
                    key={a.id}
                    onMouseDown={() => {
                      navigateToAnimal(a.id);
                      setDashboardFilters({ ...dashboardFilters, query: '' });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <PawPrint className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {a.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {a.microchip
                          ? `Microchip: ${a.microchip}`
                          : a.originProtocol
                          ? `Protocolo: ${a.originProtocol}`
                          : `Sem microchip/protocolo`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${loc.badge}`}>
                        {loc.label}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {SPECIES_LABELS[a.species]} · {a.status === 'adotado' ? 'Adotado' : a.status === 'obito' ? 'Óbito' : 'No abrigo'}
                      </p>
                    </div>
                    <CornerDownLeft className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-400 flex items-center justify-between">
            <span>
              A busca filtra todos os indicadores do dashboard
            </span>
            {hasMore && <span className="font-bold">+ mais resultados</span>}
          </div>
        </div>
      )}
    </div>
  );
};
