export type AlertPriority = 'baixa' | 'media' | 'alta';
export type AlertRecipient = 'todos' | 'administracao' | 'veterinaria' | 'recepcao';
export type AlertStatus = 'ativo' | 'expirado' | 'arquivado';

export interface Alert {
  id: string;
  title: string;
  message: string;
  priority: AlertPriority;
  recipient: AlertRecipient;
  author_name: string;
  author_role: 'admin' | 'common';
  created_at: string;
  expires_at: string | null;
  status: AlertStatus;
  is_read: boolean;
  is_reminder: boolean;
}

export const PRIORITY_LABELS: Record<AlertPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta'
};

export const PRIORITY_COLORS: Record<AlertPriority, { bg: string; text: string; border: string; dot: string }> = {
  baixa: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500'
  },
  media: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500'
  },
  alta: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500'
  }
};

export const RECIPIENT_LABELS: Record<AlertRecipient, string> = {
  todos: 'Todos',
  administracao: 'Administração',
  veterinaria: 'Veterinária',
  recepcao: 'Recepção'
};

export const STATUS_LABELS: Record<AlertStatus, string> = {
  ativo: 'Ativo',
  expirado: 'Expirado',
  arquivado: 'Arquivado'
};
