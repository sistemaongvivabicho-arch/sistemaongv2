import React, { useState } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { 
  Search, 
  Dog, 
  XCircle,
  RotateCcw
} from 'lucide-react';
import { 
  ALL_LOCATIONS,
  LOCATION_LABELS
} from '../../types/animal';
import { AnimalTable } from './AnimalTable';

interface ShelterAnimalsViewProps {
  onOpenEditModal: (animalId: string) => void;
  onOpenChangeLocationModal: (animalId: string) => void;
}

export const ShelterAnimalsView: React.FC<ShelterAnimalsViewProps> = ({
  onOpenEditModal,
  onOpenChangeLocationModal
}) => {
  const { animals, navigateToAnimal } = useAnimalContext();

  const shelterAnimals = animals.filter((a) => a.status === 'no_abrigo');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedSex, setSelectedSex] = useState<string>('all');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');

  const filteredAnimals = shelterAnimals.filter((animal) => {
    // Search match (name or microchip)
    const matchesSearch =
      searchTerm === '' ||
      animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (animal.microchip && animal.microchip.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter species
    const matchesSpecies = selectedSpecies === 'all' || animal.species === selectedSpecies;

    // Filter location
    const matchesLocation = selectedLocation === 'all' || animal.currentLocation === selectedLocation;

    // Filter sex
    const matchesSex = selectedSex === 'all' || animal.sex === selectedSex;

    // Filter origin
    const matchesOrigin = selectedOrigin === 'all' || animal.origin === selectedOrigin;

    return matchesSearch && matchesSpecies && matchesLocation && matchesSex && matchesOrigin;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSpecies('all');
    setSelectedLocation('all');
    setSelectedSex('all');
    setSelectedOrigin('all');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedSpecies !== 'all' ||
    selectedLocation !== 'all' ||
    selectedSex !== 'all' ||
    selectedOrigin !== 'all';

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Dog className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Animais no Abrigo
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
            Exibindo <span className="font-bold text-slate-800 dark:text-slate-200">{filteredAnimals.length}</span> de{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{shelterAnimals.length}</span> animais atualmente sob custódia
          </p>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome ou microchip..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-semibold transition-all"
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

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Species */}
          <div>
            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
              Espécie
            </label>
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            >
              <option value="all">Todas as espécies</option>
              <option value="cachorro">Cachorro</option>
              <option value="gato">Gato</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
              Localização
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            >
              <option value="all">Todas as localizações</option>
              {ALL_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {LOCATION_LABELS[loc].label}
                </option>
              ))}
            </select>
          </div>

          {/* Sex */}
          <div>
            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
              Sexo
            </label>
            <select
              value={selectedSex}
              onChange={(e) => setSelectedSex(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            >
              <option value="all">Todos os sexos</option>
              <option value="macho">Macho</option>
              <option value="femea">Fêmea</option>
            </select>
          </div>

          {/* Entry Origin */}
          <div>
            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
              Origem da Entrada
            </label>
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            >
              <option value="all">Todas as origens</option>
              <option value="guarda_municipal">Guarda Municipal</option>
              <option value="resgate_ong">Resgate pela ONG</option>
              <option value="entrega_voluntaria">Entrega voluntária</option>
              <option value="resgate_emergencia">Resgate de emergência</option>
              <option value="terceiros">Terceiros</option>
              <option value="nao_informado">Não informado</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">Filtros ativos aplicados</span>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredAnimals.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <Dog className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              Nenhum animal encontrado
            </p>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Tente redefinir a busca ou os filtros para visualizar os animais do abrigo.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <AnimalTable
            animals={filteredAnimals}
            onView={(id) => navigateToAnimal(id)}
            onChangeLocation={onOpenChangeLocationModal}
            onEdit={onOpenEditModal}
          />
        )}
      </div>
    </div>
  );
};
