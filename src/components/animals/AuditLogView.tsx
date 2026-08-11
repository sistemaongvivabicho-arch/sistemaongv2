import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAudit } from '../../context/AuditContext';
import { useAnimalContext } from '../../context/AnimalContext';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Search,
  XCircle,
  Filter,
  Download,
  FileText,
  FileType,
  FileSpreadsheet,
  Check,
  ClipboardCheck,
  ShieldAlert
} from 'lucide-react';
import {
  AuditActionType,
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_COLORS
} from '../../types/audit';

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

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob(['\uFEFF' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string): string {
  if (/[;"\n\r]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

const ACTION_TYPES: { value: AuditActionType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'cadastro_animal', label: 'Cadastro de animal' },
  { value: 'exclusao_animal', label: 'Exclusão de cadastro' },
  { value: 'alteracao_cadastro', label: 'Alteração de cadastro' },
  { value: 'alteracao_especie', label: 'Alteração de espécie' },
  { value: 'alteracao_sexo', label: 'Alteração de sexo' },
  { value: 'alteracao_localizacao', label: 'Alteração de localização' },
  { value: 'entrada_triagem', label: 'Entrada na triagem' },
  { value: 'saida_triagem', label: 'Saída da triagem' },
  { value: 'adocao', label: 'Adoção' },
  { value: 'registro_obito', label: 'Registro de óbito' },
  { value: 'alteracao_vacinacao', label: 'Alteração de vacinação' },
  { value: 'agendamento_castracao', label: 'Agendamento de castração' },
  { value: 'alteracao_agendamento', label: 'Alteração de agendamento' },
  { value: 'exclusao_agendamento', label: 'Exclusão de agendamento' },
  { value: 'upload_foto', label: 'Upload de foto' },
  { value: 'troca_foto', label: 'Troca de foto' },
  { value: 'exclusao_aviso', label: 'Exclusão de aviso' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'alteracao_senha', label: 'Alteração de senha' },
  { value: 'criacao_usuario', label: 'Criação de usuário' },
  { value: 'edicao_usuario', label: 'Edição de usuário' },
  { value: 'desativacao_usuario', label: 'Ativação/Desativação' },
  { value: 'reset_senha', label: 'Reset de senha' }
];

export const AuditLogView: React.FC = () => {
  const { setActiveTab } = useAnimalContext();
  const { isAdmin } = useAuth();
  const { auditLogs, loading, fetchAuditLogs } = useAudit();

  // Bloqueio antes da renderização: somente administradores
  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-400 dark:text-rose-500 mx-auto" />
        <p className="text-base font-bold text-slate-800 dark:text-slate-200">
          Acesso restrito ao Administrador.
        </p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Somente administradores podem visualizar o registro de alterações.
        </p>
        <button
          onClick={() => setActiveTab('relatorios')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Relatórios
        </button>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditActionType | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredLogs = useMemo(() => {
    let result = auditLogs;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (log) =>
          (log.animal_name || '').toLowerCase().includes(term) ||
          log.user_name.toLowerCase().includes(term) ||
          log.description.toLowerCase().includes(term)
      );
    }

    if (actionFilter !== 'all') {
      result = result.filter((log) => log.action_type === actionFilter);
    }

    if (dateFrom) {
      result = result.filter((log) => new Date(log.timestamp) >= new Date(dateFrom));
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((log) => new Date(log.timestamp) <= toDate);
    }

    return result;
  }, [auditLogs, searchTerm, actionFilter, dateFrom, dateTo]);

  const hasFilters = searchTerm.trim() || actionFilter !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleExportCsv = () => {
    setMenuOpen(false);
    const headers = ['Data/Hora', 'Usuário', 'Animal', 'Tipo', 'Descrição'];
    const rows = filteredLogs.map((log) => [
      formatTimestamp(log.timestamp),
      log.user_name,
      log.animal_name || 'Sistema',
      AUDIT_ACTION_LABELS[log.action_type],
      log.description
    ]);
    const csv = [headers, ...rows].map((r) => r.map(escapeCsv).join(';')).join('\r\n');
    downloadBlob(csv, 'auditoria-vivabicho.csv', 'text/csv;charset=utf-8');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportExcel = () => {
    setMenuOpen(false);
    const headerHtml = ['Data/Hora', 'Usuário', 'Animal', 'Tipo', 'Descrição']
      .map((h) => `<th>${h}</th>`)
      .join('');
    const bodyHtml = filteredLogs
      .map(
        (log) =>
          `<tr>
            <td>${formatTimestamp(log.timestamp)}</td>
            <td>${log.user_name}</td>
            <td>${log.animal_name || 'Sistema'}</td>
            <td>${AUDIT_ACTION_LABELS[log.action_type]}</td>
            <td>${log.description.replace(/</g, '&lt;')}</td>
          </tr>`
      )
      .join('');
    const html = `
      <html xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="utf-8"></head>
        <body>
          <table border="1">
            <tr>${headerHtml}</tr>
            ${bodyHtml}
          </table>
        </body>
      </html>`;
    downloadBlob(html, 'auditoria-vivabicho.xls', 'application/vnd.ms-excel');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPdf = () => {
    setMenuOpen(false);
    const nowStr = new Date().toLocaleString('pt-BR');
    const rows = filteredLogs
      .map(
        (log) =>
          `<tr>
            <td>${formatTimestamp(log.timestamp)}</td>
            <td>${log.user_name}</td>
            <td>${log.animal_name || 'Sistema'}</td>
            <td>${AUDIT_ACTION_LABELS[log.action_type]}</td>
            <td>${log.description.replace(/</g, '&lt;')}</td>
          </tr>`
      )
      .join('');

    const win = window.open('', '_blank', 'width=900,height=650');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Registro de Alterações — Viva Bicho</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; padding: 24px; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #10b981; padding-bottom: 12px; margin-bottom: 16px; }
            .title { font-size: 20px; font-weight: 800; color: #0f172a; }
            .sub { font-size: 11px; color: #64748b; margin-top: 4px; }
            .badge { display: inline-block; background: #10b981; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th { background: #f1f5f9; text-align: left; padding: 6px 8px; border: 1px solid #cbd5e1; }
            td { padding: 5px 8px; border: 1px solid #e2e8f0; }
            tr:nth-child(even) td { background: #f8fafc; }
            .footer { margin-top: 16px; font-size: 10px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">ONG Viva Bicho — Registro de Alterações</div>
              <div class="sub">Gerado em ${nowStr} · ${filteredLogs.length} registro(s)</div>
            </div>
            <div>
              <span class="badge">Auditoria</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Animal</th>
                <th>Tipo</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="5" style="text-align:center;padding:16px">Nenhum registro encontrado.</td></tr>'}
            </tbody>
          </table>
          <div class="footer">Registro de Alterações — Sistema de Gestão da ONG Viva Bicho.</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('relatorios')}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <ClipboardCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                Registro de Alterações
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Histórico permanente de todas as ações realizadas no sistema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-bold shadow-sm transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                Exportar
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-40 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Exportar ({filteredLogs.length} registros)
                      </p>
                    </div>
                    <button
                      onClick={handleExportPdf}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-rose-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">PDF</p>
                        <p className="text-xs text-slate-400">Imprimir / salvar como PDF</p>
                      </div>
                    </button>
                    <button
                      onClick={handleExportCsv}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <FileType className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">CSV</p>
                        <p className="text-xs text-slate-400">Planilha (separado por ;)</p>
                      </div>
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Excel</p>
                        <p className="text-xs text-slate-400">Arquivo .xls compatível</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por animal, usuário ou descrição..."
              className="w-full pl-9 pr-9 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-semibold transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as AuditActionType | 'all')}
              className="pl-9 pr-8 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              {ACTION_TYPES.map((at) => (
                <option key={at.value} value={at.value}>
                  {at.label}
                </option>
              ))}
            </select>
          </div>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            title="Data inicial"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            title="Data final"
          />
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">
              Exibindo {filteredLogs.length} de {auditLogs.length} registro(s)
            </span>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Log List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-3">Carregando registros...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ClipboardCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {auditLogs.length === 0
                ? 'Nenhum registro de alteração ainda'
                : 'Nenhum registro encontrado para os filtros aplicados'}
            </p>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {auditLogs.length === 0
                ? 'As alterações realizadas no sistema serão registradas automaticamente aqui.'
                : 'Tente ajustar os filtros de pesquisa.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLogs.map((log) => {
              const colorClass = AUDIT_ACTION_COLORS[log.action_type] || 'bg-slate-50 text-slate-700 border-slate-200';
              return (
                <div
                  key={log.id}
                  className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${colorClass}`}
                        >
                          {AUDIT_ACTION_LABELS[log.action_type]}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {log.animal_name || 'Sistema'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {log.description}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {log.user_name}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        {log.user_role === 'admin' ? 'Administrador' : log.user_role === 'common' ? 'Colaborador' : 'Sistema'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
