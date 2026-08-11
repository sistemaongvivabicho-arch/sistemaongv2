import React, { useMemo, useState } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { useAuth } from '../../context/AuthContext';
import {
  ClipboardList,
  TrendingUp,
  Heart,
  Bird,
  ClipboardCheck,
  Activity,
  Home,
  Stethoscope,
  Handshake,
  PawPrint,
  Syringe,
  XCircle,
  LayoutDashboard,
  ArrowRight,
  History
} from 'lucide-react';
import { Animal } from '../../types/animal';
import { MONTH_NAMES } from '../../types/dashboard';
import { FiltersPanel } from './FiltersPanel';
import { DashboardCards, DashboardCardConfig } from './DashboardCards';
import { SummaryCard } from './SummaryCard';
import { MonthlySummary } from './MonthlySummary';
import { ExportReport } from './ExportReport';
import {
  applyFilters,
  filterByEntryPeriod,
  isInPeriod,
  hasActiveFilters
} from './dashboardUtils';

function periodLabel(filters: { month: number | null; year: number | null }): string {
  if (filters.month != null && filters.year != null) {
    return `${MONTH_NAMES[filters.month - 1]} de ${filters.year}`;
  }
  if (filters.month != null) return MONTH_NAMES[filters.month - 1];
  if (filters.year != null) return `Ano ${filters.year}`;
  return 'Todos os períodos';
}

export const DashboardView: React.FC = () => {
  const {
    animals,
    dashboardFilters: filters,
    setDashboardFilters,
    setActiveTab
  } = useAnimalContext();
  const { isAdmin } = useAuth();

  const [filtersOpen, setFiltersOpen] = useState(true);

  // Conjunto base (filtros não-periódicos + busca global)
  const baseFiltered = useMemo(() => applyFilters(animals, filters), [animals, filters]);

  // Cohorte do período (mês/ano) — base para os cards de estado
  const periodBase = useMemo(() => filterByEntryPeriod(baseFiltered, filters), [baseFiltered, filters]);

  const adoptedInPeriod = useMemo(
    () =>
      baseFiltered.filter(
        (a) => a.adoptionDetails && isInPeriod(a.adoptionDetails.adoptionDate, filters.month, filters.year)
      ),
    [baseFiltered, filters.month, filters.year]
  );

  const deceasedInPeriod = useMemo(
    () =>
      baseFiltered.filter(
        (a) => a.deathDetails && isInPeriod(a.deathDetails.deathDate, filters.month, filters.year)
      ),
    [baseFiltered, filters.month, filters.year]
  );

  const activeFilterCount = [
    filters.month != null,
    filters.year != null,
    filters.origin !== 'all',
    filters.location !== 'all',
    filters.status !== 'all',
    filters.species !== 'all',
    filters.sex !== 'all',
    filters.castrado !== 'all',
    filters.query.trim() !== ''
  ].filter(Boolean).length;

  const period = periodLabel(filters);

  const cards: DashboardCardConfig[] = useMemo(() => {
    const byLocation = (loc: Animal['currentLocation']) =>
      periodBase.filter((a) => a.currentLocation === loc);

    return [
      {
        id: 'cadastrados',
        title: 'Animais cadastrados',
        count: baseFiltered.length,
        icon: ClipboardList,
        gradient: 'from-emerald-500 to-teal-600',
        subtitle: period,
        animals: baseFiltered
      },
      {
        id: 'entradas',
        title: 'Entradas no período',
        count: periodBase.length,
        icon: TrendingUp,
        gradient: 'from-sky-500 to-blue-600',
        subtitle: period,
        animals: periodBase
      },
      {
        id: 'adocoes',
        title: 'Adoções no período',
        count: adoptedInPeriod.length,
        icon: Heart,
        gradient: 'from-rose-500 to-pink-600',
        subtitle: period,
        animals: adoptedInPeriod
      },
      {
        id: 'obitos',
        title: 'Óbitos no período',
        count: deceasedInPeriod.length,
        icon: Bird,
        gradient: 'from-slate-600 to-slate-800',
        subtitle: period,
        animals: deceasedInPeriod
      },
      {
        id: 'triagem',
        title: 'Animais em triagem',
        count: byLocation('triagem').length,
        icon: ClipboardCheck,
        gradient: 'from-sky-500 to-cyan-600',
        subtitle: 'Local: Triagem',
        animals: byLocation('triagem')
      },
      {
        id: 'internados',
        title: 'Animais internados',
        count:
          byLocation('internacao_gatos').length + byLocation('internacao_caes').length,
        icon: Activity,
        gradient: 'from-violet-500 to-purple-600',
        subtitle: 'Internação Felina + Canina',
        animals: periodBase.filter(
          (a) =>
            a.currentLocation === 'internacao_gatos' || a.currentLocation === 'internacao_caes'
        )
      },
      {
        id: 'lar_temporario',
        title: 'Lar temporário',
        count: byLocation('lar_temporario').length,
        icon: Home,
        gradient: 'from-emerald-500 to-green-600',
        subtitle: 'Local: Lar Temporário',
        animals: byLocation('lar_temporario')
      },
      {
        id: 'clinica',
        title: 'Clínica parceira',
        count: byLocation('clinica_parceira').length,
        icon: Stethoscope,
        gradient: 'from-orange-500 to-amber-600',
        subtitle: 'Local: Clínica Parceira',
        animals: byLocation('clinica_parceira')
      },
      {
        id: 'guarda',
        title: 'Guarda compartilhada',
        count: byLocation('guarda_compartilhada').length,
        icon: Handshake,
        gradient: 'from-teal-500 to-cyan-600',
        subtitle: 'Local: Guarda Compartilhada',
        animals: byLocation('guarda_compartilhada')
      },
      {
        id: 'disponiveis',
        title: 'Disponíveis p/ adoção',
        count: byLocation('gatil').length + byLocation('area_caes').length,
        icon: PawPrint,
        gradient: 'from-emerald-600 to-lime-600',
        subtitle: 'Gatil + Área de Cães',
        animals: periodBase.filter(
          (a) => a.currentLocation === 'gatil' || a.currentLocation === 'area_caes'
        )
      },
      {
        id: 'castrados',
        title: 'Animais castrados',
        count: periodBase.filter((a) => a.castrado).length,
        icon: Syringe,
        gradient: 'from-indigo-500 to-blue-600',
        subtitle: 'Castração realizada',
        animals: periodBase.filter((a) => a.castrado)
      },
      {
        id: 'nao_castrados',
        title: 'Animais não castrados',
        count: periodBase.filter((a) => !a.castrado).length,
        icon: XCircle,
        gradient: 'from-rose-500 to-red-600',
        subtitle: 'Aguardando castração',
        animals: periodBase.filter((a) => !a.castrado)
      }
    ];
  }, [baseFiltered, periodBase, adoptedInPeriod, deceasedInPeriod, period]);

  if (animals.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center space-y-3">
        <PawPrint className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-base font-bold text-slate-800 dark:text-slate-200">
          Nenhum animal cadastrado ainda
        </p>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Cadastre a primeira entrada de animal para liberar todos os indicadores e gráficos do dashboard gerencial.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho gerencial */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <LayoutDashboard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Relatórios
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Central de gestão da ONG · Período: <span className="font-bold text-emerald-600 dark:text-emerald-400">{period}</span>
              {activeFilterCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  {activeFilterCount} filtro(s) ativo(s)
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="shrink-0">
              <ExportReport animals={baseFiltered} filters={filters} />
            </div>
          </div>
        </div>

        {hasActiveFilters(filters) && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">
              Todos os cards e gráficos estão respondendo aos filtros aplicados.
            </span>
            <button
              onClick={() =>
                setDashboardFilters({
                  month: null,
                  year: null,
                  origin: 'all',
                  location: 'all',
                  status: 'all',
                  species: 'all',
                  sex: 'all',
                  castrado: 'all',
                  query: ''
                })
              }
              className="inline-flex items-center gap-1.5 font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Corpo: painel de filtros + conteúdo */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <FiltersPanel open={filtersOpen} onToggle={() => setFiltersOpen((o) => !o)} />

        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Resumo Geral */}
          <SummaryCard />

          {/* Cards de indicadores */}
          <DashboardCards cards={cards} />

          {/* Registro de Alterações — somente administradores */}
          {isAdmin && (
            <div>
              <h2 className="text-sm font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-3">
                Relatórios
              </h2>
              <button
                onClick={() => setActiveTab('auditoria')}
                className="w-full flex items-center justify-between p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      Registro de Alterações
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Histórico permanente de todas as ações do sistema
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          )}

          {/* Resumo mensal */}
          <MonthlySummary
            animals={baseFiltered}
            year={filters.year}
            selectedMonth={filters.month}
            onSelectMonth={(m) => setDashboardFilters({ ...filters, month: m })}
          />
        </div>
      </div>
    </div>
  );
};
