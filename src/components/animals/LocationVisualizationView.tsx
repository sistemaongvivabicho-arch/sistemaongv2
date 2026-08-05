import React, { useState } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { 
  MapPin, 
  Search, 
  XCircle, 
  ChevronRight, 
  ArrowLeft,
  Dog, 
  Building2,
  Calendar, 
  Scale, 
  Info,
  Layers
} from 'lucide-react';
import { LOCATION_LABELS, LocationType, SPECIES_LABELS, formatWeight } from '../../types/animal';

export const LocationVisualizationView: React.FC = () => {
  const { animals, navigateToAnimal } = useAnimalContext();

  const shelterAnimals = animals.filter((a) => a.status === 'no_abrigo');

  const [selectedSector, setSelectedSector] = useState<LocationType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const locationKeys: LocationType[] = [
    'internacao_gatos',
    'internacao_caes',
    'gatil',
    'area_caes',
    'lar_temporario',
    'guarda_compartilhada',
    'clinica_parceira'
  ];

  // Filter animals if in a selected sector and optional search
  const getAnimalsForSelectedSector = () => {
    if (!selectedSector) return [];
    return shelterAnimals.filter((animal) => {
      if (animal.currentLocation !== selectedSector) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        animal.name.toLowerCase().includes(term) ||
        (animal.microchip && animal.microchip.toLowerCase().includes(term))
      );
    });
  };

  // If a sector is opened -> Show dedicated Sector Screen
  if (selectedSector) {
    const activeLoc = LOCATION_LABELS[selectedSector];
    const sectorAnimals = getAnimalsForSelectedSector();
    const totalInSector = shelterAnimals.filter((a) => a.currentLocation === selectedSector).length;

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Back Arrow Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedSector(null);
              setSearchTerm('');
            }}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm transition-all border border-slate-200 dark:border-slate-800 shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar ao Menu Anterior</span>
          </button>

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
            Setores do Abrigo &gt; {activeLoc.label}
          </span>
        </div>

        {/* Selected Sector Screen Header */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5" />
                <span>Setor Selecionado</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeLoc.label}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Listagem individual dos animais alocados neste setor do abrigo.
              </p>
            </div>

            <div className="shrink-0">
              <span className={`px-4 py-2 rounded-xl text-xs font-extrabold border shadow-sm ${activeLoc.badge}`}>
                {totalInSector} {totalInSector === 1 ? 'animal no setor' : 'animais no setor'}
              </span>
            </div>
          </div>

          {/* Search Bar inside Sector */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`🔍 Pesquisar por nome ou microchip em ${activeLoc.label}...`}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all"
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

        {/* Animal Cards Grid in Sector */}
        {sectorAnimals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <Dog className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              Nenhum animal localizado neste setor
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm 
                ? 'Nenhum resultado encontrado para o termo pesquisado neste setor.' 
                : 'Não há animais registrados nesta área do abrigo no momento.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sectorAnimals.map((animal) => (
              <div
                key={animal.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {animal.name}
                    </h3>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {SPECIES_LABELS[animal.species]}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-slate-500 mt-1">
                    Microchip: {animal.microchip || 'Não informado'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Idade
                      </span>
                      <span className="font-semibold">
                        {animal.age || 'Não identificada'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Peso
                      </span>
                      <span className="font-semibold">
                        {formatWeight(animal.weight)}
                      </span>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Data de Entrada
                      </span>
                      <span className="font-semibold">{animal.entryDate}</span>
                    </div>
                  </div>

                  {animal.currentObservation && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-amber-700 dark:text-amber-400 block text-[10px] uppercase mb-0.5">
                        Observação Atual:
                      </span>
                      "{animal.currentObservation}"
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigateToAnimal(animal.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  <span>Ver Ficha Completa</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Initial Main Screen: Menu of Sector Cards (No emojis, clean layout)
  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
          <Layers className="w-3.5 h-3.5" />
          <span>Gestão por Espaço Físico</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <MapPin className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          Visualização por Localização
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Selecione uma das áreas abaixo para abrir a tela exclusiva com a relação detalhada de animais alocados no setor.
        </p>
      </div>

      {/* Sector Cards Menu Grid (Without Emojis) */}
      <div>
        <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4 px-1">
          Selecione o Setor do Abrigo
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {locationKeys.map((locKey) => {
            const loc = LOCATION_LABELS[locKey];
            const count = shelterAnimals.filter((a) => a.currentLocation === locKey).length;

            return (
              <button
                key={locKey}
                onClick={() => {
                  setSelectedSector(locKey);
                  setSearchTerm('');
                }}
                className="group p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all text-left flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {loc.label}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {count} {count === 1 ? 'animal cadastrado' : 'animais cadastrados'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${loc.badge}`}>
                    {count}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition-colors">
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

