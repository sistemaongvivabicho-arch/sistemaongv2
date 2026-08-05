export type BackupStatus = 'success' | 'error' | 'cancelled';

export interface BackupRecord {
  id: string;
  fileName: string;
  date: string;           // ISO timestamp
  sizeBytes: number;
  status: BackupStatus;
  error?: string;
}

export const BACKUP_STATUS_LABELS: Record<BackupStatus, string> = {
  success: 'Gerado com sucesso',
  error: 'Erro',
  cancelled: 'Cancelado'
};

export const BACKUP_STATUS_COLORS: Record<BackupStatus, { bg: string; text: string; border: string }> = {
  success: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  error: { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  cancelled: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' }
};

export const STORAGE_KEY_HISTORY = 'vivabicho_backup_history';

const MONTH_NAMES_PT = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

export function generateBackupFileName(): string {
  const now = new Date();
  const month = MONTH_NAMES_PT[now.getMonth()];
  const dd = now.getDate().toString().padStart(2, '0');
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const yy = now.getFullYear().toString().slice(-2);
  const hh = now.getHours().toString().padStart(2, '0');
  const min = now.getMinutes().toString().padStart(2, '0');
  return `BACKUP_${month}_${dd}.${mm}.${yy}_${hh}h${min}.zip`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDateTimeBR(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('pt-BR'),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };
}

export function getNextBackupText(lastDate: string | null): string {
  if (!lastDate) return 'Nenhum backup';
  const d = new Date(lastDate);
  d.setDate(d.getDate() + 7);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Atrasado';
  if (diffDays === 1) return 'Amanhã';
  if (diffDays <= 7) return `Em ${diffDays} dias`;
  return `Em ${Math.ceil(diffDays / 7)} semana(s)`;
}
