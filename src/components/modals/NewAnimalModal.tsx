import React, { useState, useEffect, useCallback } from 'react';
import { useAuditActions } from '../../context/useAuditActions';
import {
  X,
  Dog,
  User,
  ShieldAlert,
  MapPin,
  ClipboardList,
  FileText,
  Check,
  Camera
} from 'lucide-react';
import {
  SpeciesType,
  SexType,
  PorteType,
  EntryOrigin,
  RESCUE_ORIGIN_OPTIONS
} from '../../types/animal';
import { InstagramPhotoUploader } from '../common/InstagramPhotoUploader';
import { DatePicker } from '../common/DatePicker';
import { AutoComplete } from '../common/AutoComplete';
import { getSuggestions } from '../../utils/autocompleteStorage';
import { getTodayBR } from '../../utils/dateUtils';

const STORAGE_KEY = 'new_animal_form_data';

interface FormData {
  name: string;
  species: SpeciesType;
  sex: SexType;
  porte: PorteType | '';
  raca: string;
  cor: string;
  entryDate: string;
  microchip: string;
  age: string;
  weight: string;
  originTutorName: string;
  originTutorContact: string;
  origin: EntryOrigin;
  originNotes: string;
  rescueOrigin: string;
  rescueAddress: string;
  entryNotes: string;
  currentObservation: string;
  castrado: boolean;
  castrationDate: string;
  castrationScheduledDate: string;
  vaccinationDate: string;
  vaccinationDueDate: string;
}

const getInitialFormData = (): FormData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { ...getDefaultFormData(), ...parsed };
    } catch {
      return getDefaultFormData();
    }
  }
  return getDefaultFormData();
};

const getDefaultFormData = (): FormData => ({
  name: '',
  species: 'cachorro',
  sex: 'macho',
  porte: '',
  raca: '',
  cor: '',
  entryDate: getTodayBR(),
  microchip: '',
  age: '',
  weight: '',
  originTutorName: '',
  originTutorContact: '',
  origin: 'resgate_ong',
  originNotes: '',
  rescueOrigin: '',
  rescueAddress: '',
  entryNotes: '',
  currentObservation: '',
  castrado: false,
  castrationDate: '',
  castrationScheduledDate: '',
  vaccinationDate: '',
  vaccinationDueDate: ''
});

interface NewAnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewAnimalModal: React.FC<NewAnimalModalProps> = ({ isOpen, onClose }) => {
  const { addAnimal, navigateToAnimal, uploadAnimalPhoto } = useAuditActions();

  const [formData, setFormData] = useState<FormData>(getInitialFormData);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Persistir formulário em localStorage
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, isOpen]);

  // Limpar preview quando foto mudar
  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile);
      setPhotoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPhotoPreview('');
  }, [photoFile]);

  // Resetar formulário quando fechar
  const handleClose = useCallback(() => {
    setFormData(getDefaultFormData());
    setPhotoFile(null);
    setPhotoPreview('');
    localStorage.removeItem(STORAGE_KEY);
    onClose();
  }, [onClose]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Por favor, informe o nome do animal.');
      return;
    }

    setSubmitting(true);
    try {
      const createdId = await addAnimal({
        name: formData.name.trim(),
        microchip: formData.microchip.trim() || undefined,
        species: formData.species,
        sex: formData.sex,
        porte: formData.porte || undefined,
        raca: formData.raca.trim() || undefined,
        cor: formData.cor.trim() || undefined,
        age: formData.age.trim() || undefined,
        weight: formData.weight.trim() ? (formData.weight.trim().toLowerCase().endsWith('kg') ? formData.weight.trim() : `${formData.weight.trim()} kg`) : undefined,
        entryDate: formData.entryDate || getTodayBR(),
        currentLocation: 'triagem',
        origin: formData.origin,
        originNotes: formData.originNotes.trim() || undefined,
        rescueOrigin: formData.rescueOrigin || undefined,
        rescueAddress: formData.rescueAddress.trim() || undefined,
        entryNotes: formData.entryNotes.trim() || undefined,
        originTutorName: formData.originTutorName.trim() || undefined,
        originTutorContact: formData.originTutorContact.trim() || undefined,
        currentObservation: formData.currentObservation.trim() || undefined,
        castrado: formData.castrado,
        castrationDate: formData.castrationDate.trim() || undefined,
        castrationScheduledDate: formData.castrationScheduledDate.trim() || undefined,
        vaccinationDate: formData.vaccinationDate.trim() || undefined,
        vaccinationDueDate: formData.vaccinationDueDate.trim() || undefined
      });

      if (createdId) {
        if (photoFile) {
          await uploadAnimalPhoto(createdId, photoFile);
        }
        localStorage.removeItem(STORAGE_KEY);
        handleClose();
        navigateToAnimal(createdId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
              🐾
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Nova Entrada de Animal
              </h2>
              <p className="text-xs text-slate-500">
                Cadastre as informações essenciais para controle do abrigo
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* SEÇÃO 1: FOTO DO ANIMAL */}
          <div className="flex justify-center">
            <InstagramPhotoUploader
              photoPreview={photoPreview}
              onPhotoSelect={(file) => setPhotoFile(file)}
              onPhotoRemove={() => setPhotoFile(null)}
            />
          </div>

          {/* SEÇÃO 2: IDENTIFICAÇÃO DO ANIMAL */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Dog className="w-4 h-4" />
              Identificação do Animal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nome (Obrigatório) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Animal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ex: Thor, Luna, Bob..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              {/* Espécie (Obrigatório) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Espécie <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.species}
                  onChange={(e) => updateField('species', e.target.value as SpeciesType)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cachorro">Cachorro</option>
                  <option value="gato">Gato</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              {/* Sexo (Obrigatório) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sexo <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.sex}
                  onChange={(e) => updateField('sex', e.target.value as SexType)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="macho">Macho</option>
                  <option value="femea">Fêmea</option>
                </select>
              </div>

              {/* Porte (Opcional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Porte <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <select
                  value={formData.porte}
                  onChange={(e) => updateField('porte', e.target.value as PorteType | '')}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Não informado</option>
                  <option value="pequeno">Pequeno</option>
                  <option value="medio">Médio</option>
                  <option value="grande">Grande</option>
                </select>
              </div>

              {/* Raça (Opcional) */}
              <div>
                <AutoComplete
                  value={formData.raca}
                  onChange={(v) => updateField('raca', v)}
                  suggestions={getSuggestions('raca')}
                  placeholder="Ex: Vira-lata, Persa..."
                  label="Raça"
                />
              </div>

              {/* Cor (Opcional) */}
              <div>
                <AutoComplete
                  value={formData.cor}
                  onChange={(v) => updateField('cor', v)}
                  suggestions={getSuggestions('cor')}
                  placeholder="Ex: Caramelo, Preto..."
                  label="Cor"
                />
              </div>

              {/* Data de Entrada (Obrigatório) */}
              <div>
                <DatePicker
                  value={formData.entryDate}
                  onChange={(v) => updateField('entryDate', v)}
                  label="Data de Entrada"
                  required
                  defaultToToday
                />
              </div>

              {/* Idade (Opcional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Idade <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  placeholder="Ex: 2 anos, 5 meses..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Peso (Opcional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Peso (kg) <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => updateField('weight', e.target.value)}
                    placeholder="Ex: 25"
                    className="w-full p-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    kg
                  </span>
                </div>
              </div>

              {/* Microchip (Opcional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Microchip <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.microchip}
                  onChange={(e) => updateField('microchip', e.target.value)}
                  placeholder="Ex: 982000123456789"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: TUTOR DE ORIGEM (Opcional) */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              Tutor de Origem (Opcional)
            </h3>
            <p className="text-xs text-slate-500">
              Caso o animal seja de resgate sem tutor conhecido, pode deixar estes campos em branco.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <AutoComplete
                  value={formData.originTutorName}
                  onChange={(v) => updateField('originTutorName', v)}
                  suggestions={getSuggestions('tutor_nome')}
                  placeholder="Deixe em branco se não identificado"
                  label="Nome do Tutor"
                />
              </div>

              <div>
                <AutoComplete
                  value={formData.originTutorContact}
                  onChange={(v) => updateField('originTutorContact', v)}
                  suggestions={getSuggestions('tutor_contato')}
                  placeholder="Telefone / Celular"
                  label="Contato do Tutor"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: ORIGEM DA ENTRADA */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Origem da Entrada
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Origem do Resgate <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.origin}
                  onChange={(e) => updateField('origin', e.target.value as EntryOrigin)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="guarda_municipal">Guarda Municipal</option>
                  <option value="resgate_ong">Resgate pela ONG</option>
                  <option value="entrega_voluntaria">Entrega voluntária</option>
                  <option value="resgate_emergencia">Resgate de emergência</option>
                  <option value="terceiros">Terceiros</option>
                  <option value="nao_informado">Não informado</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações da Entrada
                </label>
                <textarea
                  rows={2}
                  value={formData.originNotes}
                  onChange={(e) => updateField('originNotes', e.target.value)}
                  placeholder="Ex: Animal resgatado pela Guarda Municipal após denúncia de maus-tratos..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 5: INFORMAÇÕES DO RESGATE */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Informações do Resgate
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Origem do Resgate
                </label>
                <select
                  value={formData.rescueOrigin}
                  onChange={(e) => updateField('rescueOrigin', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione a origem do resgate</option>
                  {RESCUE_ORIGIN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <AutoComplete
                  value={formData.rescueAddress}
                  onChange={(v) => updateField('rescueAddress', v)}
                  suggestions={getSuggestions('endereco')}
                  placeholder="Informe onde o animal foi encontrado"
                  label="Endereço do Resgate"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observação de Entrada
                </label>
                <textarea
                  rows={2}
                  value={formData.entryNotes}
                  onChange={(e) => updateField('entryNotes', e.target.value)}
                  placeholder="Descreva as condições em que o animal foi encontrado..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 6: LOCALIZAÇÃO INICIAL */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Localização Inicial no Abrigo <span className="text-rose-500">*</span>
            </h3>

            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Triagem <span className="text-sky-700 dark:text-sky-300 font-bold">(EM TRIAGEM)</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Todo animal cadastrado entra automaticamente em triagem. A localização definitiva será definida após o término da triagem.
                </p>
              </div>
            </div>
          </div>

          {/* SEÇÃO 7: CASTRAÇÃO E VACINAÇÃO */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Castração e Vacinação
            </h3>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.castrado}
                onChange={(e) => updateField('castrado', e.target.checked)}
                className="w-5 h-5 rounded-md accent-emerald-600"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Animal castrado
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <DatePicker
                  value={formData.castrationDate}
                  onChange={(v) => updateField('castrationDate', v)}
                  label="Data da Castração"
                  disabled={!formData.castrado}
                />
              </div>

              <div>
                <DatePicker
                  value={formData.castrationScheduledDate}
                  onChange={(v) => updateField('castrationScheduledDate', v)}
                  label="Castração Agendada"
                  disabled={formData.castrado}
                />
              </div>

              <div>
                <DatePicker
                  value={formData.vaccinationDate}
                  onChange={(v) => updateField('vaccinationDate', v)}
                  label="Última Vacina"
                />
              </div>

              <div>
                <DatePicker
                  value={formData.vaccinationDueDate}
                  onChange={(v) => updateField('vaccinationDueDate', v)}
                  label="Próxima Vacina"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 8: OBSERVAÇÕES ATUAIS */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Observações Atuais / Estado de Saúde
            </h3>

            <textarea
              rows={2}
              value={formData.currentObservation}
              onChange={(e) => updateField('currentObservation', e.target.value)}
              placeholder="Ex: Animal tranquilo e alimentando-se normalmente. Aguardando triagem..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Buttons Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Registrar Entrada
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
