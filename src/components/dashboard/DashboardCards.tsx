import React from 'react';
import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { useAnimalContext } from '../../context/AnimalContext';
import { Animal } from '../../types/animal';

export interface DashboardCardConfig {
  id: string;
  title: string;
  count: number;
  icon: LucideIcon;
  gradient: string;
  iconBg?: string;
  subtitle?: string;
  animals: Animal[];
}

interface DashboardCardsProps {
  cards: DashboardCardConfig[];
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({ cards }) => {
  const { openResultsList } = useAnimalContext();

  return (
    <div>
      <h2 className="text-[13px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-3">
        Indicadores
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => openResultsList(card.animals, card.title)}
              disabled={card.count === 0}
              title={card.count > 0 ? `Ver listagem de ${card.title.toLowerCase()}` : 'Nenhum animal nesta categoria'}
              className={`group relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md overflow-hidden ${
                card.count > 0
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 cursor-pointer'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60 cursor-default'
              }`}
            >
              <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-20 ${card.gradient}`} />
              <div className="flex items-start justify-between w-full mb-2">
                <span className="text-[13px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase leading-tight pr-1">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl text-white shadow-sm shrink-0 bg-gradient-to-br ${card.gradient}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {card.count}
                  </span>
                    <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400 ml-1.5">
                    {card.count === 1 ? 'animal' : 'animais'}
                  </span>
                </div>
                {card.count > 0 && (
                  <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                )}
              </div>
              {card.subtitle && (
                <p className="text-[13px] text-slate-400 dark:text-slate-500 mt-1.5 truncate">
                  {card.subtitle}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
