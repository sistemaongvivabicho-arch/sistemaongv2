import React, { useState, useEffect } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { X, MapPin, Check } from 'lucide-react';
import { LocationType, LOCATION_LABELS, FINAL_LOCATIONS } from '../../types/animal';

interface ChangeLocationModalProps {
  isOpen: boolean;
  animalId: string | null;
  onClose: () => void;
}

export const ChangeLocationModal: React.FC<ChangeLocationModalProps> = ({
  isOpen,
  animalId,
  onClose
}) => {
  const { getAnimalById, changeLocation } = useAnimalContext();

  const animal = animalId ? getAnimalById(animalId) : null;

  const [newLocation, setNewLocation] = useState<LocationType>('area_caes');
  const [observation, setObservation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (animal) {
      setNewLocation(animal.currentLocation === 'triagem' ? FINAL_LOCATIONS[0] : animal.currentLocation);
      setObservation(animal.currentObservation || '');
    }
  }, [animalId, animal]);

  if (!isOpen || !animal) return null;

  const currentLocationLabel = LOCATION_LABELS[animal.currentLocation]?.label || animal.currentLocation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const success = await changeLocation(animal.id, newLocation, observation.trim());
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
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Alterar Localização
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
            <p className="text-slate-500 font-medium">
              Animal: <span className="font-extrabold text-slate-900 dark:text-white text-sm">{animal.name}</span>
            </p>
            <p className="text-slate-500 font-medium">
              Localização atual: <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentLocationLabel}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nova Localização <span className="text-rose-500">*</span>
            </label>
            <select
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value as LocationType)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {FINAL_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {LOCATION_LABELS[loc].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Observação da Movimentação
            </label>
            <textarea
              rows={3}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex: Animal encaminhado para internação após avaliação veterinária."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Confirmar Movimentação
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
