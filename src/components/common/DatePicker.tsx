import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getTodayBR, parseBRDate, formatDateBR, getMonthNames } from '../../utils/dateUtils';

const MONTH_NAMES = getMonthNames();
const WEEK_DAYS = ['Do', 'Se', 'Te', 'Qa', 'Qi', 'Se', 'Sa'];

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  defaultToToday?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
  defaultToToday = false,
  disabled = false,
  required = false,
  label,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [viewMonth, setViewMonth] = useState(() => {
    const parsed = parseBRDate(value);
    if (parsed) return parsed.getMonth();
    const today = new Date();
    return today.getMonth();
  });
  const [viewYear, setViewYear] = useState(() => {
    const parsed = parseBRDate(value);
    if (parsed) return parsed.getFullYear();
    return new Date().getFullYear();
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (isOpen) {
      const parsed = parseBRDate(inputValue);
      if (parsed) {
        setViewMonth(parsed.getMonth());
        setViewYear(parsed.getFullYear());
      } else {
        const today = new Date();
        setViewMonth(today.getMonth());
        setViewYear(today.getFullYear());
      }
    }
  }, [isOpen, inputValue]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = useMemo(() => new Date(viewYear, viewMonth + 1, 0).getDate(), [viewMonth, viewYear]);
  const firstDayOfWeek = useMemo(() => new Date(viewYear, viewMonth, 1).getDay(), [viewMonth, viewYear]);

  const today = useMemo(() => {
    const t = new Date();
    return { day: t.getDate(), month: t.getMonth(), year: t.getFullYear() };
  }, []);

  const selectedDate = useMemo(() => parseBRDate(inputValue), [inputValue]);

  const handleSelectDay = useCallback((day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    const formatted = formatDateBR(selected);
    setInputValue(formatted);
    onChange(formatted);
    setIsOpen(false);
  }, [viewMonth, viewYear, onChange]);

  const handleToday = useCallback(() => {
    const formatted = getTodayBR();
    setInputValue(formatted);
    onChange(formatted);
    setIsOpen(false);
  }, [onChange]);

  const handleClear = useCallback(() => {
    setInputValue('');
    onChange('');
    setIsOpen(false);
  }, [onChange]);

  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    val = val.replace(/[^0-9/]/g, '');
    if (val.length === 2 && inputValue.length === 1) {
      val = val + '/';
    }
    if (val.length === 5 && inputValue.length === 4) {
      val = val + '/';
    }
    if (val.length > 10) val = val.slice(0, 10);
    setInputValue(val);
    if (val.length === 10) {
      const parsed = parseBRDate(val);
      if (parsed) {
        onChange(val);
      }
    }
  }, [inputValue, onChange]);

  const handleInputBlur = useCallback(() => {
    if (inputValue && inputValue.length === 10) {
      const parsed = parseBRDate(inputValue);
      if (parsed) {
        onChange(inputValue);
      }
    }
  }, [inputValue, onChange]);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {label}{required && ' *'}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={10}
          className={`w-full py-2.5 pl-3 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
            error
              ? 'border-rose-300 dark:border-rose-700'
              : 'border-slate-200 dark:border-slate-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="p-0.5 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-[280px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-0 focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-0 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 11 }, (_, i) => today.year - 5 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEK_DAYS.map((d, i) => (
              <div key={i} className="text-xs font-black text-slate-400 uppercase py-1">
                {d}
              </div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday =
                day === today.day && viewMonth === today.month && viewYear === today.year;
              const isSelected =
                selectedDate &&
                day === selectedDate.getDate() &&
                viewMonth === selectedDate.getMonth() &&
                viewYear === selectedDate.getFullYear();
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : isToday
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleToday}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Hoje
            </button>
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
