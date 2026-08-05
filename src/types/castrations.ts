export type CastrationStatus =
  | 'agendada'
  | 'confirmada'
  | 'realizada'
  | 'cancelada'
  | 'reagendada';

export interface CastrationSchedule {
  id: string;
  animalId: string;
  animalName: string;
  animalSpecies: string;
  scheduledDate: string;       // DD/MM/AAAA
  performedDate?: string;      // DD/MM/AAAA
  veterinarian: string;
  notes: string;
  status: CastrationStatus;
  createdAt: string;           // ISO timestamp
  createdBy: string;           // user name
  createdByRole: 'admin' | 'common';
  updatedAt?: string;          // ISO timestamp
  updatedBy?: string;
  cancelReason?: string;
  history: CastrationHistoryEntry[];
}

export interface CastrationHistoryEntry {
  timestamp: string;           // ISO
  action: 'criacao' | 'edicao' | 'reagendamento' | 'cancelamento' | 'confirmacao' | 'realizacao' | 'exclusao';
  user: string;
  userRole: 'admin' | 'common';
  description: string;
  previousData?: Partial<CastrationSchedule>;
}

export const CASTRATION_STATUS_LABELS: Record<CastrationStatus, string> = {
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  reagendada: 'Reagendada'
};

export const CASTRATION_STATUS_COLORS: Record<CastrationStatus, { bg: string; text: string; border: string; dot: string }> = {
  agendada: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500'
  },
  confirmada: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500'
  },
  realizada: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500'
  },
  cancelada: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400'
  },
  reagendada: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
    dot: 'bg-violet-500'
  }
};

export const SPECIES_LABELS_CASTRATION: Record<string, string> = {
  cachorro: 'Cachorro',
  gato: 'Gato',
  outro: 'Outro'
};
