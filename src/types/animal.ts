export type LocationType = 
  | 'triagem' 
  | 'internacao_gatos' 
  | 'internacao_caes' 
  | 'gatil' 
  | 'area_caes' 
  | 'lar_temporario' 
  | 'guarda_compartilhada' 
  | 'clinica_parceira';

export const TRIAGE_LOCATION: LocationType = 'triagem';

export const FINAL_LOCATIONS: LocationType[] = [
  'internacao_gatos',
  'internacao_caes',
  'gatil',
  'area_caes',
  'lar_temporario',
  'guarda_compartilhada',
  'clinica_parceira'
];

export const ALL_LOCATIONS: LocationType[] = ['triagem', ...FINAL_LOCATIONS];

export type SpeciesType = 'cachorro' | 'gato' | 'outro';

export type SexType = 'macho' | 'femea';

export type PorteType = 'pequeno' | 'medio' | 'grande';

export const PORTE_LABELS: Record<PorteType, string> = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande'
};

export type AnimalStatus = 'no_abrigo' | 'adotado' | 'obito';

export type EntryOrigin = 
  | 'guarda_municipal' 
  | 'resgate_ong' 
  | 'entrega_voluntaria' 
  | 'resgate_emergencia' 
  | 'terceiros' 
  | 'nao_informado' 
  | 'outro';

export type RescueOriginType =
  | 'guarda_municipal'
  | 'departamento_protecao_animal'
  | 'diretoria'
  | 'deixado_no_portao'
  | 'judice';

export const RESCUE_ORIGIN_OPTIONS: { value: RescueOriginType; label: string }[] = [
  { value: 'guarda_municipal', label: 'Guarda Municipal (GM)' },
  { value: 'departamento_protecao_animal', label: 'Departamento de Proteção Animal' },
  { value: 'diretoria', label: 'Diretoria' },
  { value: 'deixado_no_portao', label: 'Deixado no portão' },
  { value: 'judice', label: 'Júdice' }
];

export const RESCUE_ORIGIN_LABELS: Record<string, string> = {
  guarda_municipal: 'Guarda Municipal (GM)',
  departamento_protecao_animal: 'Departamento de Proteção Animal',
  diretoria: 'Diretoria',
  deixado_no_portao: 'Deixado no portão',
  judice: 'Júdice'
};

export interface HistoryEntry {
  id: string;
  date: string; // ISO String or DD/MM/YYYY HH:mm
  title: string;
  description: string;
  user?: string;
  iconType?: 'create' | 'move' | 'edit' | 'adopt' | 'death' | 'undo';
}

export interface AdoptionDetails {
  adoptionDate: string;
  exitDate: string;
  adopterName: string;
  adopterContact: string;
  adopterAddress?: string;
  notes?: string;
}

export interface DeathDetails {
  deathDate: string;
  exitDate: string;
  notes?: string;
}

export interface AnimalPhoto {
  id: string;
  animal_id: string;
  storage_path: string;
  is_primary: boolean;
  created_at: string;
}

export interface Animal {
  id: string;
  name: string;
  microchip?: string; // Optional, "Não informado" if empty
  species: SpeciesType;
  sex: SexType;
  porte?: PorteType; // Optional, "Não informado" if empty
  raca?: string; // Optional, "Não informado" if empty
  cor?: string; // Optional, "Não informado" if empty
  age?: string; // Optional, "Não identificada" if empty
  weight?: string; // Optional, "Não informado" if empty
  entryDate: string; // DD/MM/YYYY
  currentLocation: LocationType;
  status: AnimalStatus;
  origin: EntryOrigin;
  originProtocol?: string;
  originNotes?: string;
  rescueOrigin?: string;
  rescueAddress?: string;
  entryNotes?: string;
  originTutorName?: string; // Optional, "Não identificado" if empty
  originTutorContact?: string; // Optional, "Contato não informado" if empty
  currentObservation?: string;
  history: HistoryEntry[];
  adoptionDetails?: AdoptionDetails;
  deathDetails?: DeathDetails;
  photoUrl?: string; // Legacy: primary photo storage_path for backward compatibility
  photos?: AnimalPhoto[];

  // Fase 13 — Saúde & Castração (dashboard gerencial)
  castrado?: boolean;                 // false por padrão
  castrationDate?: string;            // DD/MM/AAAA — data em que a castração foi realizada
  castrationScheduledDate?: string;   // DD/MM/AAAA — data agendada para a castração
  vaccinationDate?: string;           // DD/MM/AAAA — última vacina aplicada
  vaccinationDueDate?: string;        // DD/MM/AAAA — próxima vacina / revacinação
}

export const LOCATION_LABELS: Record<LocationType, { label: string; icon: string; bg: string; text: string; badge: string }> = {
  triagem: {
    label: 'Triagem',
    icon: '',
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    text: 'text-sky-700 dark:text-sky-300',
    badge: 'bg-sky-100 text-sky-800 border-sky-200'
  },
  internacao_gatos: {
    label: 'Internação Felina',
    icon: '',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  internacao_caes: {
    label: 'Internação Canina',
    icon: '',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-100 text-rose-800 border-rose-200'
  },
  gatil: {
    label: 'Gatil',
    icon: '',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  area_caes: {
    label: 'Área de Cães',
    icon: '',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  lar_temporario: {
    label: 'Lar Temporário',
    icon: '',
    bg: 'bg-violet-500/10 dark:bg-violet-500/20',
    text: 'text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-100 text-violet-800 border-violet-200'
  },
  guarda_compartilhada: {
    label: 'Guarda Compartilhada',
    icon: '',
    bg: 'bg-teal-500/10 dark:bg-teal-500/20',
    text: 'text-teal-700 dark:text-teal-300',
    badge: 'bg-teal-100 text-teal-800 border-teal-200'
  },
  clinica_parceira: {
    label: 'Clínica Parceira',
    icon: '',
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-300',
    badge: 'bg-orange-100 text-orange-800 border-orange-200'
  }
};

export const ORIGIN_LABELS: Record<EntryOrigin, string> = {
  guarda_municipal: 'Guarda Municipal',
  resgate_ong: 'Resgate pela ONG',
  entrega_voluntaria: 'Entrega voluntária',
  resgate_emergencia: 'Resgate de emergência',
  terceiros: 'Terceiros',
  nao_informado: 'Não informado',
  outro: 'Outro'
};

export const SPECIES_LABELS: Record<SpeciesType, string> = {
  cachorro: 'Cachorro',
  gato: 'Gato',
  outro: 'Outro'
};

export const SEX_LABELS: Record<SexType, string> = {
  macho: 'Macho',
  femea: 'Fêmea'
};

export function formatWeight(weight?: string): string {
  if (!weight || !weight.trim()) return 'Não informado';
  const trimmed = weight.trim();
  if (/kg$/i.test(trimmed)) return trimmed;
  return `${trimmed} kg`;
}
