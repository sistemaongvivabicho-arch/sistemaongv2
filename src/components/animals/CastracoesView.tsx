import React, { useState, useMemo, useCallback } from 'react';
import {
  Scissors, ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarClock,
  CalendarCheck, Plus, Edit3, Clock, CheckCircle2, XCircle, RefreshCw, Trash2,
  Filter, BarChart3, ChevronDown, ChevronUp, User, FileText, AlertTriangle,
  PawPrint, Lock, Search, Check
} from 'lucide-react';
import { useCastrations, CastrationResult } from '../../context/CastrationsContext';
import {
  CastrationSchedule, CastrationStatus, CASTRATION_STATUS_LABELS,
  CASTRATION_STATUS_COLORS, SPECIES_LABELS_CASTRATION
} from '../../types/castrations';
import { useAnimalContext } from '../../context/AnimalContext';
import { useAuth } from '../../context/AuthContext';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const WEEK_DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEK_DAY_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function parseDateBR(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return new Date(y, m - 1, d);
}

function formatDateBR(d: Date): string {
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
}

function getStatusDots(schedules: CastrationSchedule[]): CastrationStatus[] {
  const seen = new Set<CastrationStatus>();
  schedules.forEach((s) => { if (!seen.has(s.status)) seen.add(s.status); });
  return Array.from(seen);
}

type ViewMode = 'month' | 'week' | 'day';

// ==================== TOAST ====================
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-[60] max-w-sm animate-in slide-in-from-top-2 fade-in duration-300`}>
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

// ==================== MAIN VIEW ====================
export const CastracoesView: React.FC = () => {
  const { schedules, loading, createSchedule, updateSchedule, reschedule, cancelSchedule, confirmSchedule, completeSchedule, deleteSchedule } = useCastrations();
  const { animals, navigateToAnimal } = useAnimalContext();
  const { isAdmin } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterStatus, setFilterStatus] = useState<CastrationStatus | 'all'>('all');
  const [filterSpecies, setFilterSpecies] = useState<string>('all');
  const [filterVeterinarian, setFilterVeterinarian] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CastrationSchedule | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<CastrationSchedule | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<CastrationSchedule | null>(null);
  const [completeTarget, setCompleteTarget] = useState<CastrationSchedule | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CastrationSchedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CastrationSchedule | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showReports, setShowReports] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((result: CastrationResult) => {
    if (result.message) {
      setToast({ message: result.message, type: result.success ? 'success' : 'error' });
      setTimeout(() => setToast(null), 3500);
    }
  }, []);

  const today = useMemo(() => new Date(), []);

  const navigateDate = useCallback((direction: -1 | 1) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() + direction);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() + (direction * 7));
      } else {
        d.setDate(d.getDate() + direction);
      }
      return d;
    });
    setSelectedDay(null);
  }, [viewMode]);

  const goToday = useCallback(() => { setCurrentDate(new Date()); setSelectedDay(null); }, []);

  const uniqueVeterinarians = useMemo(() => {
    const set = new Set<string>();
    schedules.forEach((s) => { if (s.veterinarian) set.add(s.veterinarian); });
    return Array.from(set).sort();
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterSpecies !== 'all' && s.animalSpecies !== filterSpecies) return false;
      if (filterVeterinarian !== 'all' && s.veterinarian !== filterVeterinarian) return false;
      const parts = s.scheduledDate.split('/');
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10);
        if (m !== filterMonth) return false;
      }
      return true;
    });
  }, [schedules, filterStatus, filterSpecies, filterVeterinarian, filterMonth]);

  const monthStats = useMemo(() => {
    const ms = schedules.filter((s) => {
      const parts = s.scheduledDate.split('/');
      return parts.length === 3 && parseInt(parts[1], 10) === filterMonth;
    });
    return {
      total: ms.length,
      realizada: ms.filter((s) => s.status === 'realizada').length,
      cancelada: ms.filter((s) => s.status === 'cancelada').length,
      reagendada: ms.filter((s) => s.status === 'reagendada').length,
      agendada: ms.filter((s) => s.status === 'agendada').length,
      confirmada: ms.filter((s) => s.status === 'confirmada').length
    };
  }, [schedules, filterMonth]);

  const schedulesByDate = useMemo(() => {
    const map: Record<string, CastrationSchedule[]> = {};
    filteredSchedules.forEach((s) => {
      if (!map[s.scheduledDate]) map[s.scheduledDate] = [];
      map[s.scheduledDate].push(s);
    });
    return map;
  }, [filteredSchedules]);

  const viewYear = currentDate.getFullYear();
  const viewMonth = currentDate.getMonth() + 1;
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay();

  const selectedDayDate = useMemo(() => {
    if (selectedDay === null) return null;
    return new Date(viewYear, viewMonth - 1, selectedDay);
  }, [selectedDay, viewYear, viewMonth]);

  const selectedDaySchedules = useMemo(() => {
    if (!selectedDayDate) return [];
    return filteredSchedules.filter((s) => s.scheduledDate === formatDateBR(selectedDayDate));
  }, [selectedDayDate, filteredSchedules]);

  const weekDates = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const daySchedules = useMemo(() => {
    const ds = formatDateBR(currentDate);
    return filteredSchedules.filter((s) => s.scheduledDate === ds);
  }, [currentDate, filteredSchedules]);

  const titleDate = useMemo(() => {
    if (viewMode === 'month') return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (viewMode === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${formatDateBR(start)} - ${formatDateBR(end)}`;
    }
    return formatDateBR(currentDate);
  }, [viewMode, currentDate]);

  // ---- CRUD HANDLERS ----
  const handleCreate = useCallback((data: { animalId: string; animalName: string; animalSpecies: string; scheduledDate: string; veterinarian: string; notes: string }) => {
    const result = createSchedule(data);
    showToast(result);
    if (result.success) setShowNewModal(false);
  }, [createSchedule, showToast]);

  const handleUpdate = useCallback((data: { scheduledDate: string; veterinarian: string; notes: string }) => {
    if (!editingSchedule) return;
    const result = updateSchedule(editingSchedule.id, data);
    showToast(result);
    if (result.success) setEditingSchedule(null);
  }, [editingSchedule, updateSchedule, showToast]);

  const handleReschedule = useCallback((newDate: string, reason: string) => {
    if (!rescheduleTarget) return;
    const result = reschedule(rescheduleTarget.id, newDate, reason);
    showToast(result);
    if (result.success) setRescheduleTarget(null);
  }, [rescheduleTarget, reschedule, showToast]);

  const handleConfirm = useCallback(() => {
    if (!confirmTarget) return;
    const result = confirmSchedule(confirmTarget.id);
    showToast(result);
    if (result.success) setConfirmTarget(null);
  }, [confirmTarget, confirmSchedule, showToast]);

  const handleComplete = useCallback((performedDate: string) => {
    if (!completeTarget) return;
    const result = completeSchedule(completeTarget.id, performedDate);
    showToast(result);
    if (result.success) setCompleteTarget(null);
  }, [completeTarget, completeSchedule, showToast]);

  const handleCancel = useCallback((reason: string) => {
    if (!cancelTarget) return;
    const result = cancelSchedule(cancelTarget.id, reason);
    showToast(result);
    if (result.success) setCancelTarget(null);
  }, [cancelTarget, cancelSchedule, showToast]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    if (deletePassword !== '0001') { setDeleteError('Senha incorreta'); return; }
    const result = deleteSchedule(deleteTarget.id);
    showToast(result);
    if (result.success) { setDeleteTarget(null); setDeletePassword(''); setDeleteError(''); }
  }, [deleteTarget, deletePassword, deleteSchedule, showToast]);

  const closeDeleteModal = useCallback(() => { setDeleteTarget(null); setDeletePassword(''); setDeleteError(''); }, []);

  // ---- RENDER HELPERS ----
  const renderStatusBadge = useCallback((status: CastrationStatus, size: 'sm' | 'xs' = 'sm') => {
    const colors = CASTRATION_STATUS_COLORS[status];
    const sizeClasses = size === 'sm' ? 'text-[11px] font-bold px-2.5 py-1' : 'text-[10px] font-bold px-2 py-0.5';
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border} ${sizeClasses}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
        {CASTRATION_STATUS_LABELS[status]}
      </span>
    );
  }, []);

  const renderActionButtons = useCallback((schedule: CastrationSchedule) => {
    const canEdit = schedule.status === 'agendada' || schedule.status === 'reagendada';
    const canConfirm = schedule.status === 'agendada' || schedule.status === 'reagendada';
    const canComplete = schedule.status === 'confirmada' || schedule.status === 'agendada';
    const canReschedule = schedule.status !== 'realizada' && schedule.status !== 'cancelada';
    const canCancel = schedule.status !== 'realizada' && schedule.status !== 'cancelada';
    const canDelete = isAdmin;

    return (
      <div className="flex items-center gap-1 flex-wrap justify-end">
        {canEdit && (
          <button onClick={() => setEditingSchedule(schedule)} title="Editar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
        {canConfirm && (
          <button onClick={() => setConfirmTarget(schedule)} title="Confirmar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        )}
        {canComplete && (
          <button onClick={() => setCompleteTarget(schedule)} title="Marcar como realizada"
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
            <CalendarCheck className="w-3.5 h-3.5" />
          </button>
        )}
        {canReschedule && (
          <button onClick={() => setRescheduleTarget(schedule)} title="Reagendar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
        {canCancel && (
          <button onClick={() => setCancelTarget(schedule)} title="Cancelar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        )}
        {canDelete && (
          <button onClick={() => setDeleteTarget(schedule)} title="Excluir"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }, [isAdmin]);

  // ========== RENDER ==========
  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Scissors className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Castrações
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Agenda de castrações, agendamentos e registros
            </p>
          </div>
          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm shadow-emerald-600/25 hover:shadow-md transition-all active:scale-[0.98] shrink-0">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Novo Agendamento
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5">
              {([
                { mode: 'month' as ViewMode, icon: CalendarDays, label: 'Mês' },
                { mode: 'week' as ViewMode, icon: CalendarClock, label: 'Semana' },
                { mode: 'day' as ViewMode, icon: CalendarCheck, label: 'Dia' }
              ]).map(({ mode, icon: Icon, label }) => (
                <button key={mode} onClick={() => { setViewMode(mode); setSelectedDay(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === mode ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <button onClick={goToday}
              className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Hoje
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigateDate(-1)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[160px] text-center">{titleDate}</span>
            <button onClick={() => navigateDate(1)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filtros</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value, 10))}
            className="py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
            {MONTH_NAMES.map((name, i) => (<option key={i} value={i + 1}>{name}</option>))}
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
          <select value={filterVeterinarian} onChange={(e) => setFilterVeterinarian(e.target.value)}
            className="py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
            <option value="all">Todos os veterinários</option>
            {uniqueVeterinarians.map((v) => (<option key={v} value={v}>{v}</option>))}
          </select>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
        {/* MONTHLY VIEW */}
        {viewMode === 'month' && (
          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-1">
              {WEEK_DAY_LABELS.map((label, i) => (
                <div key={i} className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase text-center py-1">{label}</div>
              ))}
              {Array.from({ length: firstDow }).map((_, i) => (<div key={`blank-${i}`} className="aspect-square" />))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayDate = new Date(viewYear, viewMonth - 1, day);
                const ds = formatDateBR(dayDate);
                const dayScheds = schedulesByDate[ds] || [];
                const isToday = isSameDay(dayDate, today);
                const isSelected = selectedDay === day;
                const dots = getStatusDots(dayScheds);
                return (
                  <button key={day} onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`relative aspect-square rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      isSelected ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : isToday ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40'
                      : dayScheds.length > 0 ? 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}>
                    <span className="leading-none">{day}</span>
                    {dayScheds.length > 0 && !isSelected && (
                      <div className="flex items-center gap-0.5">
                        {dots.slice(0, 3).map((dotStatus, di) => (
                          <span key={di} className={`w-1 h-1 rounded-full ${CASTRATION_STATUS_COLORS[dotStatus].dot}`} />
                        ))}
                        {dayScheds.length > 3 && <span className="text-[7px] font-bold ml-0.5">+{dayScheds.length - 3}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedDay !== null && selectedDaySchedules.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Agendados em {selectedDay.toString().padStart(2, '0')}/{viewMonth.toString().padStart(2, '0')}/{viewYear}
                </p>
                {selectedDaySchedules.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <PawPrint className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <button onClick={() => navigateToAnimal(s.animalId)}
                          className="text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate block">
                          {s.animalName}
                        </button>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {SPECIES_LABELS_CASTRATION[s.animalSpecies] || s.animalSpecies} · {s.veterinarian}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {renderStatusBadge(s.status)}
                      {renderActionButtons(s)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedDay !== null && selectedDaySchedules.length === 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400 italic">
                  Nenhum agendamento em {selectedDay.toString().padStart(2, '0')}/{viewMonth.toString().padStart(2, '0')}/{viewYear}.
                </p>
              </div>
            )}
          </div>
        )}

        {/* WEEKLY VIEW */}
        {viewMode === 'week' && (
          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date, i) => {
                const ds = formatDateBR(date);
                const dayScheds = filteredSchedules.filter((s) => s.scheduledDate === ds);
                const isToday = isSameDay(date, today);
                return (
                  <div key={i} className="space-y-2">
                    <div className={`text-center py-2 rounded-xl ${isToday ? 'bg-emerald-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'}`}>
                      <p className="text-[10px] font-bold uppercase opacity-70">{WEEK_DAY_SHORT[i]}</p>
                      <p className="text-lg font-black leading-none mt-0.5">{date.getDate()}</p>
                    </div>
                    <div className="space-y-1.5 min-h-[80px]">
                      {dayScheds.length === 0 ? (
                        <p className="text-[10px] text-slate-300 dark:text-slate-600 italic text-center pt-2">Vazio</p>
                      ) : dayScheds.map((s) => (
                        <div key={s.id} className={`p-2 rounded-lg border text-left space-y-1 ${CASTRATION_STATUS_COLORS[s.status].bg} ${CASTRATION_STATUS_COLORS[s.status].border}`}>
                          <button onClick={() => navigateToAnimal(s.animalId)}
                            className="text-[11px] font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors block truncate w-full">
                            {s.animalName}
                          </button>
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${CASTRATION_STATUS_COLORS[s.status].dot}`} />
                            <span className={`text-[9px] font-bold ${CASTRATION_STATUS_COLORS[s.status].text}`}>
                              {CASTRATION_STATUS_LABELS[s.status]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DAY VIEW */}
        {viewMode === 'day' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${isSameDay(currentDate, today) ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'}`}>
                <span className="text-[10px] font-bold uppercase leading-none opacity-80">{WEEK_DAY_LABELS[currentDate.getDay()]}</span>
                <span className="text-2xl font-black leading-none mt-0.5">{currentDate.getDate()}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{daySchedules.length} agendamento(s)</p>
              </div>
            </div>
            {daySchedules.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum agendamento para este dia.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {daySchedules.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                          <PawPrint className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <button onClick={() => navigateToAnimal(s.animalId)}
                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors block">
                            {s.animalName}
                          </button>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {SPECIES_LABELS_CASTRATION[s.animalSpecies] || s.animalSpecies}
                          </p>
                        </div>
                      </div>
                      {renderStatusBadge(s.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{s.veterinarian}</span>
                      <span className="inline-flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5" />{s.scheduledDate}</span>
                      {s.performedDate && <span className="inline-flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5" />Realizado: {s.performedDate}</span>}
                    </div>
                    {s.notes && (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50">
                        <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">{s.notes}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400">Criado por {s.createdBy} em {new Date(s.createdAt).toLocaleDateString('pt-BR')}</p>
                      {renderActionButtons(s)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Lista de Agendamentos</h2>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{filteredSchedules.length}</span>
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
            <p className="text-sm text-slate-500">Ajuste os filtros ou crie um novo agendamento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Animal</th>
                  <th className="pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden sm:table-cell">Espécie</th>
                  <th className="pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden md:table-cell">Data</th>
                  <th className="pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                  <th className="pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden lg:table-cell">Veterinário</th>
                  <th className="pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredSchedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3">
                      <button onClick={() => navigateToAnimal(s.animalId)}
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        {s.animalName}
                      </button>
                    </td>
                    <td className="py-3 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                      {SPECIES_LABELS_CASTRATION[s.animalSpecies] || s.animalSpecies}
                    </td>
                    <td className="py-3 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 hidden md:table-cell">{s.scheduledDate}</td>
                    <td className="py-3">{renderStatusBadge(s.status, 'xs')}</td>
                    <td className="py-3 text-xs text-slate-500 dark:text-slate-400 hidden lg:table-cell">{s.veterinarian}</td>
                    <td className="py-3 text-right">{renderActionButtons(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reports Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button onClick={() => setShowReports(!showReports)}
          className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Relatórios Mensais</h2>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{MONTH_NAMES[filterMonth - 1]}</span>
          </div>
          {showReports ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {showReports && (
          <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total', value: monthStats.total, cls: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white', labelCls: 'text-slate-500 dark:text-slate-400' },
                { label: 'Realizadas', value: monthStats.realizada, cls: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300', labelCls: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Canceladas', value: monthStats.cancelada, cls: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400', labelCls: 'text-slate-500 dark:text-slate-400' },
                { label: 'Reagendadas', value: monthStats.reagendada, cls: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300', labelCls: 'text-violet-600 dark:text-violet-400' },
                { label: 'Agendadas', value: monthStats.agendada, cls: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300', labelCls: 'text-amber-600 dark:text-amber-400' },
                { label: 'Confirmadas', value: monthStats.confirmada, cls: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300', labelCls: 'text-blue-600 dark:text-blue-400' }
              ].map(({ label, value, cls, labelCls }) => (
                <div key={label} className={`p-4 rounded-xl border space-y-1 ${cls}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${labelCls}`}>{label}</p>
                  <p className="text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========== MODALS ========== */}
      {showNewModal && (
        <NewCastrationModal animals={animals} existingSchedules={schedules} onClose={() => setShowNewModal(false)} onSubmit={handleCreate} />
      )}
      {editingSchedule && (
        <EditCastrationModal schedule={editingSchedule} onClose={() => setEditingSchedule(null)} onSubmit={handleUpdate} />
      )}
      {rescheduleTarget && (
        <RescheduleModal schedule={rescheduleTarget} onClose={() => setRescheduleTarget(null)} onSubmit={handleReschedule} />
      )}
      {confirmTarget && (
        <ConfirmModal schedule={confirmTarget} onClose={() => setConfirmTarget(null)} onConfirm={handleConfirm} />
      )}
      {completeTarget && (
        <CompleteModal schedule={completeTarget} onClose={() => setCompleteTarget(null)} onSubmit={handleComplete} />
      )}
      {cancelTarget && (
        <CancelModal schedule={cancelTarget} onClose={() => setCancelTarget(null)} onSubmit={handleCancel} />
      )}
      {deleteTarget && (
        <DeleteModal target={deleteTarget} password={deletePassword} error={deleteError} onPasswordChange={setDeletePassword} onConfirm={handleDelete} onClose={closeDeleteModal} />
      )}
    </div>
  );
};

// ==================== MODALS ====================

interface NewCastrationModalProps {
  animals: { id: string; name: string; species: string }[];
  existingSchedules: CastrationSchedule[];
  onClose: () => void;
  onSubmit: (data: { animalId: string; animalName: string; animalSpecies: string; scheduledDate: string; veterinarian: string; notes: string }) => void;
}

const NewCastrationModal: React.FC<NewCastrationModalProps> = ({ animals, existingSchedules, onClose, onSubmit }) => {
  const [animalId, setAnimalId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const availableAnimals = useMemo(() => {
    return animals.filter((a) => {
      if (!a.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return !existingSchedules.some((s) => s.animalId === a.id && s.status !== 'realizada' && s.status !== 'cancelada');
    });
  }, [animals, existingSchedules, searchTerm]);

  const selectedAnimal = useMemo(() => animals.find((a) => a.id === animalId), [animals, animalId]);

  const handleSubmit = () => {
    if (!animalId) { setError('Selecione um animal.'); return; }
    if (!scheduledDate) { setError('Informe a data.'); return; }
    if (!veterinarian.trim()) { setError('Informe o veterinário.'); return; }
    setError('');
    onSubmit({ animalId, animalName: selectedAnimal?.name || '', animalSpecies: selectedAnimal?.species || 'outro', scheduledDate, veterinarian: veterinarian.trim(), notes: notes.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"><Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Novo Agendamento</h3>
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
            <input type="text" placeholder="DD/MM/AAAA" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Veterinário *</label>
            <input type="text" placeholder="Nome do veterinário" value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
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
  schedule: CastrationSchedule;
  onClose: () => void;
  onSubmit: (data: { scheduledDate: string; veterinarian: string; notes: string }) => void;
}

const EditCastrationModal: React.FC<EditCastrationModalProps> = ({ schedule, onClose, onSubmit }) => {
  const [scheduledDate, setScheduledDate] = useState(schedule.scheduledDate);
  const [veterinarian, setVeterinarian] = useState(schedule.veterinarian);
  const [notes, setNotes] = useState(schedule.notes);
  const [error, setError] = useState('');

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
              <p className="text-xs text-slate-500 dark:text-slate-400">{schedule.animalName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"><XCircle className="w-5 h-5" /></button>
        </div>
        {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800"><p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p></div>}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Data *</label>
            <input type="text" placeholder="DD/MM/AAAA" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Veterinário *</label>
            <input type="text" value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
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
  schedule: CastrationSchedule;
  onClose: () => void;
  onSubmit: (newDate: string, reason: string) => void;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ schedule, onClose, onSubmit }) => {
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!newDate) { setError('Informe a nova data.'); return; }
    if (!reason.trim()) { setError('Informe o motivo.'); return; }
    setError('');
    onSubmit(newDate, reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center"><RefreshCw className="w-5 h-5 text-violet-600 dark:text-violet-400" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Reagendar</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{schedule.animalName} · {schedule.scheduledDate}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"><XCircle className="w-5 h-5" /></button>
        </div>
        {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800"><p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p></div>}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nova Data *</label>
            <input type="text" placeholder="DD/MM/AAAA" value={newDate} onChange={(e) => setNewDate(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Motivo *</label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo do reagendamento"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none" />
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
  schedule: CastrationSchedule;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ schedule, onClose, onConfirm }) => (
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
        <p className="text-sm font-bold text-slate-900 dark:text-white">{schedule.animalName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{SPECIES_LABELS_CASTRATION[schedule.animalSpecies] || schedule.animalSpecies}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Data: {schedule.scheduledDate}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Veterinário: {schedule.veterinarian}</p>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
        <button onClick={onConfirm} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-600/25 hover:shadow-md transition-all active:scale-[0.98]">Confirmar</button>
      </div>
    </div>
  </div>
);

interface CompleteModalProps {
  schedule: CastrationSchedule;
  onClose: () => void;
  onSubmit: (performedDate: string) => void;
}

const CompleteModal: React.FC<CompleteModalProps> = ({ schedule, onClose, onSubmit }) => {
  const [performedDate, setPerformedDate] = useState(formatDateBR(new Date()));
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
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"><CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Marcar como Realizada</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{schedule.animalName}</p>
          </div>
        </div>
        {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800"><p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p></div>}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Data de Realização *</label>
          <input type="text" placeholder="DD/MM/AAAA" value={performedDate} onChange={(e) => setPerformedDate(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
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
  schedule: CastrationSchedule;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const CancelModal: React.FC<CancelModalProps> = ({ schedule, onClose, onSubmit }) => {
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
            <p className="text-xs text-slate-500 dark:text-slate-400">{schedule.animalName} · {schedule.scheduledDate}</p>
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
  target: CastrationSchedule;
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
        <p className="text-sm font-bold text-slate-900 dark:text-white">{target.animalName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Data: {target.scheduledDate}</p>
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
