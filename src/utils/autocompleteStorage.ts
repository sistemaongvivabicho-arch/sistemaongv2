import { Animal } from '../types/animal';

const STORAGE_KEY = 'system_autocomplete_suggestions';

export type AutocompleteField =
  | 'raca'
  | 'cor'
  | 'veterinario'
  | 'tutor_nome'
  | 'tutor_contato'
  | 'endereco';

type SuggestionsStore = Record<AutocompleteField, string[]>;

function loadStore(): SuggestionsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {
    raca: [],
    cor: [],
    veterinario: [],
    tutor_nome: [],
    tutor_contato: [],
    endereco: []
  };
}

function saveStore(store: SuggestionsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function getSuggestions(field: AutocompleteField): string[] {
  return loadStore()[field] || [];
}

export function addSuggestion(field: AutocompleteField, value: string): void {
  const trimmed = value?.trim();
  if (!trimmed) return;

  const store = loadStore();
  const current = store[field] || [];
  const lower = trimmed.toLowerCase();
  const exists = current.some((v) => v.toLowerCase() === lower);
  if (!exists) {
    store[field] = [...current, trimmed].sort((a, b) =>
      a.localeCompare(b, 'pt-BR')
    );
    saveStore(store);
  }
}

export function addSuggestionsFromAnimal(animal: Animal): void {
  if (animal.raca) addSuggestion('raca', animal.raca);
  if (animal.cor) addSuggestion('cor', animal.cor);
  if (animal.castrationVeterinarian) addSuggestion('veterinario', animal.castrationVeterinarian);
  if (animal.originTutorName) addSuggestion('tutor_nome', animal.originTutorName);
  if (animal.originTutorContact) addSuggestion('tutor_contato', animal.originTutorContact);
  if (animal.rescueAddress) addSuggestion('endereco', animal.rescueAddress);
  if (animal.adoptionDetails?.adopterName) addSuggestion('tutor_nome', animal.adoptionDetails.adopterName);
  if (animal.adoptionDetails?.adopterContact) addSuggestion('tutor_contato', animal.adoptionDetails.adopterContact);
  if (animal.adoptionDetails?.adopterAddress) addSuggestion('endereco', animal.adoptionDetails.adopterAddress);
}

export function seedSuggestionsFromAnimals(animals: Animal[]): void {
  const store = loadStore();
  let changed = false;

  for (const animal of animals) {
    if (animal.raca) {
      const lower = animal.raca.toLowerCase();
      if (!store.raca.some((v) => v.toLowerCase() === lower)) {
        store.raca.push(animal.raca);
        changed = true;
      }
    }
    if (animal.cor) {
      const lower = animal.cor.toLowerCase();
      if (!store.cor.some((v) => v.toLowerCase() === lower)) {
        store.cor.push(animal.cor);
        changed = true;
      }
    }
    if (animal.castrationVeterinarian) {
      const lower = animal.castrationVeterinarian.toLowerCase();
      if (!store.veterinario.some((v) => v.toLowerCase() === lower)) {
        store.veterinario.push(animal.castrationVeterinarian);
        changed = true;
      }
    }
    if (animal.originTutorName) {
      const lower = animal.originTutorName.toLowerCase();
      if (!store.tutor_nome.some((v) => v.toLowerCase() === lower)) {
        store.tutor_nome.push(animal.originTutorName);
        changed = true;
      }
    }
    if (animal.originTutorContact) {
      const lower = animal.originTutorContact.toLowerCase();
      if (!store.tutor_contato.some((v) => v.toLowerCase() === lower)) {
        store.tutor_contato.push(animal.originTutorContact);
        changed = true;
      }
    }
    if (animal.rescueAddress) {
      const lower = animal.rescueAddress.toLowerCase();
      if (!store.endereco.some((v) => v.toLowerCase() === lower)) {
        store.endereco.push(animal.rescueAddress);
        changed = true;
      }
    }
    if (animal.adoptionDetails?.adopterName) {
      const lower = animal.adoptionDetails.adopterName.toLowerCase();
      if (!store.tutor_nome.some((v) => v.toLowerCase() === lower)) {
        store.tutor_nome.push(animal.adoptionDetails.adopterName);
        changed = true;
      }
    }
    if (animal.adoptionDetails?.adopterContact) {
      const lower = animal.adoptionDetails.adopterContact.toLowerCase();
      if (!store.tutor_contato.some((v) => v.toLowerCase() === lower)) {
        store.tutor_contato.push(animal.adoptionDetails.adopterContact);
        changed = true;
      }
    }
    if (animal.adoptionDetails?.adopterAddress) {
      const lower = animal.adoptionDetails.adopterAddress.toLowerCase();
      if (!store.endereco.some((v) => v.toLowerCase() === lower)) {
        store.endereco.push(animal.adoptionDetails.adopterAddress);
        changed = true;
      }
    }
  }

  if (changed) {
    store.raca.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    store.cor.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    store.veterinario.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    store.tutor_nome.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    store.tutor_contato.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    store.endereco.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    saveStore(store);
  }
}
