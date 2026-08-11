import React, { useState } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';

interface UndoConfirmModalProps {
  isOpen: boolean;
  animalId: string | null;
  onClose: () => void;
}

export const UndoConfirmModal: React.FC<UndoConfirmModalProps> = ({
  isOpen,
  animalId,
  onClose
}) => {
  const { getAnimalById, undoLastAction } = useAnimalContext();

  const animal = animalId ? getAnimalById(animalId) : null;

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !animal) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const success = await undoLastAction(animal.id);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-4">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Desfazer Última Alteração
          </h2>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Tem certeza que deseja desfazer a última alteração registrada para o animal{' '}
          <strong className="text-slate-900 dark:text-white">{animal.name}</strong>?
        </p>

        <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          Esta ação restaurará a localização, estado ou dados cadastrais imediatamente anteriores na ficha visual.
        </p>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm"
          >
            Cancelar
          </button>
          <button
            disabled={submitting}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Desfazendo...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Desfazer alteração
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
