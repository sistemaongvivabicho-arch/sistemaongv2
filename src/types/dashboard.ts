import { AnimalStatus, EntryOrigin, LocationType, SexType, SpeciesType } from './animal';

export interface DashboardFilters {
  /** 1 a 12, ou null para todos os meses */
  month: number | null;
  /** ex.: 2026, ou null para todos os anos */
  year: number | null;
  origin: string;   // 'all' | EntryOrigin
  location: string; // 'all' | LocationType
  status: string;   // 'all' | AnimalStatus
  species: string;  // 'all' | SpeciesType
  sex: string;      // 'all' | SexType
  castrado: string; // 'all' | 'sim' | 'nao'
  query: string;
}

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  month: null,
  year: null,
  origin: 'all',
  location: 'all',
  status: 'all',
  species: 'all',
  sex: 'all',
  castrado: 'all',
  query: ''
};

export const DASHBOARD_FILTERS_STORAGE_KEY = 'vivabicho_dashboard_filters_v1';

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];
