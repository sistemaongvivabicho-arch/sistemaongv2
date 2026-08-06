import React, { useMemo } from 'react';
import {
  PawPrint, Home, Stethoscope, Heart, Skull, Scissors, Syringe, AlertTriangle
} from 'lucide-react';
import { useAnimalContext } from '../../context/AnimalContext';
import { useCastrations } from '../../context/CastrationsContext';

function parseDateBR(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return new Date(y, m - 1, d);
}

function daysDiffFromNow(dateStr: string): number {
  const d = parseDateBR(dateStr);
  if (!d) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export const OngeSummaryCard: React.FC = () => {
  const { animals, setActiveTab } = useAnimalContext();
  const { schedules } = useCastrations();

  const stats = useMemo(() => {
    const internacaoLocs = ['internacao_gatos', 'internacao_caes'];

    const total = animals.length;
    const noAbrigo = animals.filter((a) => a.status === 'no_abrigo').length;
    const triagem = animals.filter((a) => a.currentLocation === 'triagem').length;
    const adotados = animals.filter((a) => a.status === 'adotado').length;
    const obitos = animals.filter((a) => a.status === 'obito').length;

    const castAgendadas = schedules.filter(
      (s) => s.status === 'agendada' || s.status === 'confirmada'
    ).length;

    const vacinasVencidas = animals.filter((a) => {
      if (!a.vaccinationDueDate) return false;
      return daysDiffFromNow(a.vaccinationDueDate) > 0;
    }).length;

    const internacoesAcima30d = animals.filter((a) => {
      if (!internacaoLocs.includes(a.currentLocation)) return false;
      if (!a.entryDate) return false;
      return daysDiffFromNow(a.entryDate) > 30;
    }).length;

    return [
      { label: 'Registrados', value: total, icon: PawPrint, gradient: 'from-emerald-500 to-teal-600', navigate: 'entrada' },
      { label: 'No Abrigo', value: noAbrigo, icon: Home, gradient: 'from-blue-500 to-blue-600', navigate: 'no_abrigo' },
      { label: 'Triagem', value: triagem, icon: Stethoscope, gradient: 'from-orange-400 to-orange-500', navigate: 'triagem' },
      { label: 'Adotados', value: adotados, icon: Heart, gradient: 'from-green-500 to-emerald-600', navigate: 'adotados' },
      { label: 'Óbitos', value: obitos, icon: Skull, gradient: 'from-slate-600 to-slate-800', navigate: 'obito' },
      { label: 'Castrações', value: castAgendadas, icon: Scissors, gradient: 'from-violet-500 to-purple-600', navigate: 'castracoes' },
      { label: 'Vacinas', value: vacinasVencidas, icon: Syringe, gradient: 'from-yellow-400 to-amber-500', navigate: 'entrada' },
      { label: 'Internações', value: internacoesAcima30d, icon: AlertTriangle, gradient: 'from-red-500 to-rose-600', navigate: 'entrada' }
    ];
  }, [animals, schedules]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 blur-3xl" />

      <div className="relative flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
          <PawPrint className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Resumo Geral da ONG</h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Visão consolidada em tempo real</p>
        </div>
      </div>

      <div className="relative grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {stats.map(({ label, value, icon: Icon, gradient, navigate }) => (
          <button
            key={label}
            onClick={() => setActiveTab(navigate)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <p className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
              {value}
            </p>
            <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 text-center leading-tight">
              {label}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
