import React, { useState } from 'react';
import { useAlerts } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  Plus,
  Trash2,
  Edit3,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Archive,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Alert,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  RECIPIENT_LABELS,
  STATUS_LABELS
} from '../../types/alerts';
import { NewAlertModal } from './NewAlertModal';
import { CentralDeAvisos } from '../dashboard/CentralDeAvisos';
import { OngeSummaryCard } from './OngeSummaryCard';

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return ts;
  }
}

interface AlertsViewProps {
  isModalOpen?: boolean;
  onModalClose?: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ isModalOpen, onModalClose }) => {
  const { alerts, loading, deleteAlert, markAsRead, markAllAsRead } = useAlerts();
  const { isAdmin } = useAuth();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Sincronizar estado externo (do Header) com estado interno
  React.useEffect(() => {
    if (isModalOpen) {
      setIsNewModalOpen(true);
      onModalClose?.();
    }
  }, [isModalOpen, onModalClose]);

  const handleDelete = async (alert: Alert) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir o aviso "${alert.title}"?`);
    if (!confirmed) return;
    await deleteAlert(alert.id);
  };

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setIsNewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsNewModalOpen(false);
    setEditingAlert(null);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterPriority !== 'all' && a.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (showUnreadOnly && a.is_read) return false;
    return true;
  });

  const activeAlerts = filteredAlerts.filter((a) => a.status === 'ativo');
  const otherAlerts = filteredAlerts.filter((a) => a.status !== 'ativo');

  return (
    <div className="space-y-6">
      {/* Resumo Geral da ONG */}
      <OngeSummaryCard />

      {/* Central de Avisos */}
      <CentralDeAvisos />

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Bell className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Avisos
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Central de comunicação interna da ONG
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm shadow-emerald-600/25 hover:shadow-md hover:shadow-emerald-600/30 transition-all active:scale-[0.98] shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Novo Aviso
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          >
            <option value="all">Todas as prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          >
            <option value="all">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="expirado">Expirados</option>
            <option value="arquivado">Arquivados</option>
          </select>

          <button
            onClick={() => setShowUnreadOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              showUnreadOnly
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            {showUnreadOnly ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            Não lidos
          </button>

          {alerts.some((a) => !a.is_read) && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Marcar todos como lidos
            </button>
          )}
        </div>
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-3">Carregando avisos...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center space-y-3">
            <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Nenhum aviso encontrado
            </p>
            <p className="text-sm text-slate-500">
              {isAdmin ? 'Clique em "Novo Aviso" para criar o primeiro aviso.' : 'Não há avisos no momento.'}
            </p>
          </div>
        ) : (
          <>
            {activeAlerts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  Ativos ({activeAlerts.length})
                </h3>
                {activeAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    isAdmin={isAdmin}
                    onEdit={() => handleEdit(alert)}
                    onDelete={() => handleDelete(alert)}
                    onMarkRead={() => markAsRead(alert.id)}
                  />
                ))}
              </div>
            )}

            {otherAlerts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  Anteriores ({otherAlerts.length})
                </h3>
                {otherAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    isAdmin={isAdmin}
                    onEdit={() => handleEdit(alert)}
                    onDelete={() => handleDelete(alert)}
                    onMarkRead={() => markAsRead(alert.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <NewAlertModal
        isOpen={isNewModalOpen}
        onClose={handleCloseModal}
        editAlert={editingAlert}
      />
    </div>
  );
};

// ---- Alert Card Component ----

interface AlertCardProps {
  alert: Alert;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMarkRead: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, isAdmin, onEdit, onDelete, onMarkRead }) => {
  const colors = PRIORITY_COLORS[alert.priority];
  const isExpired = alert.expires_at && new Date(alert.expires_at) < new Date();

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden transition-all ${
        !alert.is_read
          ? `${colors.border} ring-1 ring-${alert.priority === 'alta' ? 'rose' : alert.priority === 'media' ? 'amber' : 'blue'}-500/20`
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Priority dot */}
          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${colors.dot}`} />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className={`text-sm font-bold ${!alert.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                {alert.title}
              </h3>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                {PRIORITY_LABELS[alert.priority]}
              </span>
              {alert.is_reminder && (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                  Auto
                </span>
              )}
              {isExpired && (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                  Expirado
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              {alert.message}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3" />
                {alert.author_name}
                {alert.author_role === 'admin' && ' (Admin)'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimestamp(alert.created_at)}
              </span>
              <span className="font-semibold">
                Para: {RECIPIENT_LABELS[alert.recipient]}
              </span>
              {alert.expires_at && (
                <span className="inline-flex items-center gap-1">
                  <Archive className="w-3 h-3" />
                  Expira: {formatTimestamp(alert.expires_at)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {!alert.is_read && (
              <button
                onClick={onMarkRead}
                title="Marcar como lido"
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {isAdmin && (
              <>
                <button
                  onClick={onEdit}
                  title="Editar aviso"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  title="Excluir aviso"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
