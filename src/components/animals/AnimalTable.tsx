import React from 'react';
import { Eye, MapPin, Edit3 } from 'lucide-react';
import { Animal, LOCATION_LABELS, SPECIES_LABELS, SEX_LABELS } from '../../types/animal';

interface AnimalTableRowProps {
  animal: Animal;
  onView: (id: string) => void;
  onChangeLocation?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const AnimalTableRow: React.FC<AnimalTableRowProps> = ({
  animal,
  onView,
  onChangeLocation,
  onEdit
}) => {
  const loc = LOCATION_LABELS[animal.currentLocation];

  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
      {/* Name - CLICKABLE to open full animal sheet */}
      <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
        <button
          onClick={() => onView(animal.id)}
          className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{animal.name}</span>
        </button>
      </td>

      {/* Microchip */}
      <td className="py-3 px-4 text-sm font-mono">
        {animal.microchip ? (
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
            {animal.microchip}
          </span>
        ) : (
          <span className="text-slate-400 italic">Não informado</span>
        )}
      </td>

      {/* Species */}
      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
        {SPECIES_LABELS[animal.species]}
      </td>

      {/* Sex */}
      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
        {SEX_LABELS[animal.sex]}
      </td>

      {/* Entry Date */}
      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
        {animal.entryDate}
      </td>

      {/* Location Badge */}
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-bold border ${loc.badge}`}>
          <MapPin className="w-3 h-3" />
          {loc.label}
        </span>
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(animal.id)}
            title="Visualizar ficha completa"
            className="p-2.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-950/40 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          {onChangeLocation && (
            <button
              onClick={() => onChangeLocation(animal.id)}
              title="Alterar localização"
              className="p-2.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-indigo-950/40 transition-colors"
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(animal.id)}
              title="Editar cadastro"
              className="p-2.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-blue-950/40 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

interface AnimalTableProps {
  animals: Animal[];
  onView: (id: string) => void;
  onChangeLocation?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export const AnimalTable: React.FC<AnimalTableProps> = ({
  animals,
  onView,
  onChangeLocation,
  onEdit
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-base">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
            <th className="py-3 px-4">Nome</th>
            <th className="py-3 px-4">Microchip</th>
            <th className="py-3 px-4">Espécie</th>
            <th className="py-3 px-4">Sexo</th>
            <th className="py-3 px-4">Data de Entrada</th>
            <th className="py-3 px-4">Localização</th>
            <th className="py-3 px-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {animals.map((animal) => (
            <AnimalTableRow
              key={animal.id}
              animal={animal}
              onView={onView}
              onChangeLocation={onChangeLocation}
              onEdit={onEdit}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
