import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package, Download, ExternalLink, FolderOpen, CheckCircle2, XCircle,
  Loader2, Clock, Trash2, Shield, HardDrive, AlertTriangle, Info
} from 'lucide-react';
import JSZip from 'jszip';
import { supabase } from '../../context/lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { auditService } from '../../context/lib/auditService';
import {
  BackupRecord, BACKUP_STATUS_LABELS, BACKUP_STATUS_COLORS,
  STORAGE_KEY_HISTORY, formatBytes, generateBackupFileName, formatDateTimeBR, getNextBackupText
} from '../../types/backup';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export const BackupView: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const [history, setHistory] = useState<BackupRecord[]>(() => loadFromStorage(STORAGE_KEY_HISTORY, []));
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { saveToStorage(STORAGE_KEY_HISTORY, history); }, [history]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const lastBackup = useMemo(() => {
    const success = history.filter(h => h.status === 'success');
    return success.length > 0 ? success[0] : null;
  }, [history]);

  const nextBackupText = useMemo(() => getNextBackupText(lastBackup?.date || null), [lastBackup]);

  // ========== GERAR BACKUP ==========
  const handleGenerateBackup = useCallback(async () => {
    if (!isAdmin) {
      showToast('Apenas administradores podem gerar backups.', 'error');
      return;
    }

    setIsBackingUp(true);
    const fileName = generateBackupFileName();
    const recordId = generateId();

    const progressRecord: BackupRecord = {
      id: recordId,
      fileName,
      date: new Date().toISOString(),
      sizeBytes: 0,
      status: 'error'
    };
    setHistory(prev => [progressRecord, ...prev]);

    try {
      const [animalsRes, profilesRes, auditRes, alertsRes, castrationsRes, photosRes] = await Promise.all([
        supabase.from('animals').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('audit_logs').select('*'),
        supabase.from('alerts').select('*'),
        supabase.from('castration_schedules').select('*'),
        supabase.from('photos').select('*')
      ]);

      if (animalsRes.error) throw new Error(`animals: ${animalsRes.error.message}`);
      if (profilesRes.error) throw new Error(`profiles: ${profilesRes.error.message}`);
      if (auditRes.error) throw new Error(`audit_logs: ${auditRes.error.message}`);
      if (alertsRes.error) throw new Error(`alerts: ${alertsRes.error.message}`);
      if (castrationsRes.error) throw new Error(`castration_schedules: ${castrationsRes.error.message}`);
      if (photosRes.error) throw new Error(`photos: ${photosRes.error.message}`);

      const castrationsData = castrationsRes.data || [];
      const photosData = photosRes.data || [];

      const now = new Date();
      const manifest = {
        system: 'ONG Viva Bicho v2',
        version: '3.0.0',
        organization: 'ONG Viva Bicho',
        exportedAt: now.toISOString(),
        exportedBy: profile?.name || 'Sistema',
        tables: {
          animals: (animalsRes.data || []).length,
          profiles: (profilesRes.data || []).length,
          audit_logs: (auditRes.data || []).length,
          alerts: (alertsRes.data || []).length,
          castration_schedules: castrationsData.length,
          photos: photosData.length
        }
      };

      const zip = new JSZip();
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      zip.file('animals.json', JSON.stringify(animalsRes.data || [], null, 2));
      zip.file('profiles.json', JSON.stringify(profilesRes.data || [], null, 2));
      zip.file('audit_logs.json', JSON.stringify(auditRes.data || [], null, 2));
      zip.file('alerts.json', JSON.stringify(alertsRes.data || [], null, 2));
      zip.file('castrations.json', JSON.stringify(castrationsData, null, 2));
      zip.file('photos.json', JSON.stringify(photosData, null, 2));
      zip.file('config.json', JSON.stringify({
        backupDate: now.toISOString(),
        systemVersion: '3.0.0',
        organization: 'ONG Viva Bicho'
      }, null, 2));

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const sizeBytes = zipBlob.size;

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const successRecord: BackupRecord = { ...progressRecord, sizeBytes, status: 'success' };
      setHistory(prev => prev.map(r => r.id === recordId ? successRecord : r));

      await auditService.log(
        'backup_gerado',
        `Backup manual do sistema gerado. Arquivo: ${fileName}. Tamanho: ${formatBytes(sizeBytes)}.`,
        profile?.name || 'Sistema',
        profile?.role || 'admin'
      );

      showToast(`Backup gerado com sucesso! ${formatBytes(sizeBytes)}`, 'success');
    } catch (err: any) {
      const errorRecord: BackupRecord = { ...progressRecord, status: 'error', error: err.message || 'Erro desconhecido' };
      setHistory(prev => prev.map(r => r.id === recordId ? errorRecord : r));

      await auditService.log(
        'backup_erro',
        `Falha ao gerar backup. Erro: ${err.message}`,
        profile?.name || 'Sistema',
        profile?.role || 'admin'
      );

      showToast(`Erro ao gerar backup: ${err.message}`, 'error');
    } finally {
      setIsBackingUp(false);
    }
  }, [isAdmin, profile, showToast]);

  const handleOpenDrive = useCallback(() => {
    window.open('https://drive.google.com/drive/my-drive', '_blank');
  }, []);

  const handleOpenDownloads = useCallback(() => {
    // For web browsers, we can't directly open the downloads folder
    // Show a helpful message instead
    showToast('Abra sua pasta de Downloads pressionando Ctrl+J no navegador.', 'success');
  }, [showToast]);

  const handleDeleteRecord = useCallback((id: string) => {
    setHistory(prev => prev.filter(r => r.id !== id));
  }, []);

  // ========== ADMIN GUARD ==========
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Acesso Restrito</h2>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
              Apenas administradores podem acessar o módulo de Backup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-[60] max-w-sm animate-in slide-in-from-top-2 fade-in duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <p className="text-base font-medium flex-1">{toast.message}</p>
            <button onClick={() => setToast(null)} className="shrink-0 p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Backup do Sistema
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
              Gere uma cópia completa do sistema para manter seus dados protegidos.
            </p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Último Backup */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Último Backup</h3>
          </div>
          {lastBackup ? (
            <div className="space-y-2">
              {(() => { const dt = formatDateTimeBR(lastBackup.date); return (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Arquivo</p>
                    <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300 text-right max-w-[200px] truncate">{lastBackup.fileName}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Data</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{dt.date}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Hora</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{dt.time}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tamanho</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{formatBytes(lastBackup.sizeBytes)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${BACKUP_STATUS_COLORS[lastBackup.status].bg} ${BACKUP_STATUS_COLORS[lastBackup.status].text} ${BACKUP_STATUS_COLORS[lastBackup.status].border}`}>
                      {lastBackup.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                      {lastBackup.status === 'error' && <XCircle className="w-3 h-3" />}
                      {BACKUP_STATUS_LABELS[lastBackup.status]}
                    </span>
                  </div>
                </>
              ); })()}
            </div>
          ) : (
            <div className="py-4 text-center">
              <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <span className="text-sm text-slate-500">Nenhum backup registrado</span>
            </div>
          )}
        </div>

        {/* Card 2: Backup Recomendado */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Backup Recomendado</h3>
          </div>
          <div className="space-y-3">
            {lastBackup ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Último backup</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white">{formatDateTimeBR(lastBackup.date).date}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Próximo recomendado</p>
                  <p className={`text-base font-bold ${nextBackupText === 'Atrasado' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {nextBackupText}
                  </p>
                </div>
              </>
            ) : (
              <div className="py-3 text-center">
                <p className="text-base font-bold text-slate-900 dark:text-white">Nenhum backup</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Execute o primeiro backup para iniciar o acompanhamento.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={handleGenerateBackup} disabled={isBackingUp}
          className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
            {isBackingUp ? <Loader2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin" /> : <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          </div>
          <div className="text-left">
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {isBackingUp ? 'Gerando...' : 'Gerar Backup'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isBackingUp ? 'Compactando dados...' : 'Download do arquivo ZIP'}
            </p>
          </div>
        </button>

        <button onClick={handleOpenDrive}
          className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
            <ExternalLink className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <p className="text-base font-bold text-slate-900 dark:text-white">Abrir Google Drive</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Acesse sua conta</p>
          </div>
        </button>

        <button onClick={handleOpenDownloads}
          className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-900/50 transition-colors">
            <FolderOpen className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-left">
            <p className="text-base font-bold text-slate-900 dark:text-white">Abrir Pasta de Downloads</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Acesse seus arquivos</p>
          </div>
        </button>
      </div>

      {/* Info message */}
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Após baixar o arquivo, arraste-o para sua pasta de <strong>Backups</strong> no Google Drive.
        </p>
      </div>

      {/* Restore Button (Disabled) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Info className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">Restaurar Backup</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Disponível em versão futura.</p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-400 cursor-not-allowed">
            Em breve
          </span>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Histórico de Backups</h2>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {history.length}
            </span>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">Nenhum backup registrado</p>
            <p className="text-sm text-slate-500">Execute o primeiro backup para iniciar o histórico.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-2 text-xs font-black uppercase tracking-wider text-slate-400">Data/Hora</th>
                  <th className="pb-2 text-xs font-black uppercase tracking-wider text-slate-400">Nome do Arquivo</th>
                  <th className="pb-2 text-xs font-black uppercase tracking-wider text-slate-400 hidden sm:table-cell">Tamanho</th>
                  <th className="pb-2 text-xs font-black uppercase tracking-wider text-slate-400">Status</th>
                  <th className="pb-2 text-xs font-black uppercase tracking-wider text-slate-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {history.map((record) => {
                  const statusColors = BACKUP_STATUS_COLORS[record.status];
                  const dt = formatDateTimeBR(record.date);
                  return (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>{dt.date}</span>
                        <span className="ml-1 text-slate-400">{dt.time}</span>
                      </td>
                      <td className="py-3">
                        <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">{record.fileName}</p>
                        {record.error &&                         <p className="text-xs text-slate-500 dark:text-slate-400">{record.error}</p>}
                      </td>
                      <td className="py-3 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell font-mono">
                        {record.sizeBytes > 0 ? formatBytes(record.sizeBytes) : '-'}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                          {record.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                          {record.status === 'error' && <XCircle className="w-3 h-3" />}
                          {BACKUP_STATUS_LABELS[record.status]}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleDeleteRecord(record.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors" title="Remover do histórico">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
