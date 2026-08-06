import React, { useState } from 'react';
import { useAuditActions } from '../../context/useAuditActions';
import { X, Heart, Check } from 'lucide-react';
import { DatePicker } from '../common/DatePicker';
import { AutoComplete } from '../common/AutoComplete';
import { getSuggestions } from '../../utils/autocompleteStorage';
import { getTodayBR } from '../../utils/dateUtils';

interface RegisterAdoptionModalProps {
  isOpen: boolean;
  animalId: string | null;
  onClose: () => void;
}

export const RegisterAdoptionModal: React.FC<RegisterAdoptionModalProps> = ({
  isOpen,
  animalId,
  onClose
}) => {
  const { getAnimalById, registerAdoption, setActiveTab } = useAuditActions();

  const animal = animalId ? getAnimalById(animalId) : null;

  const [adoptionDate, setAdoptionDate] = useState(getTodayBR());
  const [adopterName, setAdopterName] = useState('');
  const [adopterContact, setAdopterContact] = useState('');
  const [adopterAddress, setAdopterAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !animal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adopterName.trim() || !adopterContact.trim()) {
      alert('Por favor, preencha o nome e o contato do novo tutor.');
      return;
    }

    setSubmitting(true);
    try {
      const success = await registerAdoption(animal.id, {
        adoptionDate,
        adopterName: adopterName.trim(),
        adopterContact: adopterContact.trim(),
        adopterAddress: adopterAddress.trim() || undefined,
        notes: notes.trim() || undefined
      });

      if (success) {
        onClose();
        setActiveTab('adotados');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Registrar Adoção de {animal.name}
              </h2>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Final feliz e acolhimento em novo lar
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <AutoComplete
                value={adopterName}
                onChange={setAdopterName}
                suggestions={getSuggestions('tutor_nome')}
                placeholder="Ex: Carlos Eduardo Guimarães"
                label="Nome do Novo Tutor"
                required
              />
            </div>

            <div>
              <AutoComplete
                value={adopterContact}
                onChange={setAdopterContact}
                suggestions={getSuggestions('tutor_contato')}
                placeholder="(19) 99999-8888"
                label="Contato do Tutor"
                required
              />
            </div>

            <div>
              <DatePicker
                value={adoptionDate}
                onChange={setAdoptionDate}
                label="Data da Adoção / Saída"
                required
                defaultToToday
              />
            </div>

            <div className="sm:col-span-2">
              <AutoComplete
                value={adopterAddress}
                onChange={setAdopterAddress}
                suggestions={getSuggestions('endereco')}
                placeholder="Ex: Rua das Flores, 120 - Bairro Centro"
                label="Endereço do Novo Tutor"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Observações da Adoção
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Termo de responsabilidade assinado. Acompanhamento de adaptação agendado."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Confirmar Adoção
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
