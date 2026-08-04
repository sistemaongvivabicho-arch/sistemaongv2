import React from 'react';
import { CalendarRange, X } from 'lucide-react';
import { Animal } from '../../types/animal';
import { MONTH_NAMES } from '../../types/dashboard';
import { buildMonthlySummary } from './dashboardUtils';

interface MonthlySummaryProps {
  animals: Animal[];
  year: number | null;
  selectedMonth: number | null;
  onSelectMonth: (month: number | null) => void;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  animals,
  year,
  selectedMonth,
  onSelectMonth
}) => {
  const rows = buildMonthlySummary(animals, year);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Resumo Mensal
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {year ? `Ano de ${year}` : 'Todos os anos'} — clique num mês para recalcular o dashboard
          </p>
        </div>
        {selectedMonth != null && (
          <button
            onClick={() => onSelectMonth(null)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-[11px] font-bold transition-colors"
            title="Remover seleção de mês"
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </button>
        )}
      </div>

      <div className="space-y-1">
        <div className="grid grid-cols-[1fr_auto] gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 pb-1">
          <span>Mês</span>
          <span className="flex gap-4 text-right">
            <span className="w-12 text-emerald-600 dark:text-emerald-400">Entradas</span>
            <span className="w-12 text-rose-600 dark:text-rose-400">Adoções</span>
            <span className="w-12 text-slate-500">Óbitos</span>
          </span>
        </div>

        {rows.map((row) => {
          const active = selectedMonth === row.month;
          return (
            <button
              key={row.month}
              onClick={() => onSelectMonth(active ? null : row.month)}
              className={`w-full grid grid-cols-[1fr_auto] gap-2 items-center px-2 py-1.5 rounded-xl text-left text-xs font-semibold transition-colors ${
                active
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="font-bold">
                {MONTH_NAMES[row.month - 1]}
                {active && (
                  <span className="ml-2 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
                    selecionado
                  </span>
                )}
              </span>
              <span className="flex gap-4 text-right">
                <span className="w-12 font-bold text-emerald-600 dark:text-emerald-400">{row.entries}</span>
                <span className="w-12 font-bold text-rose-600 dark:text-rose-400">{row.adoptions}</span>
                <span className="w-12 font-bold text-slate-500 dark:text-slate-400">{row.deaths}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
