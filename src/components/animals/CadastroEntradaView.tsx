import React, { useMemo, useState } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import {
  Search,
  XCircle,
  Plus,
  ArrowRight,
  PawPrint,
  Dog,
  Bird
} from 'lucide-react';
import { SPECIES_LABELS, formatWeight, LOCATION_LABELS } from '../../types/animal';
import { getPublicPhotoUrl } from '../../context/lib/photos';

interface CadastroEntradaViewProps {
  onOpenNewAnimalModal: () => void;
}

export const CadastroEntradaView: React.FC<CadastroEntradaViewProps> = ({ onOpenNewAnimalModal }) => {
  const { animals, navigateToAnimal } = useAnimalContext();
  const [searchTerm, setSearchTerm] = useState('');

  const recentEntries = useMemo(() => {
    return [...animals]
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate))
      .slice(0, 10);
  }, [animals]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return animals.filter((a) =>
      a.name.toLowerCase().includes(term) ||
      (a.microchip && a.microchip.toLowerCase().includes(term)) ||
      (a.originTutorName && a.originTutorName.toLowerCase().includes(term))
    );
  }, [animals, searchTerm]);

  const showSearch = searchTerm.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <PawPrint className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Cadastro de Entrada
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
              Pesquise animais ou cadastre uma nova entrada
            </p>
          </div>
          <button
            onClick={onOpenNewAnimalModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm shadow-emerald-600/25 hover:shadow-md hover:shadow-emerald-600/30 transition-all active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nova Entrada
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, microchip ou tutor..."
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-semibold transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {showSearch && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Resultados da Pesquisa ({searchResults.length})
            </h2>
          </div>
          {searchResults.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4 text-center">
              Nenhum resultado encontrado para "{searchTerm}".
            </p>
          ) : (
            <div className="space-y-2">
              {searchResults.map((animal) => (
                <button
                  key={animal.id}
                  onClick={() => navigateToAnimal(animal.id)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left hover:border-emerald-500 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                      {animal.photoUrl ? (
                        <img src={getPublicPhotoUrl(animal.photoUrl)} alt="" className="w-full h-full object-cover" />
                      ) : animal.species === 'gato' ? (
                        <Bird className="w-4 h-4 text-slate-500" />
                      ) : (
                        <Dog className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {animal.name}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {SPECIES_LABELS[animal.species]} · {animal.microchip || 'Sem microchip'} · Entrada: {animal.entryDate}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Entries */}
      {!showSearch && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Entradas Recentes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Últimos animais cadastrados
              </p>
            </div>
            {recentEntries.length > 0 && (
              <span className="text-sm font-bold text-slate-400">
                {animals.length} total
              </span>
            )}
          </div>

          {recentEntries.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <PawPrint className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Nenhum animal cadastrado ainda
              </p>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Clique em "Nova Entrada" para cadastrar o primeiro animal.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((animal) => (
                <button
                  key={animal.id}
                  onClick={() => navigateToAnimal(animal.id)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left hover:border-emerald-500 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                      {animal.photoUrl ? (
                        <img src={getPublicPhotoUrl(animal.photoUrl)} alt="" className="w-full h-full object-cover" />
                      ) : animal.species === 'gato' ? (
                        <Bird className="w-4 h-4 text-slate-500" />
                      ) : (
                        <Dog className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {animal.name}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {SPECIES_LABELS[animal.species]} · {animal.sex === 'macho' ? 'Macho' : 'Fêmea'} · {formatWeight(animal.weight)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-slate-400">{animal.entryDate}</p>
                    <span className={`inline-block text-sm font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${LOCATION_LABELS[animal.currentLocation]?.badge || ''}`}>
                      {LOCATION_LABELS[animal.currentLocation]?.label || animal.currentLocation}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
