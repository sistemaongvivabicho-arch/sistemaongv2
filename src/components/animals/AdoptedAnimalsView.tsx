import React, { useState } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { Heart, Search, XCircle, Eye, Calendar, UserCheck } from 'lucide-react';
import { SPECIES_LABELS } from '../../types/animal';

export const AdoptedAnimalsView: React.FC = () => {
  const { animals, navigateToAnimal } = useAnimalContext();

  const adoptedAnimals = animals.filter((a) => a.status === 'adotado');

  const [searchTerm, setSearchTerm] = useState('');

  const filtered = adoptedAnimals.filter((animal) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      animal.name.toLowerCase().includes(term) ||
      (animal.microchip && animal.microchip.toLowerCase().includes(term)) ||
      (animal.adoptionDetails?.adopterName && animal.adoptionDetails.adopterName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Heart className="w-6 h-6 text-rose-600 dark:text-rose-400 fill-rose-600/20" />
            Animais Adotados
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
            Registro de finais felizes e histórico de tutores responsáveis.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, microchip ou novo tutor..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-semibold transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <Heart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              Nenhum registro de adoção encontrado
            </p>
            <p className="text-xs text-slate-500">
              Adoções registradas no sistema aparecerão nesta lista.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Microchip</th>
                  <th className="py-3 px-4">Espécie</th>
                  <th className="py-3 px-4">Data de Entrada</th>
                  <th className="py-3 px-4">Data da Adoção</th>
                  <th className="py-3 px-4">Data de Saída</th>
                  <th className="py-3 px-4">Novo Tutor</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((animal) => (
                  <tr
                    key={animal.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <button
                        onClick={() => navigateToAnimal(animal.id)}
                        className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left"
                      >
                        {animal.name}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                      {animal.microchip || 'Não informado'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                      {SPECIES_LABELS[animal.species]}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {animal.entryDate}
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-rose-600 dark:text-rose-400">
                      {animal.adoptionDetails?.adoptionDate || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {animal.adoptionDetails?.exitDate || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">
                            {animal.adoptionDetails?.adopterName || 'Não informado'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {animal.adoptionDetails?.adopterContact || ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigateToAnimal(animal.id)}
                        className="p-2.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-300 transition-colors"
                        title="Ver Ficha Completa"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
