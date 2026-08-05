import React, { useState, useEffect } from 'react';
import { useAlerts } from '../../context/AlertContext';
import { X, Bell, AlertTriangle, Check } from 'lucide-react';
import { Alert, AlertPriority, AlertRecipient, PRIORITY_LABELS, RECIPIENT_LABELS } from '../../types/alerts';

interface NewAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  editAlert: Alert | null;
}

export const NewAlertModal: React.FC<NewAlertModalProps> = ({ isOpen, onClose, editAlert }) => {
  const { createAlert, updateAlert } = useAlerts();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<AlertPriority>('media');
  const [recipient, setRecipient] = useState<AlertRecipient>('todos');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editAlert;

  useEffect(() => {
    if (editAlert) {
      setTitle(editAlert.title);
      setMessage(editAlert.message);
      setPriority(editAlert.priority);
      setRecipient(editAlert.recipient);
      setExpiresAt(editAlert.expires_at ? editAlert.expires_at.split('T')[0] : '');
    } else {
      setTitle('');
      setMessage('');
      setPriority('media');
      setRecipient('todos');
      setExpiresAt('');
    }
    setSuccess(false);
    setError(null);
  }, [editAlert, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim()) {
      setError('Informe o título do aviso.');
      return;
    }
    if (!message.trim()) {
      setError('Informe a mensagem do aviso.');
      return;
    }

    setLoading(true);

    const data = {
      title: title.trim(),
      message: message.trim(),
      priority,
      recipient,
      expires_at: expiresAt || null
    };

    let result: { success: boolean; error?: string };
    if (isEditing) {
      const updateResult = await updateAlert(editAlert.id, data);
      result = { success: updateResult, error: updateResult ? undefined : 'Erro ao atualizar aviso.' };
    } else {
      result = await createAlert(data);
    }

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setError(result.error || (isEditing ? 'Erro ao atualizar aviso.' : 'Erro ao criar aviso.'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Editar Aviso' : 'Novo Aviso'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isEditing ? 'Atualize as informações do aviso' : 'Preencha os campos para criar um novo aviso'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              {isEditing ? 'Aviso atualizado com sucesso!' : 'Aviso criado com sucesso!'}
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Título */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Título *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião de equipe"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Mensagem *
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva o aviso..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Prioridade */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Prioridade
            </label>
            <div className="flex gap-2">
              {(['baixa', 'media', 'alta'] as AlertPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    priority === p
                      ? p === 'alta'
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 ring-2 ring-rose-500/30'
                        : p === 'media'
                          ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/30'
                          : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Destinatário */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Destinatário
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['todos', 'administracao', 'veterinaria', 'recepcao'] as AlertRecipient[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRecipient(r)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    recipient === r
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {RECIPIENT_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Data de expiração */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Data de expiração (opcional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50"
          >
            {loading
              ? isEditing ? 'Atualizando...' : 'Criando...'
              : isEditing ? 'Atualizar Aviso' : 'Criar Aviso'
            }
          </button>
        </form>
      </div>
    </div>
  );
};
