import {
  Animal,
  LOCATION_LABELS,
  ORIGIN_LABELS,
  SpeciesType,
  LocationType
} from '../../types/animal';
import { DashboardFilters } from '../../types/dashboard';

// ============================================================================
// Datas (formato usado pelo app: DD/MM/AAAA ou DD/MM/AAAA HH:mm)
// ============================================================================

export function parseBRDate(value: string): Date | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

export function daysSince(value: string): number | null {
  const d = parseBRDate(value);
  if (!d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function isBeforeToday(value: string): boolean {
  const d = parseBRDate(value);
  if (!d) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d.getTime() < today.getTime();
}

export function isInPeriod(
  value: string,
  month: number | null,
  year: number | null
): boolean {
  if (month == null && year == null) return true;
  const d = parseBRDate(value);
  if (!d) return false;
  if (month != null && d.getMonth() + 1 !== month) return false;
  if (year != null && d.getFullYear() !== year) return false;
  return true;
}

// ============================================================================
// Busca global
// ============================================================================

export function searchMatchesAnimal(a: Animal, q: string): boolean {
  if (!q.trim()) return true;
  const term = q.toLowerCase();
  const haystack = [
    a.name,
    a.microchip,
    a.originProtocol,
    a.originNotes,
    a.entryNotes,
    a.currentObservation,
    a.rescueAddress,
    a.originTutorName,
    a.originTutorContact,
    ORIGIN_LABELS[a.origin],
    LOCATION_LABELS[a.currentLocation]?.label
  ]
    .filter(Boolean)
    .join(' \n ')
    .toLowerCase();
  return haystack.includes(term);
}

// ============================================================================
// Filtros do dashboard
// ============================================================================

export function applyFilters(animals: Animal[], f: DashboardFilters): Animal[] {
  return animals.filter((a) => {
    if (f.origin !== 'all' && a.origin !== f.origin) return false;
    if (f.location !== 'all' && a.currentLocation !== f.location) return false;
    if (f.status !== 'all' && a.status !== f.status) return false;
    if (f.species !== 'all' && a.species !== f.species) return false;
    if (f.sex !== 'all' && a.sex !== f.sex) return false;
    if (f.castrado === 'sim' && !a.castrado) return false;
    if (f.castrado === 'nao' && a.castrado) return false;
    if (!searchMatchesAnimal(a, f.query)) return false;
    return true;
  });
}

/** Restringe pelo período de entrada (mês/ano selecionados no dashboard). */
export function filterByEntryPeriod(animals: Animal[], f: DashboardFilters): Animal[] {
  return animals.filter((a) => isInPeriod(a.entryDate, f.month, f.year));
}

export function hasActiveFilters(f: DashboardFilters): boolean {
  return (
    f.month != null ||
    f.year != null ||
    f.origin !== 'all' ||
    f.location !== 'all' ||
    f.status !== 'all' ||
    f.species !== 'all' ||
    f.sex !== 'all' ||
    f.castrado !== 'all' ||
    f.query.trim() !== ''
  );
}

export function availableYears(animals: Animal[]): number[] {
  const set = new Set<number>();
  const now = new Date();
  set.add(now.getFullYear());
  animals.forEach((a) => {
    const d = parseBRDate(a.entryDate);
    if (d) set.add(d.getFullYear());
  });
  return Array.from(set).sort((x, y) => y - x);
}

// ============================================================================
// Resumo mensal
// ============================================================================

export interface MonthlySummaryRow {
  month: number;
  entries: number;
  adoptions: number;
  deaths: number;
}

export function buildMonthlySummary(
  animals: Animal[],
  year: number | null
): MonthlySummaryRow[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return {
      month: m,
      entries: animals.filter((a) => isInPeriod(a.entryDate, m, year)).length,
      adoptions: animals.filter(
        (a) => a.adoptionDetails && isInPeriod(a.adoptionDetails.adoptionDate, m, year)
      ).length,
      deaths: animals.filter(
        (a) => a.deathDetails && isInPeriod(a.deathDetails.deathDate, m, year)
      ).length
    };
  });
}

// ============================================================================
// Alertas
// ============================================================================

export const TRIAGE_ALERT_DAYS = 15;
export const INTERNED_ALERT_DAYS = 30;

export interface DashboardAlertGroup {
  key: string;
  title: string;
  description: string;
  animals: Animal[];
}

export function buildAlerts(animals: Animal[]): DashboardAlertGroup[] {
  const vaccineOverdue = animals.filter(
    (a) => a.vaccinationDueDate && isBeforeToday(a.vaccinationDueDate)
  );

  const castrationOverdue = animals.filter(
    (a) =>
      a.castrationScheduledDate &&
      isBeforeToday(a.castrationScheduledDate) &&
      !a.castrado
  );

  const triageLong = animals.filter(
    (a) =>
      a.status === 'no_abrigo' &&
      a.currentLocation === 'triagem' &&
      (daysSince(a.entryDate) ?? 0) >= TRIAGE_ALERT_DAYS
  );

  const internedLong = animals.filter(
    (a) =>
      a.status === 'no_abrigo' &&
      (a.currentLocation === 'internacao_gatos' || a.currentLocation === 'internacao_caes') &&
      (daysSince(a.entryDate) ?? 0) >= INTERNED_ALERT_DAYS
  );

  return [
    {
      key: 'vacinas',
      title: 'Vacinas vencidas',
      description: 'Animais com vacinação atrasada',
      animals: vaccineOverdue
    },
    {
      key: 'castracao',
      title: 'Castrações atrasadas',
      description: 'Agendamento passou da data e ainda não castrado',
      animals: castrationOverdue
    },
    {
      key: 'triagem',
      title: `Triagem há mais de ${TRIAGE_ALERT_DAYS} dias`,
      description: 'Animais aguardando avaliação por muito tempo',
      animals: triageLong
    },
    {
      key: 'internacao',
      title: `Internação há mais de ${INTERNED_ALERT_DAYS} dias`,
      description: 'Animais internados por muito tempo',
      animals: internedLong
    }
  ].filter((group) => group.animals.length > 0);
}

// ============================================================================
// Agrupadores auxiliares (usados nos gráficos)
// ============================================================================

export function countByLocation(animals: Animal[]): { loc: LocationType; count: number }[] {
  const keys: LocationType[] = [
    'triagem',
    'internacao_gatos',
    'internacao_caes',
    'gatil',
    'area_caes',
    'lar_temporario',
    'guarda_compartilhada',
    'clinica_parceira'
  ];
  return keys
    .map((loc) => ({ loc, count: animals.filter((a) => a.currentLocation === loc).length }))
    .filter((entry) => entry.count > 0);
}

export function countBySpecies(animals: Animal[]): { species: SpeciesType; count: number }[] {
  const keys: SpeciesType[] = ['cachorro', 'gato', 'outro'];
  return keys
    .map((species) => ({ species, count: animals.filter((a) => a.species === species).length }))
    .filter((entry) => entry.count > 0);
}
