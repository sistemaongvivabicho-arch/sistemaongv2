import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useAudit } from './AuditContext';
import {
  CastrationSchedule,
  CastrationStatus,
  CastrationHistoryEntry
} from '../types/castrations';

const STORAGE_KEY = 'vivabicho_castration_schedules';

export interface CastrationResult {
  success: boolean;
  error?: string;
  message?: string;
}

interface CastrationsContextType {
  schedules: CastrationSchedule[];
  loading: boolean;
  createSchedule: (data: {
    animalId: string;
    animalName: string;
    animalSpecies: string;
    scheduledDate: string;
    veterinarian: string;
    notes: string;
  }) => CastrationResult;
  updateSchedule: (id: string, data: Partial<Pick<CastrationSchedule, 'scheduledDate' | 'veterinarian' | 'notes'>>) => CastrationResult;
  reschedule: (id: string, newDate: string, reason: string) => CastrationResult;
  cancelSchedule: (id: string, reason: string) => CastrationResult;
  confirmSchedule: (id: string) => CastrationResult;
  completeSchedule: (id: string, performedDate: string) => CastrationResult;
  deleteSchedule: (id: string) => CastrationResult;
  getScheduleById: (id: string) => CastrationSchedule | undefined;
  getSchedulesForAnimal: (animalId: string) => CastrationSchedule[];
}

const CastrationsContext = createContext<CastrationsContextType | undefined>(undefined);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function loadFromStorage(): CastrationSchedule[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(schedules: CastrationSchedule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}

export const CastrationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const { addAuditLog } = useAudit();
  const [schedules, setSchedules] = useState<CastrationSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSchedules(loadFromStorage());
    setLoading(false);
  }, []);

  const persist = useCallback((newSchedules: CastrationSchedule[]) => {
    setSchedules(newSchedules);
    saveToStorage(newSchedules);
  }, []);

  const makeHistoryEntry = useCallback((
    action: CastrationHistoryEntry['action'],
    description: string,
    previousData?: Partial<CastrationSchedule>
  ): CastrationHistoryEntry => ({
    timestamp: new Date().toISOString(),
    action,
    user: profile?.name || 'Sistema',
    userRole: profile?.role || 'common',
    description,
    previousData
  }), [profile]);

  const createSchedule = useCallback((data: {
    animalId: string;
    animalName: string;
    animalSpecies: string;
    scheduledDate: string;
    veterinarian: string;
    notes: string;
  }): CastrationResult => {
    const userName = profile?.name || 'Sistema';

    const newSchedule: CastrationSchedule = {
      id: generateId(),
      animalId: data.animalId,
      animalName: data.animalName,
      animalSpecies: data.animalSpecies,
      scheduledDate: data.scheduledDate,
      veterinarian: data.veterinarian,
      notes: data.notes,
      status: 'agendada',
      createdAt: new Date().toISOString(),
      createdBy: userName,
      createdByRole: profile?.role || 'common',
      history: [makeHistoryEntry('criacao', `${userName} agendou castração para ${data.animalName} em ${data.scheduledDate}`)]
    };

    persist([newSchedule, ...schedules]);

    addAuditLog(
      'agendamento_castracao',
      `${userName} agendou castração para "${data.animalName}" em ${data.scheduledDate}. Veterinário: ${data.veterinarian}.`,
      data.animalId,
      data.animalName
    );

    return { success: true, message: 'Castração agendada com sucesso.' };
  }, [schedules, persist, profile, addAuditLog, makeHistoryEntry]);

  const updateSchedule = useCallback((id: string, data: Partial<Pick<CastrationSchedule, 'scheduledDate' | 'veterinarian' | 'notes'>>): CastrationResult => {
    const index = schedules.findIndex(s => s.id === id);
    if (index === -1) return { success: false, error: 'Agendamento não encontrado.' };

    const schedule = schedules[index];
    const userName = profile?.name || 'Sistema';
    const previousData: Partial<CastrationSchedule> = {};

    if (data.scheduledDate && data.scheduledDate !== schedule.scheduledDate) {
      previousData.scheduledDate = schedule.scheduledDate;
    }
    if (data.veterinarian && data.veterinarian !== schedule.veterinarian) {
      previousData.veterinarian = schedule.veterinarian;
    }
    if (data.notes !== undefined && data.notes !== schedule.notes) {
      previousData.notes = schedule.notes;
    }

    const updated = {
      ...schedule,
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: userName,
      history: [...schedule.history, makeHistoryEntry('edicao', `${userName} editou agendamento de ${schedule.animalName}`, previousData)]
    };

    const newSchedules = [...schedules];
    newSchedules[index] = updated;
    persist(newSchedules);

    addAuditLog(
      'alteracao_agendamento',
      `${userName} editou agendamento de "${schedule.animalName}".${data.scheduledDate ? ` Nova data: ${data.scheduledDate}.` : ''}`,
      schedule.animalId,
      schedule.animalName
    );

    return { success: true, message: 'Agendamento atualizado com sucesso.' };
  }, [schedules, persist, profile, addAuditLog, makeHistoryEntry]);

  const reschedule = useCallback((id: string, newDate: string, reason: string): CastrationResult => {
    const index = schedules.findIndex(s => s.id === id);
    if (index === -1) return { success: false, error: 'Agendamento não encontrado.' };

    const schedule = schedules[index];
    const userName = profile?.name || 'Sistema';
    const previousDate = schedule.scheduledDate;

    const updated = {
      ...schedule,
      scheduledDate: newDate,
      status: 'reagendada' as CastrationStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: userName,
      history: [...schedule.history, makeHistoryEntry('reagendamento', `${userName} reagendou castração de ${schedule.animalName} de ${previousDate} para ${newDate}. Motivo: ${reason}`, { scheduledDate: previousDate })]
    };

    const newSchedules = [...schedules];
    newSchedules[index] = updated;
    persist(newSchedules);

    addAuditLog(
      'alteracao_agendamento',
      `${userName} reagendou castração de "${schedule.animalName}" de ${previousDate} para ${newDate}. Motivo: ${reason}`,
      schedule.animalId,
      schedule.animalName
    );

    return { success: true, message: 'Castração reagendada com sucesso.' };
  }, [schedules, persist, profile, addAuditLog, makeHistoryEntry]);

  const cancelSchedule = useCallback((id: string, reason: string): CastrationResult => {
    const index = schedules.findIndex(s => s.id === id);
    if (index === -1) return { success: false, error: 'Agendamento não encontrado.' };

    const schedule = schedules[index];
    const userName = profile?.name || 'Sistema';

    const updated = {
      ...schedule,
      status: 'cancelada' as CastrationStatus,
      cancelReason: reason,
      updatedAt: new Date().toISOString(),
      updatedBy: userName,
      history: [...schedule.history, makeHistoryEntry('cancelamento', `${userName} cancelou castração de ${schedule.animalName}. Motivo: ${reason}`)]
    };

    const newSchedules = [...schedules];
    newSchedules[index] = updated;
    persist(newSchedules);

    addAuditLog(
      'exclusao_agendamento',
      `${userName} cancelou castração de "${schedule.animalName}". Motivo: ${reason}`,
      schedule.animalId,
      schedule.animalName
    );

    return { success: true, message: 'Castração cancelada.' };
  }, [schedules, persist, profile, addAuditLog, makeHistoryEntry]);

  const confirmSchedule = useCallback((id: string): CastrationResult => {
    const index = schedules.findIndex(s => s.id === id);
    if (index === -1) return { success: false, error: 'Agendamento não encontrado.' };

    const schedule = schedules[index];
    const userName = profile?.name || 'Sistema';

    const updated = {
      ...schedule,
      status: 'confirmada' as CastrationStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: userName,
      history: [...schedule.history, makeHistoryEntry('confirmacao', `${userName} confirmou realização da castração de ${schedule.animalName}`)]
    };

    const newSchedules = [...schedules];
    newSchedules[index] = updated;
    persist(newSchedules);

    addAuditLog(
      'alteracao_agendamento',
      `${userName} confirmou castração de "${schedule.animalName}" para ${schedule.scheduledDate}.`,
      schedule.animalId,
      schedule.animalName
    );

    return { success: true, message: 'Castração confirmada com sucesso.' };
  }, [schedules, persist, profile, addAuditLog, makeHistoryEntry]);

  const completeSchedule = useCallback((id: string, performedDate: string): CastrationResult => {
    const index = schedules.findIndex(s => s.id === id);
    if (index === -1) return { success: false, error: 'Agendamento não encontrado.' };

    const schedule = schedules[index];
    const userName = profile?.name || 'Sistema';

    const updated = {
      ...schedule,
      status: 'realizada' as CastrationStatus,
      performedDate,
      updatedAt: new Date().toISOString(),
      updatedBy: userName,
      history: [...schedule.history, makeHistoryEntry('realizacao', `${userName} registrou realização da castração de ${schedule.animalName} em ${performedDate}`)]
    };

    const newSchedules = [...schedules];
    newSchedules[index] = updated;
    persist(newSchedules);

    addAuditLog(
      'agendamento_castracao',
      `${userName} registrou realização da castração de "${schedule.animalName}" em ${performedDate}.`,
      schedule.animalId,
      schedule.animalName
    );

    return { success: true, message: 'Castração registrada com sucesso.' };
  }, [schedules, persist, profile, addAuditLog, makeHistoryEntry]);

  const deleteSchedule = useCallback((id: string): CastrationResult => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return { success: false, error: 'Agendamento não encontrado.' };

    const userName = profile?.name || 'Sistema';

    persist(schedules.filter(s => s.id !== id));

    addAuditLog(
      'exclusao_agendamento',
      `${userName} excluiu agendamento de castração de "${schedule.animalName}" (data: ${schedule.scheduledDate}).`,
      schedule.animalId,
      schedule.animalName
    );

    return { success: true, message: 'Agendamento excluído com sucesso.' };
  }, [schedules, persist, profile, addAuditLog]);

  const getScheduleById = useCallback((id: string) => {
    return schedules.find(s => s.id === id);
  }, [schedules]);

  const getSchedulesForAnimal = useCallback((animalId: string) => {
    return schedules.filter(s => s.animalId === animalId);
  }, [schedules]);

  const value = useMemo(() => ({
    schedules,
    loading,
    createSchedule,
    updateSchedule,
    reschedule,
    cancelSchedule,
    confirmSchedule,
    completeSchedule,
    deleteSchedule,
    getScheduleById,
    getSchedulesForAnimal
  }), [
    schedules, loading,
    createSchedule, updateSchedule, reschedule, cancelSchedule,
    confirmSchedule, completeSchedule, deleteSchedule,
    getScheduleById, getSchedulesForAnimal
  ]);

  return (
    <CastrationsContext.Provider value={value}>
      {children}
    </CastrationsContext.Provider>
  );
};

export const useCastrations = () => {
  const ctx = useContext(CastrationsContext);
  if (!ctx) throw new Error('useCastrations must be used within CastrationsProvider');
  return ctx;
};
