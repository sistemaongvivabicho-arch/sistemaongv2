import React, { useState, useMemo, useCallback } from 'react';
import {
  Scissors, Plus, Edit3, Clock, CheckCircle2, XCircle, RefreshCw, Trash2,
  Filter, FileText, AlertTriangle, Lock, Search, Check,
  ChevronDown, ChevronUp, FileDown, CalendarDays
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAnimalContext } from '../../context/AnimalContext';
import { useAuditActions } from '../../context/useAuditActions';
import { Animal } from '../../types/animal';
import {
  CastrationStatus, CASTRATION_STATUS_LABELS,
  CASTRATION_STATUS_COLORS, SPECIES_LABELS_CASTRATION
} from '../../types/castrations';
import { DatePicker } from '../common/DatePicker';
import { AutoComplete } from '../common/AutoComplete';
import { getSuggestions, addSuggestion } from '../../utils/autocompleteStorage';
import { getTodayBR, getMonthNames, getYearOptions, parseBRDate } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';

const MONTH_NAMES = getMonthNames();
const YEAR_OPTIONS = getYearOptions();

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => (
  <div className="fixed top-4 right-4 z-[60] max-w-sm animate-in slide-in-from-top-2 fade-in duration-300">
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${
      type === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
        : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
    }`}>
      {type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="shrink-0 p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  </div>
);

function mapAnimalToSchedule(a: Animal): {
  id: string;
  animalId: string;
  animalName: string;
  animalSpecies: string;
  scheduledDate: string;
  performedDate: string;
  veterinarian: string;
  notes: string;
  status: CastrationStatus;
} {
  return {
    id: a.id,
    animalId: a.id,
    animalName: a.name,
    animalSpecies: a.species,
    scheduledDate: a.castrationScheduledDate || '',
    performedDate: a.castrationDate || '',
    veterinarian: a.castrationVeterinarian || '',
    notes: a.castrationNotes || '',
    status: (a.castrationStatus as CastrationStatus) || 'agendada'
  };
}

export const CastracoesView: React.FC = () => {
  const { animals, loading, updateAnimal, navigateToAnimal } = useAnimalContext();
  const { updateAnimal: auditUpdateAnimal } = useAuditActions();
  const { isAdmin } = useAuth();

  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<CastrationStatus | 'all'>('all');
  const [filterSpecies, setFilterSpecies] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Animal | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Animal | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Animal | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Animal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Animal | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const castrationAnimals = useMemo(() => {
    return animals.filter((a) => a.castrationScheduledDate && a.castrationScheduledDate.trim() !== '');
  }, [animals]);

  const filteredSchedules = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return castrationAnimals.filter((a) => {
      const status = (a.castrationStatus as CastrationStatus) || 'agendada';
      if (filterStatus !== 'all' && status !== filterStatus) return false;
      if (filterSpecies !== 'all' && a.species !== filterSpecies) return false;
      const parsed = parseBRDate(a.castrationScheduledDate || '');
      if (parsed) {
        const m = parsed.getMonth() + 1;
        const y = parsed.getFullYear();
        if (m !== filterMonth || y !== filterYear) return false;
      }
      if (term && !a.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [castrationAnimals, filterStatus, filterSpecies, filterMonth, filterYear, searchTerm]);

  const monthStats = useMemo(() => {
    const ms = castrationAnimals.filter((a) => {
      const parsed = parseBRDate(a.castrationScheduledDate || '');
      return parsed && parsed.getMonth() + 1 === filterMonth && parsed.getFullYear() === filterYear;
    });
    return {
      total: ms.length,
      realizada: ms.filter((a) => a.castrationStatus === 'realizada').length,
      cancelada: ms.filter((a) => a.castrationStatus === 'cancelada').length,
      agendada: ms.filter((a) => !a.castrationStatus || a.castrationStatus === 'agendada').length,
      confirmada: ms.filter((a) => a.castrationStatus === 'confirmada').length,
      reagendada: ms.filter((a) => a.castrationStatus === 'reagendada').length
    };
  }, [castrationAnimals, filterMonth, filterYear]);

  const uniqueVeterinarians = useMemo(() => {
    const set = new Set<string>();
    castrationAnimals.forEach((a) => { if (a.castrationVeterinarian) set.add(a.castrationVeterinarian); });
    return Array.from(set).sort();
  }, [castrationAnimals]);

  const handleCreate = useCallback(async (data: { animalId: string; scheduledDate: string; veterinarian: string; notes: string }) => {
    const success = await updateAnimal(data.animalId, {
      castrationScheduledDate: data.scheduledDate,
      castrationStatus: 'agendada',
      castrationVeterinarian: data.veterinarian,
      castrationNotes: data.notes
    });
    if (success) {
      addSuggestion('veterinario', data.veterinarian);
      showToast('Castração agendada com sucesso!', 'success');
      setShowNewModal(false);
    } else {
      showToast('Erro ao agendar castração.', 'error');
    }
  }, [updateAnimal, showToast]);

  const handleUpdate = useCallback(async (data: { scheduledDate: string; veterinarian: string; notes: string }) => {
    if (!editingAnimal) return;
    const success = await updateAnimal(editingAnimal.id, {
      castrationScheduledDate: data.scheduledDate,
      castrationVeterinarian: data.veterinarian,
      castrationNotes: data.notes
    });
    if (success) {
      addSuggestion('veterinario', data.veterinarian);
      showToast('Agendamento atualizado!', 'success');
      setEditingAnimal(null);
    } else {
      showToast('Erro ao atualizar agendamento.', 'error');
    }
  }, [editingAnimal, updateAnimal, showToast]);

  const handleReschedule = useCallback(async (newDate: string) => {
    if (!rescheduleTarget) return;
    const success = await updateAnimal(rescheduleTarget.id, {
      castrationScheduledDate: newDate,
      castrationStatus: 'reagendada'
    });
    if (success) {
      showToast('Castração reagendada!', 'success');
      setRescheduleTarget(null);
    } else {
      showToast('Erro ao reagendar.', 'error');
    }
  }, [rescheduleTarget, updateAnimal, showToast]);

  const handleConfirm = useCallback(async () => {
    if (!confirmTarget) return;
    const success = await updateAnimal(confirmTarget.id, {
      castrationStatus: 'confirmada'
    });
    if (success) {
      showToast('Castração confirmada!', 'success');
      setConfirmTarget(null);
    } else {
      showToast('Erro ao confirmar.', 'error');
    }
  }, [confirmTarget, updateAnimal, showToast]);

  const handleComplete = useCallback(async (performedDate: string) => {
    if (!completeTarget) return;
    const success = await updateAnimal(completeTarget.id, {
      castrationStatus: 'realizada',
      castrationDate: performedDate,
      castrado: true
    });
    if (success) {
      showToast('Castração registrada como realizada!', 'success');
      setCompleteTarget(null);
    } else {
      showToast('Erro ao registrar realização.', 'error');
    }
  }, [completeTarget, updateAnimal, showToast]);

  const handleCancel = useCallback(async (reason: string) => {
    if (!cancelTarget) return;
    const success = await updateAnimal(cancelTarget.id, {
      castrationStatus: 'cancelada',
      castrationNotes: cancelTarget.castrationNotes
        ? `${cancelTarget.castrationNotes}\n[Cancelamento] ${reason}`
        : `[Cancelamento] ${reason}`
    });
    if (success) {
      showToast('Castração cancelada.', 'success');
      setCancelTarget(null);
    } else {
      showToast('Erro ao cancelar.', 'error');
    }
  }, [cancelTarget, updateAnimal, showToast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    if (deletePassword !== '0001') { setDeleteError('Senha incorreta'); return; }
    const success = await updateAnimal(deleteTarget.id, {
      castrationScheduledDate: undefined,
      castrationStatus: undefined,
      castrationVeterinarian: undefined,
      castrationNotes: undefined
    });
    if (success) {
      showToast('Agendamento removido.', 'success');
      setDeleteTarget(null);
      setDeletePassword('');
      setDeleteError('');
    } else {
      showToast('Erro ao remover agendamento.', 'error');
    }
  }, [deleteTarget, deletePassword, updateAnimal, showToast]);

  const closeDeleteModal = useCallback(() => { setDeleteTarget(null); setDeletePassword(''); setDeleteError(''); }, []);

  const generatePDF = useCallback(() => {
    const doc = new jsPDF();
    const monthName = MONTH_NAMES[filterMonth - 1];
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header background
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // ONG name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Viva Bicho', 14, 15);

    // Report title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Castrações', 14, 23);

    // Date on right
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - 14, 15, { align: 'right' });

    // Filters applied
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(`Mês: ${monthName} | Ano: ${filterYear}`, pageWidth - 14, 23, { align: 'right' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Summary section
    let y = 42;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageWidth - 28, 22, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO', 20, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const summaryY = y + 15;
    doc.text(`Total: ${filteredSchedules.length}`, 20, summaryY);
    doc.text(`Agendadas: ${monthStats.agendada}`, 60, summaryY);
    doc.text(`Confirmadas: ${monthStats.confirmada}`, 100, summaryY);
    doc.text(`Realizadas: ${monthStats.realizada}`, 140, summaryY);
    doc.text(`Canceladas: ${monthStats.cancelada}`, 180, summaryY);

    // Table
    const body = filteredSchedules.map((a) => {
      const status = (a.castrationStatus as CastrationStatus) || 'agendada';
      return [
        a.name,
        SPECIES_LABELS_CASTRATION[a.species] || a.species,
        a.castrationVeterinarian || '-',
        a.castrationScheduledDate || '-',
        CASTRATION_STATUS_LABELS[status],
        a.castrationDate || '-',
        (a.castrationNotes || '-').substring(0, 30)
      ];
    });

    autoTable(doc, {
      startY: y + 28,
      head: [['Animal', 'Espécie', 'Veterinário', 'Data Agendada', 'Status', 'Data Realização', 'Obs.']],
      body,
      styles: { fontSize: 7.5, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer on each page
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Viva Bicho — Relatório de Castrações — Página ${data.pageNumber} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      }
    });

    doc.save(`relatorio_castracoes_${monthName.toLowerCase()}_${filterYear}.pdf`);
  }, [filteredSchedules, filterMonth, filterYear, monthStats]);

  const renderStatusBadge = useCallback((status: CastrationStatus, size: 'sm' | 'xs' = 'sm') => {
    const colors = CASTRATION_STATUS_COLORS[status];
    const sizeClasses = size === 'sm' ? 'text-xs font-bold px-2.5 py-1.5' : 'text-xs font-bold px-2 py-0.5';
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border} ${sizeClasses}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
        {CASTRATION_STATUS_LABELS[status]}
      </span>
    );
  }, []);

  const renderActionButtons = useCallback((animal: Animal) => {
    const status = (animal.castrationStatus as CastrationStatus) || 'agendada';
    const canEdit = status === 'agendada' || status === 'reagendada';
    const canConfirm = status === 'agendada' || status === 'reagendada';
    const canComplete = status === 'confirmada' || status === 'agendada';
    const canReschedule = status !== 'realizada' && status !== 'cancelada';
    const canCancel = status !== 'realizada' && status !== 'cancelada';
    const canDelete = isAdmin;

    return (
      <div className="flex items-center gap-1 flex-wrap justify-end">
        {canEdit && (
          <button onClick={() => setEditingAnimal(animal)} title="Editar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
        {canConfirm && (
          <button onClick={() => setConfirmTarget(animal)} title="Confirmar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        )}
        {canComplete && (
          <button onClick={() => setCompleteTarget(animal)} title="Marcar como realizada"
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
            <CalendarDays className="w-3.5 h-3.5" />
          </button>
        )}
        {canReschedule && (
          <button onClick={() => setRescheduleTarget(animal)} title="Reagendar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
        {canCancel && (
          <button onClick={() => setCancelTarget(animal)} title="Cancelar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        )}
        {canDelete && (
          <button onClick={() => setDeleteTarget(animal)} title="Excluir"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Scissors className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Castrações
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {MONTH_NAMES[filterMonth - 1]} {filterYear} · {filteredSchedules.length} agendamento(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={generatePDF} title="Gerar relatório PDF"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm shadow-emerald-600/25 hover:shadow-md transition-all active:scale-[0.98] shrink-0">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nova Castração
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filtros</span>
            {(filterStatus !== 'all' || filterSpecies !== 'all' || searchTerm) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </div>
          {showFilters ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {showFilters && (
          <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex flex-wrap gap-3">
              <select value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value, 10))}
                className="py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
                {MONTH_NAMES.map((name, i) => (<option key={i} value={i + 1}>{name}</option>))}
              </select>
              <select value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value, 10))}
                className="py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
                {YEAR_OPTIONS.map((y) => (<option key={y} value={y}>{y}</option>))}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as CastrationStatus | 'all')}
                className="py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
                <option value="all">Todos os status</option>
                {Object.entries(CASTRATION_STATUS_LABELS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
              </select>
              <select value={filterSpecies} onChange={(e) => setFilterSpecies(e.target.value)}
                className="py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
                <option value="all">Todas as espécies</option>
                {Object.entries(SPECIES_LABELS_CASTRATION).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
              </select>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por nome do animal..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: monthStats.total, bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-900 dark:text-white', labelCls: 'text-slate-500 dark:text-slate-400' },
          { label: 'Agendadas', value: monthStats.agendada, bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', labelCls: 'text-amber-600 dark:text-amber-400' },
          { label: 'Confirmadas', value: monthStats.confirmada, bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', labelCls: 'text-blue-600 dark:text-blue-400' },
          { label: 'Realizadas', value: monthStats.realizada, bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', labelCls: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Canceladas', value: monthStats.cancelada, bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', labelCls: 'text-rose-600 dark:text-rose-400' },
          { label: 'Reagendadas', value: monthStats.reagendada, bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', text: 'text-violet-700 dark:text-violet-300', labelCls: 'text-violet-600 dark:text-violet-400' }
        ].map(({ label, value, bg, border, text, labelCls }) => (
          <div key={label} className={`p-4 rounded-xl border space-y-1 ${bg} ${border}`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${labelCls}`}>{label}</p>
            <p className={`text-2xl font-black ${text}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Lista de Agendamentos</h2>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{filteredSchedules.length}</span>
          </div>
        </div>
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-3">Carregando agendamentos...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Scissors className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Nenhum agendamento encontrado</p>
            <p className="text-sm text-slate-500">Ajuste os filtros ou crie uma nova castração.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="pb-2 text-xs font-black uppercase tracking-wider text-slate-400">Animal</th>
              <th className="pb-2 text-xs font-black uppercase tracking-wider text-slate-400 hidden sm:table-cell">Espécie</th>
              <th className="pb-2 text-xs font-black uppercase tracking-wider text-slate-400 hidden md:table-cell">Veterinário</th>
              <th className="pb-2 text-xs font-black uppercase tracking-wider text-slate-400 hidden md:table-cell">Data</th>
              <th className="pb-2 text-xs font-black uppercase tracking-wider text-slate-400">Status</th>
              <th className="pb-2 text-xs font-black uppercase tracking-wider text-slate-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredSchedules.map((a) => {
                  const status = (a.castrationStatus as CastrationStatus) || 'agendada';
                  return (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3">
                        <button onClick={() => navigateToAnimal(a.id)}
                          className="text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                          {a.name}
                        </button>
                      </td>
                      <td className="py-3 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        {SPECIES_LABELS_CASTRATION[a.species] || a.species}
                      </td>
                      <td className="py-3 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell">{a.castrationVeterinarian || '-'}</td>
                      <td className="py-3 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 hidden md:table-cell">{a.castrationScheduledDate}</td>
                      <td className="py-3">{renderStatusBadge(status, 'xs')}</td>
                      <td className="py-3 text-right">{renderActionButtons(a)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========== MODALS ========== */}
      {showNewModal && (
        <NewCastrationModal
          animals={castrationAnimals}
          allAnimals={animals}
          onClose={() => setShowNewModal(false)}
          onSubmit={handleCreate}
        />
      )}
      {editingAnimal && (
        <EditCastrationModal animal={editingAnimal} onClose={() => setEditingAnimal(null)} onSubmit={handleUpdate} />
      )}
      {rescheduleTarget && (
        <RescheduleModal animal={rescheduleTarget} onClose={() => setRescheduleTarget(null)} onSubmit={handleReschedule} />
      )}
      {confirmTarget && (
        <ConfirmModal animal={confirmTarget} onClose={() => setConfirmTarget(null)} onConfirm={handleConfirm} />
      )}
      {completeTarget && (
        <CompleteModal animal={completeTarget} onClose={() => setCompleteTarget(null)} onSubmit={handleComplete} />
      )}
      {cancelTarget && (
        <CancelModal animal={cancelTarget} onClose={() => setCancelTarget(null)} onSubmit={handleCancel} />
      )}
      {deleteTarget && (
        <DeleteModal target={deleteTarget} password={deletePassword} error={deleteError} onPasswordChange={setDeletePassword} onConfirm={handleDelete} onClose={closeDeleteModal} />
      )}
    </div>
  );
};

// ==================== MODALS ====================

interface NewCastrationModalProps {
  animals: Animal[];
  allAnimals: Animal[];
  onClose: () => void;
  onSubmit: (data: { animalId: string; scheduledDate: string; veterinarian: string; notes: string }) => void;
}

const NewCastrationModal: React.FC<NewCastrationModalProps> = ({ animals, allAnimals, onClose, onSubmit }) => {
  const [animalId, setAnimalId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const vetSuggestions = useMemo(() => getSuggestions('veterinario'), []);

  const availableAnimals = useMemo(() => {
    return allAnimals.filter((a) => {
      if (!a.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (a.castrationScheduledDate && a.castrationScheduledDate.trim() !== '' &&
          a.castrationStatus !== 'realizada' && a.castrationStatus !== 'cancelada') {
        return false;
      }
      return true;
    });
  }, [allAnimals, searchTerm]);

  const selectedAnimal = useMemo(() => allAnimals.find((a) => a.id === animalId), [allAnimals, animalId]);

  const handleSubmit = () => {
    if (!animalId) { setError('Selecione um animal.'); return; }
    if (!scheduledDate) { setError('Informe a data.'); return; }
    if (!veterinarian.trim()) { setError('Informe o veterinário.'); return; }
    setError('');
    onSubmit({ animalId, scheduledDate, veterinarian: veterinarian.trim(), notes: notes.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"><Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Nova Castração</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Agende uma castração</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"><XCircle className="w-5 h-5" /></button>
        </div>
        {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800"><p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p></div>}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Animal *</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setAnimalId(''); }} placeholder="Buscar animal..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
            </div>
            {searchTerm && !animalId && (
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
                {availableAnimals.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3">Nenhum animal encontrado.</p>
                ) : availableAnimals.slice(0, 20).map((a) => (
                  <button key={a.id} onClick={() => { setAnimalId(a.id); setSearchTerm(a.name); }}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0">
                    {a.name} <span className="text-xs text-slate-400">({SPECIES_LABELS_CASTRATION[a.species] || a.species})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Data *</label>
            <DatePicker value={scheduledDate} onChange={setScheduledDate} placeholder="DD/MM/AAAA" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Veterinário *</label>
            <AutoComplete value={veterinarian} onChange={setVeterinarian} suggestions={vetSuggestions} placeholder="Nome do veterinário" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Observações</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações (opcional)"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm shadow-emerald-600/25 hover:shadow-md transition-all active:scale-[0.98]">Agendar</button>
        </div>
      </div>
    </div>
  );
};

interface EditCastrationModalProps {
  animal: Animal;
  onClose: () => void;
  onSubmit: (data: { scheduledDate: string; veterinarian: string; notes: string }) => void;
}

const EditCastrationModal: React.FC<EditCastrationModalProps> = ({ animal, onClose, onSubmit }) => {
  const [scheduledDate, setScheduledDate] = useState(animal.castrationScheduledDate || '');
  const [veterinarian, setVeterinarian] = useState(animal.castrationVeterinarian || '');
  const [notes, setNotes] = useState(animal.castrationNotes || '');
  const [error, setError] = useState('');

  const vetSuggestions = useMemo(() => getSuggestions('veterinario'), []);

  const handleSubmit = () => {
    if (!scheduledDate) { setError('Informe a data.'); return; }
    if (!veterinarian.trim()) { setError('Informe o veterinário.'); return; }
    setError('');
    onSubmit({ scheduledDate, veterinarian: veterinarian.trim(), notes: notes.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-lg space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center"><Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Editar Agendamento</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{animal.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"><XCircle className="w-5 h-5" /></button>
        </div>
        {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800"><p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p></div>}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Data *</label>
            <DatePicker value={scheduledDate} onChange={setScheduledDate} placeholder="DD/MM/AAAA" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Veterinário *</label>
            <AutoComplete value={veterinarian} onChange={setVeterinarian} suggestions={vetSuggestions} placeholder="Nome do veterinário" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Observações</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm shadow-emerald-600/25 hover:shadow-md transition-all active:scale-[0.98]">Salvar</button>
        </div>
      </div>
    </div>
  );
};

interface RescheduleModalProps {
  animal: Animal;
  onClose: () => void;
  onSubmit: (newDate: string) => void;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ animal, onClose, onSubmit }) => {
  const [newDate, setNewDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!newDate) { setError('Informe a nova data.'); return; }
    setError('');
    onSubmit(newDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center"><RefreshCw className="w-5 h-5 text-violet-600 dark:text-violet-400" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Reagendar</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{animal.name} · {animal.castrationScheduledDate}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"><XCircle className="w-5 h-5" /></button>
        </div>
        {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800"><p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p></div>}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nova Data *</label>
            <DatePicker value={newDate} onChange={setNewDate} placeholder="DD/MM/AAAA" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-sm shadow-violet-600/25 hover:shadow-md transition-all active:scale-[0.98]">Reagendar</button>
        </div>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  animal: Animal;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ animal, onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md space-y-5 p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirmar Castração</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Confirmar realização da castração</p>
        </div>
      </div>
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 space-y-1">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{animal.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{SPECIES_LABELS_CASTRATION[animal.species] || animal.species}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Data: {animal.castrationScheduledDate}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Veterinário: {animal.castrationVeterinarian}</p>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
        <button onClick={onConfirm} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-600/25 hover:shadow-md transition-all active:scale-[0.98]">Confirmar</button>
      </div>
    </div>
  </div>
);

interface CompleteModalProps {
  animal: Animal;
  onClose: () => void;
  onSubmit: (performedDate: string) => void;
}

const CompleteModal: React.FC<CompleteModalProps> = ({ animal, onClose, onSubmit }) => {
  const [performedDate, setPerformedDate] = useState(getTodayBR());
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!performedDate) { setError('Informe a data de realização.'); return; }
    setError('');
    onSubmit(performedDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md space-y-5 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"><CalendarDays className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Marcar como Realizada</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{animal.name}</p>
          </div>
        </div>
        {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800"><p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p></div>}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Data de Realização *</label>
          <DatePicker value={performedDate} onChange={setPerformedDate} placeholder="DD/MM/AAAA" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm shadow-emerald-600/25 hover:shadow-md transition-all active:scale-[0.98]">Registrar</button>
        </div>
      </div>
    </div>
  );
};

interface CancelModalProps {
  animal: Animal;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const CancelModal: React.FC<CancelModalProps> = ({ animal, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) { setError('Informe o motivo do cancelamento.'); return; }
    setError('');
    onSubmit(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md space-y-5 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center"><XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" /></div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Cancelar Castração</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{animal.name} · {animal.castrationScheduledDate}</p>
          </div>
        </div>
        {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800"><p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p></div>}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Motivo *</label>
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo do cancelamento"
            className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Voltar</button>
          <button onClick={handleSubmit} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm shadow-rose-600/25 hover:shadow-md transition-all active:scale-[0.98]">Cancelar Agendamento</button>
        </div>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  target: Animal;
  password: string;
  error: string;
  onPasswordChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ target, password, error, onPasswordChange, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md space-y-5 p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" /></div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Excluir Agendamento</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Esta ação não pode ser desfeita.</p>
        </div>
      </div>
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{target.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Data: {target.castrationScheduledDate}</p>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Lock className="w-3.5 h-3.5" />Digite a senha para confirmar</label>
        <input type="password" value={password} onChange={(e) => { onPasswordChange(e.target.value); }} placeholder="Senha"
          className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(); }} />
        {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
        <button onClick={onConfirm} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm shadow-rose-600/25 transition-all active:scale-[0.98]">Excluir</button>
      </div>
    </div>
  </div>
);
