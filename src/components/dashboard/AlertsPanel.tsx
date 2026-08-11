import React from 'react';
import { AlertTriangle, Syringe, CalendarClock, Clock4, Activity, ArrowRight } from 'lucide-react';
import { useAnimalContext } from '../../context/AnimalContext';
import { Animal } from '../../types/animal';
import { DashboardAlertGroup } from './dashboardUtils';

interface AlertsPanelProps {
  groups: DashboardAlertGroup[];
}

const groupStyle: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; ring: string; badge: string; dot: string }
> = {
  vacinas: {
    icon: Syringe,
    ring: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900',
    badge: 'bg-amber-500',
    dot: 'bg-amber-500'
  },
  castracao: {
    icon: CalendarClock,
    ring: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900',
    badge: 'bg-rose-500',
    dot: 'bg-rose-500'
  },
  triagem: {
    icon: Clock4,
    ring: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900',
    badge: 'bg-sky-500',
    dot: 'bg-sky-500'
  },
  internacao: {
    icon: Activity,
    ring: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900',
    badge: 'bg-violet-500',
    dot: 'bg-violet-500'
  }
};

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ groups }) => {
  const { openResultsList } = useAnimalContext();

  if (groups.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Alertas</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Nenhum alerta pendente para os filtros atuais.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Alertas
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Pontos de atenção automáticos gerados pelos dados
        </p>
      </div>

      <div className="space-y-2">
        {groups.map((group) => {
          const style = groupStyle[group.key] || groupStyle.triagem;
          const Icon = style.icon;
          const preview = group.animals.slice(0, 3);
          return (
            <div key={group.key} className={`p-3.5 rounded-xl border ${style.ring} space-y-2`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 ${style.badge}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {group.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {group.description}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-black text-white ${style.badge}`}>
                  {group.animals.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {preview.map((a: Animal) => (
                  <span
                    key={a.id}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {a.name}
                  </span>
                ))}
                {group.animals.length > 3 && (
                  <span className="text-xs font-semibold text-slate-400">
                    +{group.animals.length - 3} outros
                  </span>
                )}
              </div>

              <button
                onClick={() => openResultsList(group.animals, group.title)}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Ver listagem completa
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
