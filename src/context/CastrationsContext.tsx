import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useAudit } from './AuditContext';
import { supabase } from './lib/supabase';
import {
  CastrationSchedule,
  CastrationStatus,
  CastrationHistoryEntry
} from '../types/castrations';

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
  }) => Promise<CastrationResult>;
  updateSchedule: (id: string, data: Partial<Pick<CastrationSchedule, 'scheduledDate' | 'veterinarian' | 'notes'>>) => Promise<CastrationResult>;
  reschedule: (id: string, newDate: string, reason: string) => Promise<CastrationResult>;
  cancelSchedule: (id: string, reason: string) => Promise<CastrationResult>;
  confirmSchedule: (id: string) => Promise<CastrationResult>;
  completeSchedule: (id: string, performedDate: string) => Promise<CastrationResult>;
  deleteSchedule: (id: string) => Promise<CastrationResult>;
  getScheduleById: (id: string) => CastrationSchedule | undefined;
  getSchedulesForAnimal: (animalId: string) => CastrationSchedule[];
}

const CastrationsContext = createContext<CastrationsContextType | undefined>(undefined);

function mapFromDb(row: any): CastrationSchedule {
  return {
    id: row.id,
    animalId: row.animal_id,
    animalName: row.animal_name,
    animalSpecies: row.animal_species,
    scheduledDate: row.scheduled_date,
    performedDate: row.performed_date || undefined,
    veterinarian: row.veterinarian,
    notes: row.notes || '',
    status: row.status,
    createdAt: row.created_at,
    createdBy: row.created_by,
    createdByRole: row.created_by_role,
    updatedAt: row.updated_at || undefined,
    updatedBy: row.updated_by || undefined,
    cancelReason: row.cancel_reason || undefined,
    history: row.history || []
  };
}

function mapToDb(schedule: Omit<CastrationSchedule, 'id' | 'createdAt' | 'createdBy' | 'createdByRole' | 'history'> & { id?: string }): any {
  return {
    id: schedule.id || crypto.randomUUID(),
    animal_id: schedule.animalId,
    animal_name: schedule.animalName,
    animal_species: schedule.animalSpecies,
    scheduled_date: schedule.scheduledDate,
    performed_date: schedule.performedDate || null,
    veterinarian: schedule.veterinarian,
    notes: schedule.notes || '',
    status: schedule.status,
    cancel_reason: schedule.cancelReason || null
  };
}

export const CastrationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const { addAuditLog } = useAudit();
  const [schedules, setSchedules] = useState<CastrationSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('castration_schedules')
          .select('*')
          .order('scheduled_date', { ascending: false });

        if (error) {
          console.error('[CastrationsContext] Error loading schedules:', error);
          setSchedules([]);
        } else {
          setSchedules((data || []).map(mapFromDb));
        }
      } catch (err) {
        console.error('[CastrationsContext] Exception loading schedules:', err);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
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

  const createSchedule = useCallback(async (data: {
    animalId: string;
    animalName: string;
    animalSpecies: string;
    scheduledDate: string;
    veterinarian: string;
    notes: string;
  }): Promise<CastrationResult> => {
    const userName = profile?.name || 'Sistema';
    const historyEntry = makeHistoryEntry('criacao', `${userName} agendou castracao para ${data.animalName} em ${data.scheduledDate}`);

    const dbRow = {
      id: crypto.randomUUID(),
      animal_id: data.animalId,
      animal_name: data.animalName,
      animal_species: data.animalSpecies,
      scheduled_date: data.scheduledDate,
      performed_date: null,
      veterinarian: data.veterinarian,
      notes: data.notes,
      status: 'agendada' as CastrationStatus,
      created_at: new Date().toISOString(),
      created_by: userName,
      created_by_role: profile?.role || 'common',
      history: [historyEntry]
    };

    try {
      const { error } = await supabase.from('castration_schedules').insert(dbRow);
      if (error) {
        console.error('[CastrationsContext] Create error:', error);
        return { success: false, error: error.message };
      }

      const newSchedule = mapFromDb(dbRow);
      setSchedules(prev => [newSchedule, ...prev]);

      addAuditLog(
        'agendamento_castracao',
        `${userName} agendou castracao para "${data.animalName}" em ${data.scheduledDate}. Veterinario: ${data.veterinarian}.`,
        data.animalId,
        data.animalName
      );

      return { success: true, message: 'Castracao agendada com sucesso.' };
    } catch (err: any) {
      console.error('[CastrationsContext] Create exception:', err);
      return { success: false, error: err.message };
    }
  }, [profile, addAuditLog, makeHistoryEntry]);

  const updateSchedule = useCallback(async (id: string, data: Partial<Pick<CastrationSchedule, 'scheduledDate' | 'veterinarian' | 'notes'>>): Promise<CastrationResult> => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return { success: false, error: 'Agendamento nao encontrado.' };

    const userName = profile?.name || 'Sistema';
    const previousData: Partial<CastrationSchedule> = {};
    if (data.scheduledDate && data.scheduledDate !== schedule.scheduledDate) previousData.scheduledDate = schedule.scheduledDate;
    if (data.veterinarian && data.veterinarian !== schedule.veterinarian) previousData.veterinarian = schedule.veterinarian;
    if (data.notes !== undefined && data.notes !== schedule.notes) previousData.notes = schedule.notes;

    const historyEntry = makeHistoryEntry('edicao', `${userName} editou agendamento de ${schedule.animalName}`, previousData);
    const newHistory = [...schedule.history, historyEntry];

    try {
      const { error } = await supabase
        .from('castration_schedules')
        .update({
          scheduled_date: data.scheduledDate || schedule.scheduledDate,
          veterinarian: data.veterinarian || schedule.veterinarian,
          notes: data.notes !== undefined ? data.notes : schedule.notes,
          updated_at: new Date().toISOString(),
          updated_by: userName,
          history: newHistory
        })
        .eq('id', id);

      if (error) {
        console.error('[CastrationsContext] Update error:', error);
        return { success: false, error: error.message };
      }

      setSchedules(prev => prev.map(s => s.id === id ? {
        ...s,
        ...data,
        updatedAt: new Date().toISOString(),
        updatedBy: userName,
        history: newHistory
      } : s));

      addAuditLog(
        'alteracao_agendamento',
        `${userName} editou agendamento de "${schedule.animalName}".${data.scheduledDate ? ` Nova data: ${data.scheduledDate}.` : ''}`,
        schedule.animalId,
        schedule.animalName
      );

      return { success: true, message: 'Agendamento atualizado com sucesso.' };
    } catch (err: any) {
      console.error('[CastrationsContext] Update exception:', err);
      return { success: false, error: err.message };
    }
  }, [schedules, profile, addAuditLog, makeHistoryEntry]);

  const reschedule = useCallback(async (id: string, newDate: string, reason: string): Promise<CastrationResult> => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return { success: false, error: 'Agendamento nao encontrado.' };

    const userName = profile?.name || 'Sistema';
    const historyEntry = makeHistoryEntry('reagendamento', `${userName} reagendou castracao de ${schedule.animalName} de ${schedule.scheduledDate} para ${newDate}. Motivo: ${reason}`, { scheduledDate: schedule.scheduledDate });
    const newHistory = [...schedule.history, historyEntry];

    try {
      const { error } = await supabase
        .from('castration_schedules')
        .update({
          scheduled_date: newDate,
          status: 'reagendada',
          updated_at: new Date().toISOString(),
          updated_by: userName,
          history: newHistory
        })
        .eq('id', id);

      if (error) {
        console.error('[CastrationsContext] Reschedule error:', error);
        return { success: false, error: error.message };
      }

      setSchedules(prev => prev.map(s => s.id === id ? {
        ...s,
        scheduledDate: newDate,
        status: 'reagendada' as CastrationStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: userName,
        history: newHistory
      } : s));

      addAuditLog(
        'alteracao_agendamento',
        `${userName} reagendou castracao de "${schedule.animalName}" de ${schedule.scheduledDate} para ${newDate}. Motivo: ${reason}`,
        schedule.animalId,
        schedule.animalName
      );

      return { success: true, message: 'Castracao reagendada com sucesso.' };
    } catch (err: any) {
      console.error('[CastrationsContext] Reschedule exception:', err);
      return { success: false, error: err.message };
    }
  }, [schedules, profile, addAuditLog, makeHistoryEntry]);

  const cancelSchedule = useCallback(async (id: string, reason: string): Promise<CastrationResult> => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return { success: false, error: 'Agendamento nao encontrado.' };

    const userName = profile?.name || 'Sistema';
    const historyEntry = makeHistoryEntry('cancelamento', `${userName} cancelou castracao de ${schedule.animalName}. Motivo: ${reason}`);
    const newHistory = [...schedule.history, historyEntry];

    try {
      const { error } = await supabase
        .from('castration_schedules')
        .update({
          status: 'cancelada',
          cancel_reason: reason,
          updated_at: new Date().toISOString(),
          updated_by: userName,
          history: newHistory
        })
        .eq('id', id);

      if (error) {
        console.error('[CastrationsContext] Cancel error:', error);
        return { success: false, error: error.message };
      }

      setSchedules(prev => prev.map(s => s.id === id ? {
        ...s,
        status: 'cancelada' as CastrationStatus,
        cancelReason: reason,
        updatedAt: new Date().toISOString(),
        updatedBy: userName,
        history: newHistory
      } : s));

      addAuditLog(
        'exclusao_agendamento',
        `${userName} cancelou castracao de "${schedule.animalName}". Motivo: ${reason}`,
        schedule.animalId,
        schedule.animalName
      );

      return { success: true, message: 'Castracao cancelada.' };
    } catch (err: any) {
      console.error('[CastrationsContext] Cancel exception:', err);
      return { success: false, error: err.message };
    }
  }, [schedules, profile, addAuditLog, makeHistoryEntry]);

  const confirmSchedule = useCallback(async (id: string): Promise<CastrationResult> => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return { success: false, error: 'Agendamento nao encontrado.' };

    const userName = profile?.name || 'Sistema';
    const historyEntry = makeHistoryEntry('confirmacao', `${userName} confirmou realizacao da castracao de ${schedule.animalName}`);
    const newHistory = [...schedule.history, historyEntry];

    try {
      const { error } = await supabase
        .from('castration_schedules')
        .update({
          status: 'confirmada',
          updated_at: new Date().toISOString(),
          updated_by: userName,
          history: newHistory
        })
        .eq('id', id);

      if (error) {
        console.error('[CastrationsContext] Confirm error:', error);
        return { success: false, error: error.message };
      }

      setSchedules(prev => prev.map(s => s.id === id ? {
        ...s,
        status: 'confirmada' as CastrationStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: userName,
        history: newHistory
      } : s));

      addAuditLog(
        'alteracao_agendamento',
        `${userName} confirmou castracao de "${schedule.animalName}" para ${schedule.scheduledDate}.`,
        schedule.animalId,
        schedule.animalName
      );

      return { success: true, message: 'Castracao confirmada com sucesso.' };
    } catch (err: any) {
      console.error('[CastrationsContext] Confirm exception:', err);
      return { success: false, error: err.message };
    }
  }, [schedules, profile, addAuditLog, makeHistoryEntry]);

  const completeSchedule = useCallback(async (id: string, performedDate: string): Promise<CastrationResult> => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return { success: false, error: 'Agendamento nao encontrado.' };

    const userName = profile?.name || 'Sistema';
    const historyEntry = makeHistoryEntry('realizacao', `${userName} registrou realizacao da castracao de ${schedule.animalName} em ${performedDate}`);
    const newHistory = [...schedule.history, historyEntry];

    try {
      const { error } = await supabase
        .from('castration_schedules')
        .update({
          status: 'realizada',
          performed_date: performedDate,
          updated_at: new Date().toISOString(),
          updated_by: userName,
          history: newHistory
        })
        .eq('id', id);

      if (error) {
        console.error('[CastrationsContext] Complete error:', error);
        return { success: false, error: error.message };
      }

      setSchedules(prev => prev.map(s => s.id === id ? {
        ...s,
        status: 'realizada' as CastrationStatus,
        performedDate,
        updatedAt: new Date().toISOString(),
        updatedBy: userName,
        history: newHistory
      } : s));

      addAuditLog(
        'agendamento_castracao',
        `${userName} registrou realizacao da castracao de "${schedule.animalName}" em ${performedDate}.`,
        schedule.animalId,
        schedule.animalName
      );

      return { success: true, message: 'Castracao registrada com sucesso.' };
    } catch (err: any) {
      console.error('[CastrationsContext] Complete exception:', err);
      return { success: false, error: err.message };
    }
  }, [schedules, profile, addAuditLog, makeHistoryEntry]);

  const deleteSchedule = useCallback(async (id: string): Promise<CastrationResult> => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return { success: false, error: 'Agendamento nao encontrado.' };

    const userName = profile?.name || 'Sistema';

    try {
      const { error } = await supabase
        .from('castration_schedules')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[CastrationsContext] Delete error:', error);
        return { success: false, error: error.message };
      }

      setSchedules(prev => prev.filter(s => s.id !== id));

      addAuditLog(
        'exclusao_agendamento',
        `${userName} excluiu agendamento de castracao de "${schedule.animalName}" (data: ${schedule.scheduledDate}).`,
        schedule.animalId,
        schedule.animalName
      );

      return { success: true, message: 'Agendamento excluido com sucesso.' };
    } catch (err: any) {
      console.error('[CastrationsContext] Delete exception:', err);
      return { success: false, error: err.message };
    }
  }, [schedules, profile, addAuditLog]);

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
