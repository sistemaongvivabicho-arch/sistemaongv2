import React, { useRef, useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileType, Check } from 'lucide-react';
import { Animal, LOCATION_LABELS, ORIGIN_LABELS, SEX_LABELS, SPECIES_LABELS } from '../../types/animal';
import { DashboardFilters, MONTH_NAMES } from '../../types/dashboard';

interface ExportReportProps {
  animals: Animal[];
  filters: DashboardFilters;
}

const REPORT_HEADERS = [
  'Nome',
  'Microchip',
  'Espécie',
  'Sexo',
  'Idade',
  'Peso',
  'Data de Entrada',
  'Localização',
  'Status',
  'Origem',
  'Protocolo',
  'Castrado',
  'Data da Castração',
  'Agendamento da Castração',
  'Última Vacina',
  'Próxima Vacina',
  'Observação Atual'
];

function statusLabel(s: string): string {
  if (s === 'adotado') return 'Adotado';
  if (s === 'obito') return 'Óbito';
  return 'No Abrigo';
}

function buildRows(animals: Animal[]): string[][] {
  return animals.map((a) => [
    a.name,
    a.microchip || '',
    SPECIES_LABELS[a.species],
    SEX_LABELS[a.sex],
    a.age || '',
    a.weight || '',
    a.entryDate,
    LOCATION_LABELS[a.currentLocation]?.label || a.currentLocation,
    statusLabel(a.status),
    ORIGIN_LABELS[a.origin],
    a.originProtocol || '',
    a.castrado ? 'Sim' : 'Não',
    a.castrationDate || '',
    a.castrationScheduledDate || '',
    a.vaccinationDate || '',
    a.vaccinationDueDate || '',
    (a.currentObservation || '').replace(/\s+/g, ' ')
  ]);
}

function filterSummary(filters: DashboardFilters): string {
  const parts: string[] = [];
  if (filters.month != null) parts.push(`Mês: ${MONTH_NAMES[filters.month - 1]}`);
  if (filters.year != null) parts.push(`Ano: ${filters.year}`);
  if (filters.origin !== 'all') parts.push(`Origem: ${ORIGIN_LABELS[filters.origin as keyof typeof ORIGIN_LABELS]}`);
  if (filters.location !== 'all') parts.push(`Localização: ${LOCATION_LABELS[filters.location as keyof typeof LOCATION_LABELS]?.label}`);
  if (filters.status !== 'all') parts.push(`Status: ${statusLabel(filters.status)}`);
  if (filters.species !== 'all') parts.push(`Espécie: ${SPECIES_LABELS[filters.species as keyof typeof SPECIES_LABELS]}`);
  if (filters.sex !== 'all') parts.push(`Sexo: ${SEX_LABELS[filters.sex as keyof typeof SEX_LABELS]}`);
  if (filters.castrado === 'sim') parts.push('Castrado: Sim');
  if (filters.castrado === 'nao') parts.push('Castrado: Não');
  if (filters.query.trim()) parts.push(`Busca: "${filters.query.trim()}"`);
  return parts.length > 0 ? parts.join(' | ') : 'Sem filtros (todos os animais)';
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

function exportCsv(animals: Animal[]) {
  const rows = [REPORT_HEADERS, ...buildRows(animals)];
  const csv = rows.map((r) => r.map(escapeCsv).join(';')).join('\r\n');
  downloadBlob(csv, 'relatorio-vivabicho.csv', 'text/csv;charset=utf-8');
}

function exportExcel(animals: Animal[]) {
  const headerHtml = REPORT_HEADERS.map((h) => `<th>${h}</th>`).join('');
  const bodyHtml = buildRows(animals)
    .map((r) => `<tr>${r.map((c) => `<td>${(c || '').replace(/</g, '&lt;')}</td>`).join('')}</tr>`)
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
  downloadBlob(html, 'relatorio-vivabicho.xls', 'application/vnd.ms-excel');
}

function exportPdf(animals: Animal[], filters: DashboardFilters) {
  const nowStr = new Date().toLocaleString('pt-BR');
  const rows = buildRows(animals)
    .map(
      (r) => `<tr>${r.map((c) => `<td>${(c || '').replace(/</g, '&lt;')}</td>`).join('')}</tr>`
    )
    .join('');

  const win = window.open('', '_blank', 'width=900,height=650');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Relatório Viva Bicho</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; padding: 24px; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #10b981; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; }
          .sub { font-size: 11px; color: #64748b; margin-top: 4px; }
          .meta { font-size: 11px; color: #64748b; }
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
            <div class="title">ONG Viva Bicho — Relatório de Animais</div>
            <div class="sub">Gerado em ${nowStr} · ${animals.length} animal(ais)</div>
          </div>
          <div>
            <span class="badge">Filtros ativos</span>
            <div class="meta" style="margin-top:6px">${filterSummary(filters)}</div>
          </div>
        </div>
        <table>
          <thead><tr>${REPORT_HEADERS.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rows || '<tr><td colspan="17" style="text-align:center;padding:16px">Nenhum animal encontrado para os filtros.</td></tr>'}</tbody>
        </table>
        <div class="footer">Relatório gerado pelo Sistema de Gestão da ONG Viva Bicho.</div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  win.document.close();
}

export const ExportReport: React.FC<ExportReportProps> = ({ animals, filters }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAction = (format: 'pdf' | 'csv' | 'excel') => {
    setMenuOpen(false);
    if (format === 'csv') exportCsv(animals);
    else if (format === 'excel') exportExcel(animals);
    else exportPdf(animals, filters);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
      >
        {copied ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
        Exportar Relatório
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-40 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Exportar ({animals.length} animais)
              </p>
            </div>
            <button
              onClick={() => handleAction('pdf')}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <FileText className="w-4 h-4 text-rose-500" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">PDF</p>
                <p className="text-[10px] text-slate-400">Imprimir / salvar como PDF</p>
              </div>
            </button>
            <button
              onClick={() => handleAction('csv')}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <FileType className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">CSV</p>
                <p className="text-[10px] text-slate-400">Planilha (separado por ;)</p>
              </div>
            </button>
            <button
              onClick={() => handleAction('excel')}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Excel</p>
                <p className="text-[10px] text-slate-400">Arquivo .xls compatível</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
