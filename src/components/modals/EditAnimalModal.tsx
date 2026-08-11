import React, { useState, useEffect } from 'react';
import { useAuditActions } from '../../context/useAuditActions';
import { X, Edit3, Check, ShieldAlert } from 'lucide-react';
import { SpeciesType, SexType, PorteType, EntryOrigin, RESCUE_ORIGIN_OPTIONS } from '../../types/animal';
import { PhotoUploader } from '../common/PhotoUploader';
import { PhotoGallery } from '../common/PhotoGallery';
import { DatePicker } from '../common/DatePicker';
import { AutoComplete } from '../common/AutoComplete';
import { getSuggestions } from '../../utils/autocompleteStorage';

interface EditAnimalModalProps {
  isOpen: boolean;
  animalId: string | null;
  onClose: () => void;
}

export const EditAnimalModal: React.FC<EditAnimalModalProps> = ({
  isOpen,
  animalId,
  onClose
}) => {
  const { getAnimalById, updateAnimal, uploadAnimalPhoto, deleteAnimalPhoto, deleteSpecificPhoto, setPrimaryPhoto, getPhotosByAnimal } = useAuditActions();

  const animal = animalId ? getAnimalById(animalId) : null;

  const [name, setName] = useState('');
  const [microchip, setMicrochip] = useState('');
  const [species, setSpecies] = useState<SpeciesType>('cachorro');
  const [sex, setSex] = useState<SexType>('macho');
  const [porte, setPorte] = useState<PorteType | ''>('');
  const [raca, setRaca] = useState('');
  const [cor, setCor] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [origin, setOrigin] = useState<EntryOrigin>('resgate_ong');
  const [originProtocol, setOriginProtocol] = useState('');
  const [originNotes, setOriginNotes] = useState('');
  const [rescueOrigin, setRescueOrigin] = useState('');
  const [rescueAddress, setRescueAddress] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [originTutorName, setOriginTutorName] = useState('');
  const [originTutorContact, setOriginTutorContact] = useState('');
  const [currentObservation, setCurrentObservation] = useState('');
  const [castrado, setCastrado] = useState(false);
  const [castrationDate, setCastrationDate] = useState('');
  const [castrationScheduledDate, setCastrationScheduledDate] = useState('');
  const [vaccinationDate, setVaccinationDate] = useState('');
  const [vaccinationDueDate, setVaccinationDueDate] = useState('');

  useEffect(() => {
    if (animal) {
      setName(animal.name);
      setMicrochip(animal.microchip || '');
      setSpecies(animal.species);
      setSex(animal.sex);
      setPorte(animal.porte || '');
      setRaca(animal.raca || '');
      setCor(animal.cor || '');
      setAge(animal.age || '');
      setWeight(animal.weight || '');
      setOrigin(animal.origin);
      setOriginProtocol(animal.originProtocol || '');
      setOriginNotes(animal.originNotes || '');
      setRescueOrigin(animal.rescueOrigin || '');
      setRescueAddress(animal.rescueAddress || '');
      setEntryNotes(animal.entryNotes || '');
      setOriginTutorName(animal.originTutorName || '');
      setOriginTutorContact(animal.originTutorContact || '');
      setCurrentObservation(animal.currentObservation || '');
      setCastrado(animal.castrado);
      setCastrationDate(animal.castrationDate || '');
      setCastrationScheduledDate(animal.castrationScheduledDate || '');
      setVaccinationDate(animal.vaccinationDate || '');
      setVaccinationDueDate(animal.vaccinationDueDate || '');
    }
  }, [animalId, animal]);

  const [submitting, setSubmitting] = useState(false);

if (!isOpen || !animal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('O nome do animal é obrigatório.');
      return;
    }

    setSubmitting(true);
    try {
      const success = await updateAnimal(animal.id, {
        name: name.trim(),
        microchip: microchip.trim() || undefined,
        species,
        sex,
        porte: porte || undefined,
        raca: raca.trim() || undefined,
        cor: cor.trim() || undefined,
        age: age.trim() || undefined,
        weight: weight.trim() ? (weight.trim().toLowerCase().endsWith('kg') ? weight.trim() : `${weight.trim()} kg`) : undefined,
        origin,
        originProtocol: originProtocol.trim() || undefined,
        originNotes: originNotes.trim() || undefined,
        rescueOrigin: rescueOrigin || undefined,
        rescueAddress: rescueAddress.trim() || undefined,
        entryNotes: entryNotes.trim() || undefined,
        originTutorName: originTutorName.trim() || undefined,
        originTutorContact: originTutorContact.trim() || undefined,
        currentObservation: currentObservation.trim() || undefined,
        castrado,
        castrationDate: castrationDate.trim() || undefined,
        castrationScheduledDate: castrationScheduledDate.trim() || undefined,
        vaccinationDate: vaccinationDate.trim() || undefined,
        vaccinationDueDate: vaccinationDueDate.trim() || undefined
      });

      if (success) {
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Editar Cadastro - {animal.name}
              </h2>
              <p className="text-sm text-slate-500">
                Atualize as informações cadastrais do animal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fotos do Animal
              </label>
              <PhotoGallery
                photos={getPhotosByAnimal(animal.id)}
                onUpload={(file) => uploadAnimalPhoto(animal.id, file)}
                onDeletePhoto={(photoId) => deleteSpecificPhoto(animal.id, photoId)}
                onDeleteAll={() => deleteAnimalPhoto(animal.id)}
                onSetPrimary={(photoId) => setPrimaryPhoto(animal.id, photoId)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Animal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Microchip
              </label>
              <input
                type="text"
                value={microchip}
                onChange={(e) => setMicrochip(e.target.value)}
                placeholder="Não informado se em branco"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Espécie
              </label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as SpeciesType)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold"
              >
                <option value="cachorro">Cachorro</option>
                <option value="gato">Gato</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sexo
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as SexType)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold"
              >
                <option value="macho">Macho</option>
                <option value="femea">Fêmea</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Porte
              </label>
              <select
                value={porte}
                onChange={(e) => setPorte(e.target.value as PorteType | '')}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold"
              >
                <option value="">Não informado</option>
                <option value="pequeno">Pequeno</option>
                <option value="medio">Médio</option>
                <option value="grande">Grande</option>
              </select>
            </div>

            <div>
              <AutoComplete
                value={raca}
                onChange={setRaca}
                suggestions={getSuggestions('raca')}
                placeholder="Ex: Vira-lata, Persa..."
                label="Raça"
              />
            </div>

            <div>
              <AutoComplete
                value={cor}
                onChange={setCor}
                suggestions={getSuggestions('cor')}
                placeholder="Ex: Caramelo, Preto..."
                label="Cor"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Idade
              </label>
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Ex: 3 anos"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Peso <span className="text-emerald-600 dark:text-emerald-400 font-bold">(em kg)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Ex: 25"
                  className="w-full p-3 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
                  kg
                </span>
              </div>
            </div>

            <div>
              <AutoComplete
                value={originTutorName}
                onChange={setOriginTutorName}
                suggestions={getSuggestions('tutor_nome')}
                placeholder="Não identificado se em branco"
                label="Nome do Tutor de Origem"
              />
            </div>

            <div>
              <AutoComplete
                value={originTutorContact}
                onChange={setOriginTutorContact}
                suggestions={getSuggestions('tutor_contato')}
                placeholder="Telefone / Celular"
                label="Contato do Tutor de Origem"
              />
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4" />
                Informações do Resgate
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Origem do Resgate
                  </label>
                  <select
                    value={rescueOrigin}
                    onChange={(e) => setRescueOrigin(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold"
                  >
                    <option value="">Não informado</option>
                    {RESCUE_ORIGIN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <AutoComplete
                    value={rescueAddress}
                    onChange={setRescueAddress}
                    suggestions={getSuggestions('endereco')}
                    placeholder="Informe onde o animal foi encontrado"
                    label="Endereço do Resgate"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Observação de Entrada
                  </label>
                  <textarea
                    rows={2}
                    value={entryNotes}
                    onChange={(e) => setEntryNotes(e.target.value)}
                    placeholder="Descreva as condições em que o animal foi encontrado..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4" />
                Castração e Vacinação
              </h3>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer select-none mb-3">
                <input
                  type="checkbox"
                  checked={castrado}
                  onChange={(e) => setCastrado(e.target.checked)}
                  className="w-5 h-5 rounded-md accent-emerald-600"
                />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Animal castrado
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <DatePicker
                    value={castrationDate}
                    onChange={setCastrationDate}
                    label="Data da Castração"
                    disabled={!castrado}
                  />
                </div>

                <div>
                  <DatePicker
                    value={castrationScheduledDate}
                    onChange={setCastrationScheduledDate}
                    label="Castração Agendada"
                    disabled={castrado}
                  />
                </div>

                <div>
                  <DatePicker
                    value={vaccinationDate}
                    onChange={setVaccinationDate}
                    label="Última Vacina"
                  />
                </div>

                <div>
                  <DatePicker
                    value={vaccinationDueDate}
                    onChange={setVaccinationDueDate}
                    label="Próxima Vacina"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Observações Atuais
              </label>
              <textarea
                rows={2}
                value={currentObservation}
                onChange={(e) => setCurrentObservation(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
