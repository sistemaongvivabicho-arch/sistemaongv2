import React, { useMemo } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { useAlerts } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import {
  ClipboardCheck,
  Scissors,
  Bell,
  ClipboardList,
  ArrowRight,
  Heart,
  Syringe,
  Calendar
} from 'lucide-react';
import { SPECIES_LABELS } from '../../types/animal';
import { getPublicPhotoUrl } from '../../context/lib/photos';

function daysSinceEntry(entryDate: string): number {
  try {
    const parts = entryDate.split('/');
    if (parts.length !== 3) return 0;
    const entry = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    const now = new Date();
    return Math.floor((now.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

function formatTodayDate(): string {
  const now = new Date();
  return now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export const CentralDeAvisos: React.FC = () => {
  const { animals, setActiveTab } = useAnimalContext();
  const { alerts } = useAlerts();
  const { profile } = useAuth();

  const triagemAnimals = useMemo(
    () => animals.filter((a) => a.currentLocation === 'triagem' && a.status === 'no_abrigo'),
    [animals]
  );

  const todayStr = formatTodayDate();

  const castrationsToday = useMemo(() => {
    return animals.filter((a) => {
      if (!a.castrationScheduledDate) return false;
      return a.castrationScheduledDate === todayStr;
    });
  }, [animals, todayStr]);

  const internalAlerts = useMemo(() => {
    return alerts
      .filter((a) => a.status === 'ativo' && !a.is_reminder)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [alerts]);

  const todayAdoptions = useMemo(
    () => animals.filter((a) => a.adoptionDetails?.adoptionDate === todayStr),
    [animals, todayStr]
  );

  const todayVaccinations = useMemo(
    () => animals.filter((a) => a.vaccinationDate === todayStr),
    [animals, todayStr]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Central de Avisos
        </h2>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          Hoje
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Animais em Triagem */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10">
              <ClipboardCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Animais em Triagem
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {triagemAnimals.length} animal(is)
              </p>
            </div>
          </div>

          {triagemAnimals.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic py-2">
              Nenhum animal na triagem.
            </p>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {triagemAnimals.slice(0, 5).map((animal) => (
                <div
                  key={animal.id}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {animal.photoUrl ? (
                      <img
                        src={getPublicPhotoUrl(animal.photoUrl)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500">
                        {animal.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                      {animal.name}
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">
                      {daysSinceEntry(animal.entryDate)} dia(s) na triagem
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setActiveTab('triagem')}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 text-[11px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
          >
            Abrir Animais em Triagem
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 2: Castrações de Hoje */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10">
              <Scissors className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Castrações de Hoje
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {castrationsToday.length} agendada(s)
              </p>
            </div>
          </div>

          {castrationsToday.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic py-2">
              Nenhuma castração agendada para hoje.
            </p>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {castrationsToday.map((animal) => (
                <div
                  key={animal.id}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {animal.photoUrl ? (
                      <img
                        src={getPublicPhotoUrl(animal.photoUrl)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500">
                        {animal.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                      {animal.name}
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">
                      {SPECIES_LABELS[animal.species]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setActiveTab('castracoes')}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-[11px] font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
          >
            Abrir Castrações
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 3: Avisos Internos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Avisos Internos
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {internalAlerts.length} aviso(s)
              </p>
            </div>
          </div>

          {internalAlerts.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic py-2">
              Nenhum aviso interno no momento.
            </p>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {internalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50"
                >
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                    {alert.title}
                  </p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] text-slate-400">
                      {alert.author_name}
                    </span>
                    <span className="text-[8px] text-slate-300">·</span>
                    <span className="text-[8px] text-slate-400">
                      {new Date(alert.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setActiveTab('avisos')}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-[11px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          >
            Ver Todos os Avisos
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: Resumo do Dia */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Resumo do Dia
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {todayStr}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Em triagem
                </span>
              </div>
              <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300">
                {triagemAnimals.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
              <div className="flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Castrações hoje
                </span>
              </div>
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                {castrationsToday.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
              <div className="flex items-center gap-2">
                <Syringe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Vacinas hoje
                </span>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                {todayVaccinations.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Adoções hoje
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                {todayAdoptions.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
