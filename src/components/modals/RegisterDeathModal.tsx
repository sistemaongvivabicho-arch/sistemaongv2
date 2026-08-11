import React, { useState } from 'react';
import { useAuditActions } from '../../context/useAuditActions';
import { X, Bird, Check } from 'lucide-react';
import { DatePicker } from '../common/DatePicker';
import { getTodayBR } from '../../utils/dateUtils';

interface RegisterDeathModalProps {
  isOpen: boolean;
  animalId: string | null;
  onClose: () => void;
}

export const RegisterDeathModal: React.FC<RegisterDeathModalProps> = ({
  isOpen,
  animalId,
  onClose
}) => {
  const { getAnimalById, registerDeath, setActiveTab } = useAuditActions();

  const animal = animalId ? getAnimalById(animalId) : null;

  const [deathDate, setDeathDate] = useState(getTodayBR());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !animal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const success = await registerDeath(animal.id, {
        deathDate,
        notes: notes.trim() || undefined
      });

      if (success) {
        onClose();
        setActiveTab('obito');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold">
              <Bird className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Registrar Óbito de {animal.name}
              </h2>
              <p className="text-sm text-slate-500 font-semibold">
                Registro de falecimento no acervo histórico
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
          <div>
            <DatePicker
              value={deathDate}
              onChange={setDeathDate}
              label="Data do Óbito / Saída"
              required
              defaultToToday
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              Observações do Óbito
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Óbito em decorrência de complicações graves e falência renal. Laudo veterinário registrado."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
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
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Confirmar Óbito
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
