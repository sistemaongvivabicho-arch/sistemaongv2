import React, { useMemo } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { Scissors } from 'lucide-react';
import { CastrationAgenda } from '../dashboard/CastrationAgenda';

export const CastracoesView: React.FC = () => {
  const {
    animals,
    dashboardFilters: filters,
    setDashboardFilters
  } = useAnimalContext();

  const filteredAnimals = useMemo(() => animals, [animals]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Scissors className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Castracoes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Agenda de castracoes, agendamentos e registros do mes
          </p>
        </div>
      </div>

      <CastrationAgenda
        animals={filteredAnimals}
        filters={filters}
        onMonthChange={(m) => setDashboardFilters({ ...filters, month: m })}
      />
    </div>
  );
};
