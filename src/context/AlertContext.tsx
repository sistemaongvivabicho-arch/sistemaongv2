import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './AuthContext';
import { Alert, AlertPriority, AlertRecipient, AlertStatus } from '../types/alerts';

interface AlertContextType {
  alerts: Alert[];
  unreadCount: number;
  loading: boolean;
  fetchAlerts: () => Promise<void>;
  createAlert: (data: {
    title: string;
    message: string;
    priority: AlertPriority;
    recipient: AlertRecipient;
    expires_at?: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
  updateAlert: (id: string, data: Partial<Pick<Alert, 'title' | 'message' | 'priority' | 'recipient' | 'expires_at' | 'status'>>) => Promise<boolean>;
  deleteAlert: (id: string) => Promise<boolean>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  generateReminders: () => Promise<void>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const mapRow = (row: any): Alert => ({
    id: row.id,
    title: row.title,
    message: row.message,
    priority: row.priority,
    recipient: row.recipient,
    author_name: row.author_name,
    author_role: row.author_role,
    created_at: row.created_at,
    expires_at: row.expires_at,
    status: row.status,
    is_read: row.is_read,
    is_reminder: row.is_reminder
  });

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setAlerts((data || []).map(mapRow));
    } catch (err) {
      console.error('[Alerts] Falha ao buscar avisos:', err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAlert = useCallback(async (data: {
    title: string;
    message: string;
    priority: AlertPriority;
    recipient: AlertRecipient;
    expires_at?: string | null;
  }): Promise<{ success: boolean; error?: string }> => {
    const userName = profile?.name || 'Sistema';
    const userRole = profile?.role || 'common';

    try {
      const { data: insertData, error } = await supabase.from('alerts').insert({
        title: data.title,
        message: data.message,
        priority: data.priority,
        recipient: data.recipient,
        author_name: userName,
        author_role: userRole,
        expires_at: data.expires_at || null,
        status: 'ativo',
        is_read: false,
        is_reminder: false
      }).select();

      if (error) {
        console.error('[Alerts] Supabase error:', error.message, error.details, error.hint);
        return { success: false, error: error.message };
      }

      await fetchAlerts();
      return { success: true };
    } catch (err: any) {
      console.error('[Alerts] Falha ao criar aviso:', err);
      return { success: false, error: err.message || 'Erro desconhecido' };
    }
  }, [profile, fetchAlerts]);

  const updateAlert = useCallback(async (id: string, data: Partial<Pick<Alert, 'title' | 'message' | 'priority' | 'recipient' | 'expires_at' | 'status'>>): Promise<boolean> => {
    try {
      const { error } = await supabase.from('alerts').update(data).eq('id', id);
      if (error) throw error;
      await fetchAlerts();
      return true;
    } catch (err) {
      console.error('[Alerts] Falha ao atualizar aviso:', err);
      return false;
    }
  }, [fetchAlerts]);

  const deleteAlert = useCallback(async (id: string): Promise<boolean> => {
    const alertToDelete = alerts.find((a) => a.id === id);
    try {
      const { error } = await supabase.from('alerts').delete().eq('id', id);
      if (error) throw error;

      // Registrar exclusão no módulo de auditoria
      const userName = profile?.name || 'Sistema';
      const userRole = profile?.role || 'common';
      await supabase.from('audit_logs').insert({
        user_name: userName,
        user_role: userRole,
        animal_id: '00000000-0000-0000-0000-000000000000',
        animal_name: alertToDelete?.title || 'Aviso',
        action_type: 'exclusao_aviso',
        description: `Aviso "${alertToDelete?.title || 'desconhecido'}" foi excluído por ${userName}.`,
        details: null
      });

      await fetchAlerts();
      return true;
    } catch (err) {
      console.error('[Alerts] Falha ao excluir aviso:', err);
      return false;
    }
  }, [alerts, profile, fetchAlerts]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await supabase.from('alerts').update({ is_read: true }).eq('id', id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    } catch (err) {
      console.error('[Alerts] Falha ao marcar como lido:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await supabase.from('alerts').update({ is_read: true }).eq('is_read', false);
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    } catch (err) {
      console.error('[Alerts] Falha ao marcar todos como lidos:', err);
    }
  }, []);

  const generateReminders = useCallback(async () => {
    try {
      const { data: animals, error } = await supabase
        .from('animals')
        .select('id, name, species, entry_date, current_location, status, castration_scheduled_date, vaccination_due_date, castrado');

      if (error || !animals) return;

      const now = new Date();
      const remindersToCreate: any[] = [];
      const userName = profile?.name || 'Sistema';
      const userRole = profile?.role || 'common';

      for (const animal of animals) {
        if (!animal) continue;

        // Animais em triagem há mais de 15 dias
        if (animal.current_location === 'triagem' && animal.entry_date) {
          const entryParts = animal.entry_date.split('/');
          if (entryParts.length === 3) {
            const entryDate = new Date(`${entryParts[2]}-${entryParts[1]}-${entryParts[0]}`);
            const daysSince = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince > 15) {
              remindersToCreate.push({
                title: `Triagem prolongada: ${animal.name}`,
                message: `${animal.name} está na triagem há ${daysSince} dias. Avalie a situação.`,
                priority: 'media' as AlertPriority,
                recipient: 'veterinaria' as AlertRecipient,
                author_name: userName,
                author_role: userRole,
                status: 'ativo',
                is_read: false,
                is_reminder: true
              });
            }
          }
        }

        // Castrações agendadas para hoje
        if (animal.castration_scheduled_date) {
          const schedParts = animal.castration_scheduled_date.split('/');
          if (schedParts.length === 3) {
            const schedDate = new Date(`${schedParts[2]}-${schedParts[1]}-${schedParts[0]}`);
            const isToday = schedDate.toDateString() === now.toDateString();
            if (isToday) {
              remindersToCreate.push({
                title: `Castração hoje: ${animal.name}`,
                message: `${animal.name} tem castração agendada para hoje.`,
                priority: 'alta' as AlertPriority,
                recipient: 'veterinaria' as AlertRecipient,
                author_name: userName,
                author_role: userRole,
                status: 'ativo',
                is_read: false,
                is_reminder: true
              });
            }
          }
        }

        // Vacinas vencidas
        if (animal.vaccination_due_date) {
          const dueParts = animal.vaccination_due_date.split('/');
          if (dueParts.length === 3) {
            const dueDate = new Date(`${dueParts[2]}-${dueParts[1]}-${dueParts[0]}`);
            if (dueDate < now) {
              remindersToCreate.push({
                title: `Vacina vencida: ${animal.name}`,
                message: `${animal.name} tem vacina com data de vencimento em ${animal.vaccination_due_date}.`,
                priority: 'alta' as AlertPriority,
                recipient: 'veterinaria' as AlertRecipient,
                author_name: userName,
                author_role: userRole,
                status: 'ativo',
                is_read: false,
                is_reminder: true
              });
            }
          }
        }

        // Internações acima de 30 dias
        if (
          (animal.current_location === 'internacao_gatos' || animal.current_location === 'internacao_caes') &&
          animal.entry_date
        ) {
          const entryParts = animal.entry_date.split('/');
          if (entryParts.length === 3) {
            const entryDate = new Date(`${entryParts[2]}-${entryParts[1]}-${entryParts[0]}`);
            const daysSince = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince > 30) {
              remindersToCreate.push({
                title: `Internação prolongada: ${animal.name}`,
                message: `${animal.name} está internado(a) há ${daysSince} dias.`,
                priority: 'media' as AlertPriority,
                recipient: 'veterinaria' as AlertRecipient,
                author_name: userName,
                author_role: userRole,
                status: 'ativo',
                is_read: false,
                is_reminder: true
              });
            }
          }
        }
      }

      if (remindersToCreate.length > 0) {
        await supabase.from('alerts').insert(remindersToCreate);
      }
    } catch (err) {
      console.error('[Alerts] Falha ao gerar lembretes:', err);
    }
  }, [profile]);

  // Verificar se a tabela alerts existe e se o usuário tem acesso
  useEffect(() => {
    if (profile) {
      const diagnose = async () => {
        try {
          const { error: tableCheck } = await supabase.from('alerts').select('id').limit(1);
          if (tableCheck) {
            console.error('[Alerts][DIAG] Tabela alerts não existe ou sem acesso:', tableCheck.message);
          } else {
            console.log('[Alerts][DIAG] Tabela alerts OK');
          }

          const { data: profileCheck, error: profileError } = await supabase
            .from('profiles')
            .select('role, status')
            .eq('id', profile.id)
            .single();

          if (profileError) {
            console.error('[Alerts][DIAG] Não conseguiu ler perfil:', profileError.message);
          } else {
            console.log('[Alerts][DIAG] Perfil do usuário:', profileCheck);
            if (profileCheck.role !== 'admin') {
              console.warn('[Alerts][AVISO] Usuário NÃO é admin. role =', profileCheck.role, '. A política INSERT requer role = admin.');
            }
          }
        } catch (e) {
          console.error('[Alerts][DIAG] Erro na verificação:', e);
        }
      };
      diagnose();
    }
  }, [profile]);

  // Buscar avisos ao montar e gerar lembretes
  useEffect(() => {
    if (profile) {
      fetchAlerts();
      generateReminders();
    }
  }, [profile, fetchAlerts, generateReminders]);

  const unreadCount = alerts.filter((a) => !a.is_read && a.status === 'ativo').length;

  return (
    <AlertContext.Provider value={{
      alerts,
      unreadCount,
      loading,
      fetchAlerts,
      createAlert,
      updateAlert,
      deleteAlert,
      markAsRead,
      markAllAsRead,
      generateReminders
    }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
