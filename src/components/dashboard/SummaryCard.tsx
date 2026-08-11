import React, { useMemo } from 'react';
import { Home, Heart, Skull, ClipboardList } from 'lucide-react';
import { useAnimalContext } from '../../context/AnimalContext';

export const SummaryCard: React.FC = () => {
  const { animals } = useAnimalContext();

  const stats = useMemo(() => {
    const noAbrigo = animals.filter((a) => a.status === 'no_abrigo').length;
    const adotados = animals.filter((a) => a.status === 'adotado').length;
    const obitos = animals.filter((a) => a.status === 'obito').length;
    const total = animals.length;
    return [
      { label: 'No Abrigo', value: noAbrigo, icon: Home, gradient: 'from-emerald-500 to-teal-600' },
      { label: 'Adotados', value: adotados, icon: Heart, gradient: 'from-rose-500 to-pink-600' },
      { label: 'Óbitos', value: obitos, icon: Skull, gradient: 'from-slate-500 to-slate-700' },
      { label: 'Total', value: total, icon: ClipboardList, gradient: 'from-violet-500 to-purple-600' }
    ];
  }, [animals]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 blur-3xl" />

      <div className="relative flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
          <ClipboardList className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Resumo Geral</h3>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">Visão consolidada do sistema</p>
        </div>
      </div>

      <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, gradient }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50"
          >
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm shrink-0`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                {value}
              </p>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
