import React, { useState } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { useAuditActions } from '../../context/useAuditActions';
import { 
  Search, 
  Eye, 
  Edit3, 
  MapPin, 
  ClipboardList, 
  Calendar, 
  XCircle,
  RotateCcw,
  CheckCircle,
  X
} from 'lucide-react';
import { 
  LOCATION_LABELS, 
  SPECIES_LABELS, 
  SEX_LABELS, 
  ORIGIN_LABELS,
  LocationType
} from '../../types/animal';

interface TriageAnimalsViewProps {
  onOpenEditModal: (animalId: string) => void;
}

const DESTINO_OPTIONS: { value: LocationType; label: string }[] = [
  { value: 'internacao_caes', label: 'Canil' },
  { value: 'internacao_gatos', label: 'Gatil' },
  { value: 'lar_temporario', label: 'Lar Temporário' },
  { value: 'area_caes', label: 'Área de Cães' },
  { value: 'gatil', label: 'Gatil' },
  { value: 'guarda_compartilhada', label: 'Guarda Compartilhada' },
  { value: 'clinica_parceira', label: 'Clínica Parceira' }
];

export const TriageAnimalsView: React.FC<TriageAnimalsViewProps> = ({
  onOpenEditModal
}) => {
  const { animals, navigateToAnimal } = useAnimalContext();
  const { updateAnimal } = useAuditActions();

  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [finalizeAnimal, setFinalizeAnimal] = useState<{ id: string; name: string } | null>(null);
  const [finalizeDestino, setFinalizeDestino] = useState<LocationType>('internacao_caes');
  const [finalizeLoading, setFinalizeLoading] = useState(false);

  const triageAnimals = animals.filter(
    (a) => a.status === 'no_abrigo' && a.currentLocation === 'triagem'
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedSex, setSelectedSex] = useState<string>('all');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');
  const [selectedEntryDate, setSelectedEntryDate] = useState<string>('');

  const filteredAnimals = triageAnimals.filter((animal) => {
    const matchesSearch =
      searchTerm === '' ||
      animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (animal.microchip && animal.microchip.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSpecies = selectedSpecies === 'all' || animal.species === selectedSpecies;

    const matchesSex = selectedSex === 'all' || animal.sex === selectedSex;

    const matchesOrigin = selectedOrigin === 'all' || animal.origin === selectedOrigin;

    const matchesEntryDate = selectedEntryDate === '' || animal.entryDate === selectedEntryDate;

    return matchesSearch && matchesSpecies && matchesSex && matchesOrigin && matchesEntryDate;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSpecies('all');
    setSelectedSex('all');
    setSelectedOrigin('all');
    setSelectedEntryDate('');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedSpecies !== 'all' ||
    selectedSex !== 'all' ||
    selectedOrigin !== 'all' ||
    selectedEntryDate !== '';

  const triageLabel = LOCATION_LABELS.triagem;

  const handleFinalize = async () => {
    if (!finalizeAnimal) return;
    setFinalizeLoading(true);
    try {
      await updateAnimal(finalizeAnimal.id, { currentLocation: finalizeDestino });
      setFinalizeModalOpen(false);
      setFinalizeAnimal(null);
    } catch (err) {
      console.error(err);
    } finally {
      setFinalizeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-sky-600 dark:text-sky-400" />
            Animais em Triagem
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Exibindo <span className="font-bold text-slate-800 dark:text-slate-200">{filteredAnimals.length}</span> de{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{triageAnimals.length}</span> animais aguardando avaliação
          </p>
        </div>

        <span className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold border shrink-0 ${triageLabel.badge}`}>
          <MapPin className="w-4 h-4" />
          Local: Triagem
        </span>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Pesquisar por nome ou microchip..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium transition-all"
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Espécie
            </label>
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Todas as espécies</option>
              <option value="cachorro">Cachorro</option>
              <option value="gato">Gato</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          {/* Sex */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Sexo
            </label>
            <select
              value={selectedSex}
              onChange={(e) => setSelectedSex(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Todos os sexos</option>
              <option value="macho">Macho</option>
              <option value="femea">Fêmea</option>
            </select>
          </div>

          {/* Entry Origin */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Origem da Entrada
            </label>
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
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

          {/* Entry Date */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Data de Entrada
            </label>
            <input
              type="text"
              value={selectedEntryDate}
              onChange={(e) => setSelectedEntryDate(e.target.value)}
              placeholder="DD/MM/AAAA"
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">Filtros ativos aplicados</span>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors"
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
            <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              Nenhum animal em triagem
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Os animais recém-cadastrados entram automaticamente em triagem e aparecerão nesta lista.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="py-4 px-4">Nome</th>
                  <th className="py-4 px-4">Microchip</th>
                  <th className="py-4 px-4">Espécie</th>
                  <th className="py-4 px-4">Sexo</th>
                  <th className="py-4 px-4">Data de Entrada</th>
                  <th className="py-4 px-4">Origem</th>
                  <th className="py-4 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAnimals.map((animal) => (
                  <tr
                    key={animal.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Name - CLICKABLE to open full animal sheet */}
                    <td className="py-4 px-4 font-extrabold text-slate-900 dark:text-white">
                      <button
                        onClick={() => navigateToAnimal(animal.id)}
                        className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-left flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                        <span>{animal.name}</span>
                      </button>
                    </td>

                    {/* Microchip */}
                    <td className="py-4 px-4 text-sm font-mono">
                      {animal.microchip ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                          {animal.microchip}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Não informado</span>
                      )}
                    </td>

                    {/* Species */}
                    <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {SPECIES_LABELS[animal.species]}
                    </td>

                    {/* Sex */}
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                      {SEX_LABELS[animal.sex]}
                    </td>

                    {/* Entry Date */}
                    <td className="py-4 px-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {animal.entryDate}
                      </span>
                    </td>

                    {/* Origin */}
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-300">
                      {ORIGIN_LABELS[animal.origin]}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigateToAnimal(animal.id)}
                          title="Ver Ficha"
                          className="p-2.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 dark:text-slate-300 dark:hover:bg-sky-950/40 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenEditModal(animal.id)}
                          title="Editar Cadastro"
                          className="p-2.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-blue-950/40 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setFinalizeAnimal({ id: animal.id, name: animal.name });
                            setFinalizeDestino('internacao_caes');
                            setFinalizeModalOpen(true);
                          }}
                          title="Finalizar Triagem"
                          className="p-2.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-950/40 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Finalize Triage Modal */}
      {finalizeModalOpen && finalizeAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Finalizar Triagem
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {finalizeAnimal.name}
                </p>
              </div>
              <button onClick={() => setFinalizeModalOpen(false)} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-base text-slate-700 dark:text-slate-300">
                Deseja finalizar a triagem deste animal?
              </p>

              <div>
                <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">
                  Destino
                </label>
                <select
                  value={finalizeDestino}
                  onChange={(e) => setFinalizeDestino(e.target.value as LocationType)}
                  className="w-full px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {DESTINO_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setFinalizeModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinalize}
                disabled={finalizeLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm shadow-emerald-600/25 transition-colors disabled:opacity-50"
              >
                {finalizeLoading ? 'Finalizando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
