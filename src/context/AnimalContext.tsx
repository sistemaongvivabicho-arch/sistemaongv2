import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Animal, 
  AnimalPhoto,
  LocationType, 
  AdoptionDetails, 
  DeathDetails,
  LOCATION_LABELS,
  PorteType
} from '../types/animal';
import {
  DashboardFilters,
  DEFAULT_DASHBOARD_FILTERS,
  DASHBOARD_FILTERS_STORAGE_KEY
} from '../types/dashboard';
import { useAuth } from './AuthContext';
import { supabase } from './lib/supabase';
import { PHOTOS_BUCKET } from './lib/photos';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AnimalContextType {
  animals: Animal[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedAnimalId: string | null;
  setSelectedAnimalId: (id: string | null) => void;
  locationFilter: LocationType | null;
  setLocationFilter: (loc: LocationType | null) => void;
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  loading: boolean;

  // Dashboard gerencial (Fase 13)
  dashboardFilters: DashboardFilters;
  setDashboardFilters: (filters: DashboardFilters) => void;
  resultsList: Animal[] | null;
  resultsTitle: string;
  openResultsList: (animals: Animal[], title: string) => void;
  clearResultsList: () => void;
  
  // Actions (Async)
  addAnimal: (animalData: Omit<Animal, 'id' | 'history' | 'status'>) => Promise<string | null>;
  updateAnimal: (id: string, updatedData: Partial<Animal>) => Promise<boolean>;
  changeLocation: (id: string, newLocation: LocationType, observation?: string) => Promise<boolean>;
  registerAdoption: (id: string, details: { adoptionDate: string; adopterName: string; adopterContact: string; adopterAddress?: string; notes?: string }) => Promise<boolean>;
  registerDeath: (id: string, details: { deathDate: string; notes?: string }) => Promise<boolean>;
  undoLastAction: (id: string) => Promise<boolean>;
  deleteAnimal: (id: string) => Promise<boolean>;
  uploadAnimalPhoto: (id: string, file: File) => Promise<string | null>;
  deleteAnimalPhoto: (id: string) => Promise<boolean>;
  deleteSpecificPhoto: (animalId: string, photoId: string) => Promise<boolean>;
  setPrimaryPhoto: (animalId: string, photoId: string) => Promise<boolean>;
  getPhotosByAnimal: (animalId: string) => AnimalPhoto[];
  
  // Selectors/Helpers
  getAnimalById: (id: string) => Animal | undefined;
  navigateToAnimal: (id: string) => void;
  navigateToLocationVisualization: (loc: LocationType) => void;
}

const AnimalContext = createContext<AnimalContextType | undefined>(undefined);

// Helper to validate UUID format
const validateUuid = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Database Mapping Functions
const mapFromDb = (db: any): Animal => {
  let entryDate = '';
  if (db.entry_date) {
    const parts = db.entry_date.split('-');
    if (parts.length === 3) {
      entryDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  let adoptionDetails: AdoptionDetails | undefined = undefined;
  if (db.adoption_details) {
    adoptionDetails = {
      adoptionDate: db.adoption_details.adoptionDate || '',
      exitDate: db.adoption_details.exitDate || '',
      adopterName: db.adoption_details.adopterName || '',
      adopterContact: db.adoption_details.adopterContact || '',
      adopterAddress: db.adoption_details.adopterAddress || '',
      notes: db.adoption_details.notes || ''
    };
  }

  let deathDetails: DeathDetails | undefined = undefined;
  if (db.death_details) {
    deathDetails = {
      deathDate: db.death_details.deathDate || '',
      exitDate: db.death_details.exitDate || '',
      notes: db.death_details.notes || ''
    };
  }

  return {
    id: db.id,
    name: db.name || 'Sem nome',
    microchip: db.microchip || '',
    species: db.species || 'outro',
    sex: db.sex || 'macho',
    porte: db.porte || '',
    raca: db.raca || '',
    cor: db.cor || '',
    age: db.age || '',
    weight: db.weight ? `${db.weight} kg` : '',
    entryDate,
    currentLocation: db.current_location || 'area_caes',
    status: db.status || 'no_abrigo',
    origin: db.origin || 'nao_informado',
    originProtocol: db.origin_protocol || '',
    originNotes: db.origin_notes || '',
    rescueOrigin: db.rescue_origin || '',
    rescueAddress: db.rescue_address || '',
    entryNotes: db.entry_notes || '',
    originTutorName: db.origin_tutor_name || '',
    originTutorContact: db.origin_tutor_contact || '',
    currentObservation: db.current_observation || '',
    history: db.history || [],
    adoptionDetails,
    deathDetails,
    photoUrl: db.photo_url || '',
    photos: [],
    castrado: db.castrado ?? false,
    castrationDate: db.castration_date || '',
    castrationScheduledDate: db.castration_scheduled_date || '',
    vaccinationDate: db.vaccination_date || '',
    vaccinationDueDate: db.vaccination_due_date || ''
  };
};

const mapToDb = (animal: Animal): any => {
  let entry_date: string | null = null;
  if (animal.entryDate) {
    const parts = animal.entryDate.split(' ')[0].split('/');
    if (parts.length === 3) {
      entry_date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  let weightNum: number | null = null;
  if (animal.weight) {
    const cleaned = animal.weight.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      weightNum = parsed;
    }
  }

  let adoption_details: any = null;
  if (animal.adoptionDetails) {
    adoption_details = {
      adoptionDate: animal.adoptionDetails.adoptionDate,
      exitDate: animal.adoptionDetails.exitDate,
      adopterName: animal.adoptionDetails.adopterName,
      adopterContact: animal.adoptionDetails.adopterContact,
      adopterAddress: animal.adoptionDetails.adopterAddress || '',
      notes: animal.adoptionDetails.notes || ''
    };
  }

  let death_details: any = null;
  if (animal.deathDetails) {
    death_details = {
      deathDate: animal.deathDetails.deathDate,
      exitDate: animal.deathDetails.exitDate,
      notes: animal.deathDetails.notes || ''
    };
  }

  const finalId = validateUuid(animal.id) ? animal.id : crypto.randomUUID();

  return {
    id: finalId,
    name: animal.name,
    microchip: animal.microchip || null,
    species: animal.species,
    sex: animal.sex,
    raca: animal.raca || null,
    cor: animal.cor || null,
    porte: animal.porte || null,
    age: animal.age || null,
    weight: weightNum,
    entry_date,
    current_location: animal.currentLocation,
    status: animal.status,
    origin: animal.origin,
    origin_protocol: animal.originProtocol || null,
    origin_notes: animal.originNotes || null,
    rescue_origin: animal.rescueOrigin || null,
    rescue_address: animal.rescueAddress || null,
    entry_notes: animal.entryNotes || null,
    origin_tutor_name: animal.originTutorName || null,
    origin_tutor_contact: animal.originTutorContact || null,
    current_observation: animal.currentObservation || null,
    history: animal.history || [],
    adoption_details,
    death_details,
    photo_url: animal.photoUrl || null,
    castrado: animal.castrado ?? false,
    castration_date: animal.castrationDate || null,
    castration_scheduled_date: animal.castrationScheduledDate || null,
    vaccination_date: animal.vaccinationDate || null,
    vaccination_due_date: animal.vaccinationDueDate || null
  };
};

export const AnimalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const operatorName = profile 
    ? `${profile.name} (${profile.role === 'admin' ? 'Coordenador' : 'Colaborador'})` 
    : 'Sistema';

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [allPhotos, setAllPhotos] = useState<AnimalPhoto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [undoStack, setUndoStack] = useState<Record<string, Animal[]>>({});

  const [activeTab, setActiveTab] = useState<string>('avisos');
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<LocationType | null>(null);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Dashboard gerencial (Fase 13)
  const [dashboardFilters, setDashboardFiltersState] = useState<DashboardFilters>(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_FILTERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_DASHBOARD_FILTERS, ...parsed };
      }
    } catch (e) {
      console.error('Erro ao recuperar filtros do dashboard:', e);
    }
    return DEFAULT_DASHBOARD_FILTERS;
  });

  const [resultsList, setResultsList] = useState<Animal[] | null>(null);
  const [resultsTitle, setResultsTitle] = useState<string>('');

  const setDashboardFilters = (filters: DashboardFilters) => {
    setDashboardFiltersState(filters);
    try {
      localStorage.setItem(DASHBOARD_FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
      console.error('Erro ao salvar filtros do dashboard:', e);
    }
  };

  const openResultsList = (animals: Animal[], title: string) => {
    setResultsList(animals);
    setResultsTitle(title);
    setSelectedAnimalId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearResultsList = () => {
    setResultsList(null);
    setResultsTitle('');
  };

  // Toast notification helper
  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const pushUndoSnapshot = (animal: Animal) => {
    setUndoStack((prev) => ({
      ...prev,
      [animal.id]: [...(prev[animal.id] || []), JSON.parse(JSON.stringify(animal))]
    }));
  };

  const getAnimalById = (id: string) => {
    return animals.find((a) => a.id === id);
  };

  const getPhotosByAnimal = (animalId: string): AnimalPhoto[] => {
    return allPhotos
      .filter((p) => p.animal_id === animalId)
      .sort((a, b) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  };

  const resolveAnimal = async (id: string): Promise<Animal | null> => {
    const local = getAnimalById(id);
    if (local) return local;
    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return mapFromDb(data);
  };

  const navigateToAnimal = (id: string) => {
    setSelectedAnimalId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToLocationVisualization = (loc: LocationType) => {
    setLocationFilter(loc);
    setSelectedAnimalId(null);
    setActiveTab('visualizacao');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Initial Load & Realtime Sync Subscription
  useEffect(() => {
    if (!profile) {
      setAnimals([]);
      setLoading(false);
      return;
    }

    const initData = async () => {
      setLoading(true);
      try {
        // Query animals from Supabase
        const { data: dbData, error: dbError } = await supabase
          .from('animals')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbError) throw dbError;

        const remoteAnimals = (dbData || []).map(mapFromDb);

        // Load all photos
        const { data: photosData, error: photosError } = await supabase
          .from('photos')
          .select('*')
          .order('created_at', { ascending: false });

        if (!photosError && photosData) {
          setAllPhotos(photosData as AnimalPhoto[]);
        }

        // Check if there is data in localStorage to migrate (one-time migration)
        const localSaved = localStorage.getItem('ong_animais_data_v1');
        let localAnimals: Animal[] = [];
        if (localSaved) {
          try {
            localAnimals = JSON.parse(localSaved);
          } catch (e) {
            console.error('Error parsing localStorage backup', e);
          }
        }

        // If remote database is empty but local storage has data, perform migration
        if (remoteAnimals.length === 0 && localAnimals.length > 0) {
          console.log(`[Migration] Encontrados ${localAnimals.length} animais locais. Iniciando migração...`);
          showToast(`Migrando ${localAnimals.length} animais para o banco online...`, 'info');

          // Generate valid UUIDs and format properly for each local record
          const mappedRows = localAnimals.map((la) => {
            const mapped = mapToDb(la);
            // Ensure ID is generated as UUID
            if (!validateUuid(mapped.id)) {
              mapped.id = crypto.randomUUID();
            }
            return mapped;
          });

          // Insert into Supabase
          const { error: insertError } = await supabase
            .from('animals')
            .insert(mappedRows);

          if (insertError) {
            showToast('Erro ao migrar animais locais: ' + insertError.message, 'error');
            setAnimals([]);
          } else {
            // Confirm the count matching
            const { data: verifyData, error: verifyError } = await supabase
              .from('animals')
              .select('*')
              .order('created_at', { ascending: false });

            if (verifyError || !verifyData) {
              showToast('Migração concluída, mas falha ao verificar banco.', 'error');
              setAnimals([]);
            } else {
              const verifiedAnimals = verifyData.map(mapFromDb);
              console.log(`[Migration] Concluída. Local: ${localAnimals.length} | Supabase: ${verifiedAnimals.length}`);
              if (verifiedAnimals.length === localAnimals.length) {
                showToast(`Sincronização concluída! ${verifiedAnimals.length} animais migrados com sucesso.`, 'success');
              } else {
                showToast(`Migração parcial. Supabase: ${verifiedAnimals.length} | Local: ${localAnimals.length}`, 'warning');
              }
              setAnimals(verifiedAnimals);
            }
          }
        } else {
          // Normal case: use remote database records
          setAnimals(remoteAnimals);
        }
      } catch (err: any) {
        showToast('Erro ao sincronizar banco: ' + (err.message || err), 'error');
        console.error('Initial load error:', err);
      } finally {
        setLoading(false);
      }
    };

    initData();

    // Subscribe to Realtime postgres changes
    const channel = supabase
      .channel('public:animals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'animals' },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          if (eventType === 'INSERT') {
            const mapped = mapFromDb(newRow);
            setAnimals((prev) => {
              if (prev.some((a) => a.id === mapped.id)) return prev;
              return [mapped, ...prev];
            });
          } else if (eventType === 'UPDATE') {
            const mapped = mapFromDb(newRow);
            setAnimals((prev) =>
              prev.map((a) => (a.id === mapped.id ? mapped : a))
            );
          } else if (eventType === 'DELETE') {
            setAnimals((prev) => prev.filter((a) => a.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    // Subscribe to photos realtime changes
    const photosChannel = supabase
      .channel('public:photos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'photos' },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          if (eventType === 'INSERT') {
            setAllPhotos((prev) => {
              if (prev.some((p) => p.id === newRow.id)) return prev;
              return [newRow as AnimalPhoto, ...prev];
            });
          } else if (eventType === 'UPDATE') {
            setAllPhotos((prev) =>
              prev.map((p) => (p.id === newRow.id ? (newRow as AnimalPhoto) : p))
            );
          } else if (eventType === 'DELETE') {
            setAllPhotos((prev) => prev.filter((p) => p.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(photosChannel);
    };
  }, [profile]);

  // Actions (Supabase Writes)

  const addAnimal = async (animalData: Omit<Animal, 'id' | 'history' | 'status'>): Promise<string | null> => {
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newId = crypto.randomUUID();

    const initialLocationName = LOCATION_LABELS['triagem']?.label || 'Triagem';

    const newAnimal: Animal = {
      ...animalData,
      id: newId,
      currentLocation: 'triagem',
      status: 'no_abrigo',
      history: [
        {
          id: 'hist-' + Date.now(),
          date: formattedDate,
          title: 'Entrada registrada',
          description: `Animal registrado na ONG. Local inicial: ${initialLocationName}.`,
          user: operatorName,
          iconType: 'create'
        }
      ]
    };

    const dbRow = mapToDb(newAnimal);

    try {
      const { data, error } = await supabase
        .from('animals')
        .insert(dbRow)
        .select();

      if (error) {
        console.error('[addAnimal] Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        showToast(`Erro ao cadastrar animal: ${error.message}`, 'error');
        return null;
      }

      if (!data || data.length === 0) {
        console.error('[addAnimal] Nenhum registro retornado apos insercao.');
        showToast('Animal cadastrado, mas falha ao confirmar.', 'warning');
        return newId;
      }

      showToast('Animal cadastrado com sucesso.', 'success');
      return newId;
    } catch (err: any) {
      console.error('[addAnimal] Excecao:', err);
      showToast('Erro inesperado ao cadastrar animal: ' + (err.message || err), 'error');
      return null;
    }
  };

  const updateAnimal = async (id: string, updatedData: Partial<Animal>): Promise<boolean> => {
    const current = getAnimalById(id);
    if (!current) {
      console.error('[updateAnimal] Animal nao encontrado:', id);
      showToast('Animal nao encontrado.', 'error');
      return false;
    }

    pushUndoSnapshot(current);

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newHistoryEntry = {
      id: 'hist-' + Date.now(),
      date: formattedDate,
      title: 'Dados atualizados',
      description: 'Ficha e informacoes cadastrais atualizadas.',
      user: operatorName,
      iconType: 'edit' as const
    };

    const updatedAnimal: Animal = {
      ...current,
      ...updatedData,
      history: [newHistoryEntry, ...current.history]
    };

    const dbRow = mapToDb(updatedAnimal);

    try {
      const { data, error } = await supabase
        .from('animals')
        .update(dbRow)
        .eq('id', id)
        .select();

      if (error) {
        console.error('[updateAnimal] Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        showToast(`Erro ao atualizar animal: ${error.message}`, 'error');
        return false;
      }

      if (!data || data.length === 0) {
        console.error('[updateAnimal] Nenhum registro atualizado. ID:', id);
        showToast('Animal nao encontrado no banco de dados.', 'error');
        return false;
      }

      showToast('Cadastro atualizado com sucesso.', 'success');
      return true;
    } catch (err: any) {
      console.error('[updateAnimal] Excecao:', err);
      showToast('Erro inesperado ao atualizar animal: ' + (err.message || err), 'error');
      return false;
    }
  };

  const changeLocation = async (id: string, newLocation: LocationType, observation?: string): Promise<boolean> => {
    const current = getAnimalById(id);
    if (!current) {
      console.error('[changeLocation] Animal nao encontrado:', id);
      showToast('Animal nao encontrado.', 'error');
      return false;
    }

    pushUndoSnapshot(current);

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const oldLocLabel = LOCATION_LABELS[current.currentLocation]?.label || current.currentLocation;
    const newLocLabel = LOCATION_LABELS[newLocation]?.label || newLocation;

    const newHistoryEntry = {
      id: 'hist-' + Date.now(),
      date: formattedDate,
      title: 'Mudanca de localizacao',
      description: `${oldLocLabel} → ${newLocLabel}.${observation ? ` Obs: ${observation}` : ''}`,
      user: operatorName,
      iconType: 'move' as const
    };

    const updatedAnimal: Animal = {
      ...current,
      currentLocation: newLocation,
      currentObservation: observation !== undefined ? observation : current.currentObservation,
      history: [newHistoryEntry, ...current.history]
    };

    const dbRow = mapToDb(updatedAnimal);

    try {
      const { data, error } = await supabase
        .from('animals')
        .update(dbRow)
        .eq('id', id)
        .select();

      if (error) {
        console.error('[changeLocation] Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        showToast(`Erro ao alterar localizacao: ${error.message}`, 'error');
        return false;
      }

      if (!data || data.length === 0) {
        console.error('[changeLocation] Nenhum registro atualizado. ID:', id);
        showToast('Animal nao encontrado no banco de dados.', 'error');
        return false;
      }

      showToast('Localizacao atualizada com sucesso.', 'success');
      return true;
    } catch (err: any) {
      console.error('[changeLocation] Excecao:', err);
      showToast('Erro inesperado ao alterar localizacao: ' + (err.message || err), 'error');
      return false;
    }
  };

  const registerAdoption = async (
    id: string,
    details: { adoptionDate: string; adopterName: string; adopterContact: string; adopterAddress?: string; notes?: string }
  ): Promise<boolean> => {
    const current = getAnimalById(id);
    if (!current) return false;

    pushUndoSnapshot(current);

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const adoptionObj: AdoptionDetails = {
      adoptionDate: details.adoptionDate,
      exitDate: details.adoptionDate,
      adopterName: details.adopterName,
      adopterContact: details.adopterContact,
      adopterAddress: details.adopterAddress || '',
      notes: details.notes || ''
    };

    const newHistoryEntry = {
      id: 'hist-' + Date.now(),
      date: formattedDate,
      title: 'Adoção registrada',
      description: `Adotado por ${details.adopterName} em ${details.adoptionDate}.`,
      user: operatorName,
      iconType: 'adopt' as const
    };

    const updatedAnimal: Animal = {
      ...current,
      status: 'adotado',
      adoptionDetails: adoptionObj,
      history: [newHistoryEntry, ...current.history]
    };

    const dbRow = mapToDb(updatedAnimal);

    try {
      const { data, error } = await supabase
        .from('animals')
        .update(dbRow)
        .eq('id', id)
        .select();

      if (error) {
        console.error('[registerAdoption] Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        showToast(`Erro ao registrar adocao: ${error.message}`, 'error');
        return false;
      }

      if (!data || data.length === 0) {
        console.error('[registerAdoption] Nenhum registro atualizado. ID:', id);
        showToast('Animal nao encontrado no banco de dados.', 'error');
        return false;
      }

      showToast('Adocao registrada com sucesso.', 'success');
      return true;
    } catch (err: any) {
      console.error('[registerAdoption] Excecao:', err);
      showToast('Erro inesperado ao registrar adocao: ' + (err.message || err), 'error');
      return false;
    }
  };

  const registerDeath = async (id: string, details: { deathDate: string; notes?: string }): Promise<boolean> => {
    const current = getAnimalById(id);
    if (!current) {
      console.error('[registerDeath] Animal nao encontrado:', id);
      showToast('Animal nao encontrado.', 'error');
      return false;
    }

    pushUndoSnapshot(current);

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const deathObj: DeathDetails = {
      deathDate: details.deathDate,
      exitDate: details.deathDate,
      notes: details.notes || ''
    };

    const newHistoryEntry = {
      id: 'hist-' + Date.now(),
      date: formattedDate,
      title: 'Obito registrado',
      description: `Obito ocorrido em ${details.deathDate}.${details.notes ? ` Obs: ${details.notes}` : ''}`,
      user: operatorName,
      iconType: 'death' as const
    };

    const updatedAnimal: Animal = {
      ...current,
      status: 'obito',
      deathDetails: deathObj,
      history: [newHistoryEntry, ...current.history]
    };

    const dbRow = mapToDb(updatedAnimal);

    try {
      const { data, error } = await supabase
        .from('animals')
        .update(dbRow)
        .eq('id', id)
        .select();

      if (error) {
        console.error('[registerDeath] Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        showToast(`Erro ao registrar obito: ${error.message}`, 'error');
        return false;
      }

      if (!data || data.length === 0) {
        console.error('[registerDeath] Nenhum registro atualizado. ID:', id);
        showToast('Animal nao encontrado no banco de dados.', 'error');
        return false;
      }

      showToast('Obito registrado com sucesso.', 'success');
      return true;
    } catch (err: any) {
      console.error('[registerDeath] Excecao:', err);
      showToast('Erro inesperado ao registrar obito: ' + (err.message || err), 'error');
      return false;
    }
  };

  const undoLastAction = async (id: string): Promise<boolean> => {
    const stack = undoStack[id];
    if (!stack || stack.length === 0) {
      showToast('Nenhuma alteração anterior para desfazer.', 'warning');
      return false;
    }

    const previousState = stack[stack.length - 1];

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const undoHistoryEntry = {
      id: 'hist-' + Date.now(),
      date: formattedDate,
      title: 'Alteração desfeita',
      description: 'Restaurado o estado anterior do animal.',
      user: operatorName,
      iconType: 'undo' as const
    };

    const restoredAnimal = {
      ...previousState,
      history: [undoHistoryEntry, ...previousState.history]
    };

    const dbRow = mapToDb(restoredAnimal);

    try {
      const { data, error } = await supabase
        .from('animals')
        .update(dbRow)
        .eq('id', id)
        .select();

      if (error) {
        console.error('[undoLastAction] Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        showToast(`Erro ao desfazer acao: ${error.message}`, 'error');
        return false;
      }

      if (!data || data.length === 0) {
        console.error('[undoLastAction] Nenhum registro atualizado. ID:', id);
        showToast('Animal nao encontrado no banco de dados.', 'error');
        return false;
      }

      // Pop snapshot from memory undo stack
      setUndoStack((prev) => ({
        ...prev,
        [id]: prev[id].slice(0, -1)
      }));

      showToast('Ultima alteracao desfeita com sucesso.', 'success');
      return true;
    } catch (err: any) {
      console.error('[undoLastAction] Excecao:', err);
      showToast('Erro inesperado ao desfazer acao: ' + (err.message || err), 'error');
      return false;
    }
  };

  const deleteAnimal = async (id: string): Promise<boolean> => {
    try {
      // 1. Fetch all photos for this animal to clean up storage
      const { data: photosData } = await supabase
        .from('photos')
        .select('storage_path')
        .eq('animal_id', id);

      // 2. Delete photo files from Supabase Storage
      if (photosData && photosData.length > 0) {
        const filePaths = photosData.map((p) => p.storage_path);
        await supabase.storage.from(PHOTOS_BUCKET).remove(filePaths);
      }

      // 3. Delete the animal (cascades to photos table via FK)
      const { error } = await supabase.from('animals').delete().eq('id', id);
      if (error) {
        console.error('[deleteAnimal] Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        showToast(`Erro ao excluir animal: ${error.message}`, 'error');
        return false;
      }

      // 4. Clean up local state
      setAllPhotos((prev) => prev.filter((p) => p.animal_id !== id));
      setAnimals((prev) => prev.filter((a) => a.id !== id));

      showToast('Animal excluido com sucesso.', 'success');
      return true;
    } catch (err: any) {
      console.error('[deleteAnimal] Excecao:', err);
      showToast('Erro inesperado ao excluir animal: ' + (err.message || err), 'error');
      return false;
    }
  };

  const uploadAnimalPhoto = async (id: string, file: File): Promise<string | null> => {
    const current = await resolveAnimal(id);
    if (!current) return null;

    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const filePath = `animals/${id}/${Date.now()}.${extension}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(filePath, file, {
          contentType: file.type || 'image/jpeg',
          upsert: false
        });
      if (uploadError) throw uploadError;

      // Unset current primary photo
      const currentPhotos = getPhotosByAnimal(id);
      const currentPrimary = currentPhotos.find((p) => p.is_primary);

      if (currentPrimary) {
        await supabase
          .from('photos')
          .update({ is_primary: false })
          .eq('id', currentPrimary.id);
      }

      // Insert new photo as primary
      const newPhoto: AnimalPhoto = {
        id: crypto.randomUUID(),
        animal_id: id,
        storage_path: filePath,
        is_primary: true,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('photos')
        .insert(newPhoto);
      if (insertError) throw insertError;

      // Update local state
      setAllPhotos((prev) => {
        const withoutCurrent = prev.filter((p) => p.animal_id !== id || !p.is_primary);
        return [newPhoto, ...withoutCurrent];
      });

      // Update animal's photo_url for backward compatibility
      pushUndoSnapshot(current);
      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const hadPhoto = currentPhotos.length > 0;
      const newHistoryEntry = {
        id: 'hist-' + Date.now(),
        date: formattedDate,
        title: hadPhoto ? 'Nova foto adicionada' : 'Foto inicial adicionada',
        description: hadPhoto ? 'Nova foto adicionada à galeria do animal.' : 'Primeira foto adicionada à ficha do animal.',
        user: operatorName,
        iconType: 'edit' as const
      };

      const updatedAnimal: Animal = {
        ...current,
        photoUrl: filePath,
        photos: [newPhoto, ...currentPhotos.filter((p) => p.id !== newPhoto.id)],
        history: [newHistoryEntry, ...current.history]
      };

      const { error: updateError } = await supabase
        .from('animals')
        .update(mapToDb(updatedAnimal))
        .eq('id', id);
      if (updateError) {
        console.error('[uploadAnimalPhoto] Supabase update error:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
        throw updateError;
      }

      showToast('Foto adicionada com sucesso.', 'success');
      return filePath;
    } catch (err: any) {
      console.error('[uploadAnimalPhoto] Excecao:', err);
      showToast('Erro ao enviar foto: ' + (err.message || err), 'error');
      return null;
    }
  };

  const deleteAnimalPhoto = async (id: string): Promise<boolean> => {
    const current = await resolveAnimal(id);
    if (!current) return false;

    const currentPhotos = getPhotosByAnimal(id);
    if (currentPhotos.length === 0) return false;

    try {
      const primaryPhoto = currentPhotos.find((p) => p.is_primary) || currentPhotos[0];

      // Remove from storage
      const { error: removeError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .remove([primaryPhoto.storage_path]);
      if (removeError) throw removeError;

      // Remove from photos table
      const { error: deleteError } = await supabase
        .from('photos')
        .delete()
        .eq('id', primaryPhoto.id);
      if (deleteError) throw deleteError;

      // Update local state
      const remainingPhotos = currentPhotos.filter((p) => p.id !== primaryPhoto.id);
      setAllPhotos((prev) => prev.filter((p) => p.id !== primaryPhoto.id));

      // If deleted photo was primary and there are remaining photos, make the newest one primary
      let newPrimaryPath = '';
      if (primaryPhoto.is_primary && remainingPhotos.length > 0) {
        const sortedRemaining = [...remainingPhotos].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const newPrimary = sortedRemaining[0];
        newPrimaryPath = newPrimary.storage_path;

        await supabase
          .from('photos')
          .update({ is_primary: true })
          .eq('id', newPrimary.id);

        setAllPhotos((prev) =>
          prev.map((p) => (p.id === newPrimary.id ? { ...p, is_primary: true } : p))
        );
      }

      // Update animal record
      pushUndoSnapshot(current);

      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const newHistoryEntry = {
        id: 'hist-' + Date.now(),
        date: formattedDate,
        title: 'Foto removida',
        description: remainingPhotos.length > 0
          ? 'Foto removida da galeria do animal.'
          : 'Todas as fotos foram removidas.',
        user: operatorName,
        iconType: 'edit' as const
      };

      const updatedAnimal: Animal = {
        ...current,
        photoUrl: newPrimaryPath,
        photos: remainingPhotos.map((p) =>
          p.id === (primaryPhoto.is_primary && remainingPhotos.length > 0
            ? remainingPhotos.find((r) => r.storage_path === newPrimaryPath)?.id
            : p.id)
            ? { ...p, is_primary: true }
            : p
        ),
        history: [newHistoryEntry, ...current.history]
      };

      const { error: updateError } = await supabase
        .from('animals')
        .update(mapToDb(updatedAnimal))
        .eq('id', id);
      if (updateError) {
        console.error('[deleteAnimalPhoto] Supabase update error:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
        throw updateError;
      }

      showToast('Foto removida com sucesso.', 'success');
      return true;
    } catch (err: any) {
      console.error('[deleteAnimalPhoto] Excecao:', err);
      showToast('Erro ao remover foto: ' + (err.message || err), 'error');
      return false;
    }
  };

  const deleteSpecificPhoto = async (animalId: string, photoId: string): Promise<boolean> => {
    const current = await resolveAnimal(animalId);
    if (!current) return false;

    const currentPhotos = getPhotosByAnimal(animalId);
    const targetPhoto = currentPhotos.find((p) => p.id === photoId);
    if (!targetPhoto) return false;

    // Don't allow deleting the last photo via this method
    if (currentPhotos.length === 1) {
      return deleteAnimalPhoto(animalId);
    }

    try {
      // Remove from storage
      const { error: removeError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .remove([targetPhoto.storage_path]);
      if (removeError) throw removeError;

      // Remove from photos table
      const { error: deleteError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);
      if (deleteError) throw deleteError;

      // Update local state
      const remainingPhotos = currentPhotos.filter((p) => p.id !== photoId);
      setAllPhotos((prev) => prev.filter((p) => p.id !== photoId));

      // If deleted photo was primary, make the newest remaining one primary
      let newPrimaryPath = current.photoUrl || '';
      if (targetPhoto.is_primary && remainingPhotos.length > 0) {
        const sortedRemaining = [...remainingPhotos].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const newPrimary = sortedRemaining[0];
        newPrimaryPath = newPrimary.storage_path;

        await supabase
          .from('photos')
          .update({ is_primary: true })
          .eq('id', newPrimary.id);

        setAllPhotos((prev) =>
          prev.map((p) => (p.id === newPrimary.id ? { ...p, is_primary: true } : p))
        );
      }

      // Update animal record
      pushUndoSnapshot(current);

      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const newHistoryEntry = {
        id: 'hist-' + Date.now(),
        date: formattedDate,
        title: 'Foto removida da galeria',
        description: 'Uma foto foi removida da galeria do animal.',
        user: operatorName,
        iconType: 'edit' as const
      };

      const updatedAnimal: Animal = {
        ...current,
        photoUrl: newPrimaryPath,
        photos: remainingPhotos,
        history: [newHistoryEntry, ...current.history]
      };

      const { error: updateError } = await supabase
        .from('animals')
        .update(mapToDb(updatedAnimal))
        .eq('id', animalId);
      if (updateError) {
        console.error('[deleteSpecificPhoto] Supabase update error:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
        throw updateError;
      }

      showToast('Foto removida com sucesso.', 'success');
      return true;
    } catch (err: any) {
      console.error('[deleteSpecificPhoto] Excecao:', err);
      showToast('Erro ao remover foto: ' + (err.message || err), 'error');
      return false;
    }
  };

  const setPrimaryPhoto = async (animalId: string, photoId: string): Promise<boolean> => {
    const current = await resolveAnimal(animalId);
    if (!current) return false;

    const currentPhotos = getPhotosByAnimal(animalId);
    const targetPhoto = currentPhotos.find((p) => p.id === photoId);
    if (!targetPhoto) return false;

    try {
      // Unset current primary
      const currentPrimary = currentPhotos.find((p) => p.is_primary);
      if (currentPrimary && currentPrimary.id !== photoId) {
        await supabase
          .from('photos')
          .update({ is_primary: false })
          .eq('id', currentPrimary.id);
      }

      // Set new primary
      await supabase
        .from('photos')
        .update({ is_primary: true })
        .eq('id', photoId);

      // Update local state
      setAllPhotos((prev) =>
        prev.map((p) => {
          if (p.animal_id !== animalId) return p;
          return { ...p, is_primary: p.id === photoId };
        })
      );

      // Update animal's photo_url
      pushUndoSnapshot(current);

      const updatedAnimal: Animal = {
        ...current,
        photoUrl: targetPhoto.storage_path,
        photos: currentPhotos.map((p) => ({ ...p, is_primary: p.id === photoId }))
      };

      const { error: updateError } = await supabase
        .from('animals')
        .update(mapToDb(updatedAnimal))
        .eq('id', animalId);
      if (updateError) {
        console.error('[setPrimaryPhoto] Supabase update error:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
        throw updateError;
      }

      showToast('Foto principal atualizada.', 'success');
      return true;
    } catch (err: any) {
      console.error('[setPrimaryPhoto] Excecao:', err);
      showToast('Erro ao definir foto principal: ' + (err.message || err), 'error');
      return false;
    }
  };

  return (
    <AnimalContext.Provider
      value={{
        animals,
        activeTab,
        setActiveTab,
        selectedAnimalId,
        setSelectedAnimalId,
        locationFilter,
        setLocationFilter,
        toasts,
        showToast,
        removeToast,
        loading,
        dashboardFilters,
        setDashboardFilters,
        resultsList,
        resultsTitle,
        openResultsList,
        clearResultsList,
        addAnimal,
        updateAnimal,
        changeLocation,
        registerAdoption,
        registerDeath,
        undoLastAction,
        deleteAnimal,
        uploadAnimalPhoto,
        deleteAnimalPhoto,
        deleteSpecificPhoto,
        setPrimaryPhoto,
        getPhotosByAnimal,
        getAnimalById,
        navigateToAnimal,
        navigateToLocationVisualization
      }}
    >
      {children}
    </AnimalContext.Provider>
  );
};

export const useAnimalContext = () => {
  const context = useContext(AnimalContext);
  if (!context) {
    throw new Error('useAnimalContext must be used within an AnimalProvider');
  }
  return context;
};
