import React, { useMemo, useState } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { ArrowLeft, Search, XCircle, ListFilter, PawPrint } from 'lucide-react';
import { AnimalTable } from '../animals/AnimalTable';

interface ResultsListViewProps {
  onOpenEditModal: (animalId: string) => void;
  onOpenChangeLocationModal: (animalId: string) => void;
}

export const ResultsListView: React.FC<ResultsListViewProps> = ({
  onOpenEditModal,
  onOpenChangeLocationModal
}) => {
  const {
    resultsList,
    resultsTitle,
    clearResultsList,
    navigateToAnimal,
    setActiveTab
  } = useAnimalContext();

  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!resultsList) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return resultsList;
    return resultsList.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.microchip && a.microchip.toLowerCase().includes(q))
    );
  }, [resultsList, searchTerm]);

  if (!resultsList) return null;

  const handleBack = () => {
    clearResultsList();
    setActiveTab('dashboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              title="Voltar ao dashboard"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <ListFilter className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                {resultsTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Exibindo{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{filtered.length}</span> de{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{resultsList.length}</span> animais
              </p>
            </div>
          </div>
        </div>

        {/* Local search */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Buscar dentro do resultado por nome ou microchip..."
            className="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <PawPrint className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              Nenhum animal encontrado
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tente redefinir a busca para encontrar o animal dentro deste conjunto de resultados.
            </p>
          </div>
        ) : (
          <AnimalTable
            animals={filtered}
            onView={(id) => navigateToAnimal(id)}
            onChangeLocation={onOpenChangeLocationModal}
            onEdit={onOpenEditModal}
          />
        )}
      </div>
    </div>
  );
};
