import React, { useMemo, useState } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import {
  Scissors,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  CalendarClock,
  AlertTriangle,
  X
} from 'lucide-react';
import { Animal } from '../../types/animal';
import { DashboardFilters, MONTH_NAMES } from '../../types/dashboard';
import { isBeforeToday, isInPeriod } from './dashboardUtils';

interface CastrationAgendaProps {
  animals: Animal[];
  filters: DashboardFilters;
  onMonthChange: (month: number | null) => void;
}

export const CastrationAgenda: React.FC<CastrationAgendaProps> = ({
  animals,
  filters,
  onMonthChange
}) => {
  const { navigateToAnimal } = useAnimalContext();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [viewMonth, setViewMonth] = useState<number>(filters.month ?? currentMonth);
  const [viewYear, setViewYear] = useState<number>(filters.year ?? currentYear);

  // Sincroniza quando os filtros mudam (ex.: clique no Resumo Mensal)
  React.useEffect(() => {
    if (filters.month != null) setViewMonth(filters.month);
    if (filters.year != null) setViewYear(filters.year);
  }, [filters.month, filters.year]);

  const changeMonth = (m: number) => {
    setViewMonth(m);
    onMonthChange(m);
  };

  const changeYear = (y: number) => {
    setViewYear(y);
  };

  const goPrev = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((v) => v - 1);
      onMonthChange(12);
    } else {
      changeMonth(viewMonth - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((v) => v + 1);
      onMonthChange(1);
    } else {
      changeMonth(viewMonth + 1);
    }
  };

  const scheduledInMonth = useMemo(
    () =>
      animals.filter((a) =>
        isInPeriod(a.castrationScheduledDate || '', viewMonth, viewYear)
      ),
    [animals, viewMonth, viewYear]
  );

  const performedInMonth = useMemo(
    () =>
      animals.filter(
        (a) => a.castrado && isInPeriod(a.castrationDate || '', viewMonth, viewYear)
      ),
    [animals, viewMonth, viewYear]
  );

  const upcoming = useMemo(
    () =>
      animals
        .filter(
          (a) =>
            a.castrationScheduledDate &&
            !isBeforeToday(a.castrationScheduledDate) &&
            !a.castrado
        )
        .sort((a, b) =>
          (a.castrationScheduledDate || '').localeCompare(b.castrationScheduledDate || '')
        )
        .slice(0, 6),
    [animals]
  );

  const overdue = useMemo(
    () =>
      animals.filter(
        (a) =>
          a.castrationScheduledDate &&
          isBeforeToday(a.castrationScheduledDate) &&
          !a.castrado
      ),
    [animals]
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scissors className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Agenda de Castração
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Mini calendário, agendamentos e castrações do mês
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={goPrev}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={viewMonth}
            onChange={(e) => changeMonth(parseInt(e.target.value, 10))}
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={viewYear}
            onChange={(e) => changeYear(parseInt(e.target.value, 10))}
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={goNext}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {filters.month != null && (
            <button
              onClick={() => {
                onMonthChange(null);
                setViewMonth(currentMonth);
                setViewYear(currentYear);
              }}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-colors"
              title="Remover filtro de mês do dashboard"
            >
              <X className="w-3.5 h-3.5" />
              Limpar mês
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Agendamentos do mês */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </p>
            <p className="text-xs font-semibold text-slate-400">
              {scheduledInMonth.length} agendamento{scheduledInMonth.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="pt-2 space-y-1.5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" />
              Agendados em {MONTH_NAMES[viewMonth - 1]}
            </p>
            {scheduledInMonth.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum agendamento neste período.</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                {scheduledInMonth.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigateToAnimal(a.id)}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-left hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {a.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 shrink-0">
                      {a.castrationScheduledDate}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Listas laterais */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Scissors className="w-3.5 h-3.5 text-emerald-500" />
              Castrações realizadas no mês ({performedInMonth.length})
            </p>
            {performedInMonth.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma castração registrada neste mês.</p>
            ) : (
              <div className="space-y-1">
                {performedInMonth.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigateToAnimal(a.id)}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-left hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {a.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                      {a.castrationDate}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-indigo-500" />
              Próximas castrações
            </p>
            {upcoming.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma castração futura agendada.</p>
            ) : (
              <div className="space-y-1">
                {upcoming.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigateToAnimal(a.id)}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {a.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                      {a.castrationScheduledDate}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {overdue.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-1.5">
              <p className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Castrações atrasadas ({overdue.length})
              </p>
              {overdue.slice(0, 5).map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigateToAnimal(a.id)}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white/60 dark:bg-slate-900/50 border border-rose-100 dark:border-rose-900 text-left hover:bg-white dark:hover:bg-slate-900 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {a.name}
                  </span>
                    <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 shrink-0">
                    {a.castrationScheduledDate}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
