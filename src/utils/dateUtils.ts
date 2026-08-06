const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function getTodayBR(): string {
  const now = new Date();
  return formatDateBR(now);
}

export function formatDateBR(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function parseBRDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2100) return null;
  return new Date(y, m - 1, d);
}

export function isValidBRDate(dateStr: string): boolean {
  return parseBRDate(dateStr) !== null;
}

export function isBeforeToday(dateStr: string): boolean {
  const d = parseBRDate(dateStr);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

export function isSameMonthYear(dateStr: string, month: number, year: number): boolean {
  const d = parseBRDate(dateStr);
  if (!d) return false;
  return d.getMonth() + 1 === month && d.getFullYear() === year;
}

export function getMonthName(month: number): string {
  return MONTH_NAMES_PT[month - 1] || '';
}

export function getMonthNames(): string[] {
  return [...MONTH_NAMES_PT];
}

export function getYearOptions(centerYear?: number): number[] {
  const cy = centerYear || new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => cy - 2 + i);
}
