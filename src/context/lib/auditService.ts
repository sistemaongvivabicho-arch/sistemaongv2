import { supabase } from './supabase';
import { AuditActionType } from '../../types/audit';

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

export const auditService = {
  async log(
    actionType: AuditActionType,
    description: string,
    userName: string,
    userRole: string,
    details?: string,
    animalId?: string,
    animalName?: string
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        user_name: userName,
        user_role: userRole,
        animal_id: animalId || ZERO_UUID,
        animal_name: animalName || 'Sistema',
        action_type: actionType,
        description,
        details: details || null
      });
    } catch (err) {
      console.error('[AuditService] Falha ao registrar log:', err);
    }
  }
};
