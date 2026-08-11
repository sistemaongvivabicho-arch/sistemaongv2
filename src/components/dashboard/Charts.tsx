import React, { useMemo } from 'react';
import { BarChart3, MapPinned, PieChart } from 'lucide-react';
import { Animal, LOCATION_LABELS, SPECIES_LABELS, SpeciesType } from '../../types/animal';
import { MONTH_NAMES_SHORT } from '../../types/dashboard';
import { parseBRDate, countByLocation, countBySpecies } from './dashboardUtils';

// ============================================================================
// Gráfico de barras — Movimentações mensais (entradas, adoções, óbitos)
// ============================================================================

export const MovementsBarChart: React.FC<{ animals: Animal[]; year: number | null }> = ({
  animals,
  year
}) => {
  const movements = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      entries: 0,
      adoptions: 0,
      deaths: 0
    }));
    animals.forEach((a) => {
      const ed = parseBRDate(a.entryDate);
      if (ed && (year == null || ed.getFullYear() === year)) arr[ed.getMonth()].entries++;
      if (a.adoptionDetails) {
        const ad = parseBRDate(a.adoptionDetails.adoptionDate);
        if (ad && (year == null || ad.getFullYear() === year)) arr[ad.getMonth()].adoptions++;
      }
      if (a.deathDetails) {
        const dd = parseBRDate(a.deathDetails.deathDate);
        if (dd && (year == null || dd.getFullYear() === year)) arr[dd.getMonth()].deaths++;
      }
    });
    return arr;
  }, [animals, year]);

  const max = Math.max(1, ...movements.map((m) => Math.max(m.entries, m.adoptions, m.deaths)));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Movimentações por mês
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {year ? `Período de referência: ${year}` : 'Todos os anos'}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" />Entradas</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rose-500" />Adoções</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-500" />Óbitos</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex items-end gap-1 min-w-[560px] h-40 px-1 border-b border-slate-100 dark:border-slate-800">
          {movements.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="flex items-end justify-center gap-[3px] w-full h-32">
                <div
                  className="w-2.5 rounded-t bg-emerald-500 transition-all"
                  style={{ height: `${(m.entries / max) * 100}%` }}
                  title={`${m.entries} entrada(s)`}
                />
                <div
                  className="w-2.5 rounded-t bg-rose-500 transition-all"
                  style={{ height: `${(m.adoptions / max) * 100}%` }}
                  title={`${m.adoptions} adoção(ões)`}
                />
                <div
                  className="w-2.5 rounded-t bg-slate-400 dark:bg-slate-600 transition-all"
                  style={{ height: `${(m.deaths / max) * 100}%` }}
                  title={`${m.deaths} óbito(s)`}
                />
              </div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                {MONTH_NAMES_SHORT[m.month - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Gráfico de barras horizontais — distribuição por localização
// ============================================================================

export const LocationBarChart: React.FC<{ animals: Animal[] }> = ({ animals }) => {
  const data = useMemo(() => countByLocation(animals), [animals]);
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MapPinned className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Animais por localização
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Distribuição atual do conjunto filtrado
        </p>
      </div>

      {data.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-4 text-center">
          Nenhum animal no conjunto filtrado.
        </p>
      ) : (
        <div className="space-y-2.5">
          {data.map((entry) => {
            const loc = LOCATION_LABELS[entry.loc];
            return (
              <div key={entry.loc}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{loc.label}</span>
                  <span className="font-black text-slate-900 dark:text-white">{entry.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                    style={{ width: `${(entry.count / max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Gráfico de rosca (donut) — distribuição por espécie
// ============================================================================

const SPECIES_COLORS: Record<SpeciesType, string> = {
  cachorro: '#10b981',
  gato: '#6366f1',
  outro: '#f59e0b'
};

export const SpeciesDonutChart: React.FC<{ animals: Animal[] }> = ({ animals }) => {
  const data = useMemo(() => countBySpecies(animals), [animals]);
  const total = data.reduce((acc, d) => acc + d.count, 0);

  let gradient = 'conic-gradient(#e2e8f0 0 100%)';
  if (total > 0) {
    let acc = 0;
    const stops = data.map((d) => {
      const start = (acc / total) * 100;
      acc += d.count;
      const end = (acc / total) * 100;
      return `${SPECIES_COLORS[d.species]} ${start}% ${end}%`;
    });
    gradient = `conic-gradient(${stops.join(', ')})`;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Animais por espécie
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Composição do conjunto filtrado
        </p>
      </div>

      {total === 0 ? (
        <p className="text-xs text-slate-400 italic py-4 text-center">
          Nenhum animal no conjunto filtrado.
        </p>
      ) : (
        <div className="flex items-center gap-5">
          <div
            className="relative w-28 h-28 rounded-full shrink-0"
            style={{ background: gradient }}
          >
            <div className="absolute inset-3 rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-slate-900 dark:text-white">{total}</span>
              <span className="text-xs font-bold text-slate-400 uppercase">animais</span>
            </div>
          </div>
          <div className="space-y-2 flex-1">
            {data.map((d) => (
              <div key={d.species} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: SPECIES_COLORS[d.species] }} />
                  {SPECIES_LABELS[d.species]}
                </span>
                <span className="font-black text-slate-900 dark:text-white">
                  {d.count}
                  <span className="text-xs font-semibold text-slate-400 ml-1">
                    ({Math.round((d.count / total) * 100)}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
