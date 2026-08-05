import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './AuthContext';
import { AuditLogEntry, AuditActionType } from '../types/audit';

interface AuditContextType {
  addAuditLog: (
    actionType: AuditActionType,
    description: string,
    animalId?: string,
    animalName?: string,
    details?: string
  ) => Promise<void>;
  auditLogs: AuditLogEntry[];
  loading: boolean;
  fetchAuditLogs: (filters?: {
    searchTerm?: string;
    actionType?: AuditActionType | 'all';
    dateFrom?: string;
    dateTo?: string;
  }) => Promise<void>;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const addAuditLog = useCallback(
    async (
      actionType: AuditActionType,
      description: string,
      animalId?: string,
      animalName?: string,
      details?: string
    ) => {
      const userName = profile?.name || 'Sistema';
      const userRole = profile?.role || 'common';

      try {
        await supabase.from('audit_logs').insert({
          user_name: userName,
          user_role: userRole,
          animal_id: animalId || '00000000-0000-0000-0000-000000000000',
          animal_name: animalName || 'Sistema',
          action_type: actionType,
          description,
          details: details || null
        });
      } catch (err) {
        console.error('[Audit] Falha ao registrar log:', err);
      }
    },
    [profile]
  );

  const fetchAuditLogs = useCallback(
    async (filters?: {
      searchTerm?: string;
      actionType?: AuditActionType | 'all';
      dateFrom?: string;
      dateTo?: string;
    }) => {
      setLoading(true);
      try {
        let query = supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(500);

        if (filters?.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          query = query.or(`animal_name.ilike.%${term}%,user_name.ilike.%${term}%,description.ilike.%${term}%`);
        }

        if (filters?.actionType && filters.actionType !== 'all') {
          query = query.eq('action_type', filters.actionType);
        }

        if (filters?.dateFrom) {
          query = query.gte('timestamp', filters.dateFrom);
        }

        if (filters?.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          query = query.lte('timestamp', toDate.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        const mapped: AuditLogEntry[] = (data || []).map((row: any) => ({
          id: row.id,
          user_name: row.user_name,
          user_role: row.user_role,
          timestamp: row.timestamp,
          animal_id: row.animal_id,
          animal_name: row.animal_name,
          action_type: row.action_type,
          description: row.description,
          details: row.details || undefined
        }));

        setAuditLogs(mapped);
      } catch (err) {
        console.error('[Audit] Falha ao buscar logs:', err);
        setAuditLogs([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return (
    <AuditContext.Provider value={{ addAuditLog, auditLogs, loading, fetchAuditLogs }}>
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
};
