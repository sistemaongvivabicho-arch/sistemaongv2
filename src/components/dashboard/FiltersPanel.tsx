import React from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import {
  Filter,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  X
} from 'lucide-react';
import {
  ORIGIN_LABELS,
  EntryOrigin,
  SPECIES_LABELS,
  SpeciesType,
  SEX_LABELS,
  SexType,
  LOCATION_LABELS,
  ALL_LOCATIONS,
  AnimalStatus
} from '../../types/animal';
import {
  DashboardFilters,
  DEFAULT_DASHBOARD_FILTERS,
  MONTH_NAMES
} from '../../types/dashboard';
import { availableYears } from './dashboardUtils';

interface FiltersPanelProps {
  open: boolean;
  onToggle: () => void;
}

const STATUS_OPTIONS: { value: AnimalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos os status' },
  { value: 'no_abrigo', label: 'No abrigo' },
  { value: 'adotado', label: 'Adotado' },
  { value: 'obito', label: 'Óbito' }
];

const selectClass =
  'w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500';

const labelClass =
  'block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1';

export const FiltersPanel: React.FC<FiltersPanelProps> = ({ open, onToggle }) => {
  const { animals, dashboardFilters: f, setDashboardFilters } = useAnimalContext();

  const years = availableYears(animals);

  const set = (patch: Partial<DashboardFilters>) => {
    setDashboardFilters({ ...f, ...patch });
  };

  const clearAll = () => {
    setDashboardFilters({ ...DEFAULT_DASHBOARD_FILTERS, query: f.query });
  };

  const activeCount = [
    f.month != null,
    f.year != null,
    f.origin !== 'all',
    f.location !== 'all',
    f.status !== 'all',
    f.species !== 'all',
    f.sex !== 'all',
    f.castrado !== 'all'
  ].filter(Boolean).length;

  if (!open) {
    return (
      <div className="shrink-0 hidden lg:flex">
        <button
          onClick={onToggle}
          title="Abrir painel de filtros"
          className="flex flex-col items-center gap-3 w-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm py-4 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500 transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span
            className="text-[10px] font-bold tracking-widest"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            FILTROS
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="shrink-0 w-full lg:w-72">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Filtros
            {activeCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggle}
              title="Recolher painel"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                title="Limpar filtros"
                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Period */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Mês</label>
            <select
              value={f.month ?? 'all'}
              onChange={(e) => {
                const val = e.target.value;
                set({ month: val === 'all' ? null : parseInt(val, 10) });
              }}
              className={selectClass}
            >
              <option value="all">Todos os meses</option>
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Ano</label>
            <select
              value={f.year ?? 'all'}
              onChange={(e) => {
                const val = e.target.value;
                set({ year: val === 'all' ? null : parseInt(val, 10) });
              }}
              className={selectClass}
            >
              <option value="all">Todos os anos</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Origin */}
        <div>
          <label className={labelClass}>Origem do Resgate</label>
          <select
            value={f.origin}
            onChange={(e) => set({ origin: e.target.value })}
            className={selectClass}
          >
            <option value="all">Todas as origens</option>
            {(Object.keys(ORIGIN_LABELS) as EntryOrigin[]).map((key) => (
              <option key={key} value={key}>
                {ORIGIN_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        {/* Current location */}
        <div>
          <label className={labelClass}>Localização Atual</label>
          <select
            value={f.location}
            onChange={(e) => set({ location: e.target.value })}
            className={selectClass}
          >
            <option value="all">Todas as localizações</option>
            {ALL_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {LOCATION_LABELS[loc].label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={f.status}
            onChange={(e) => set({ status: e.target.value })}
            className={selectClass}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Species */}
        <div>
          <label className={labelClass}>Espécie</label>
          <select
            value={f.species}
            onChange={(e) => set({ species: e.target.value })}
            className={selectClass}
          >
            <option value="all">Todas as espécies</option>
            {(Object.keys(SPECIES_LABELS) as SpeciesType[]).map((key) => (
              <option key={key} value={key}>
                {SPECIES_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        {/* Sex */}
        <div>
          <label className={labelClass}>Sexo</label>
          <select
            value={f.sex}
            onChange={(e) => set({ sex: e.target.value })}
            className={selectClass}
          >
            <option value="all">Todos os sexos</option>
            {(Object.keys(SEX_LABELS) as SexType[]).map((key) => (
              <option key={key} value={key}>
                {SEX_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        {/* Castrated */}
        <div>
          <label className={labelClass}>Castrado</label>
          <select
            value={f.castrado}
            onChange={(e) => set({ castrado: e.target.value })}
            className={selectClass}
          >
            <option value="all">Todos</option>
            <option value="sim">Castrado</option>
            <option value="nao">Não castrado</option>
          </select>
        </div>

        {/* Clear */}
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar todos os filtros
          </button>
        )}
      </div>
    </div>
  );
};
