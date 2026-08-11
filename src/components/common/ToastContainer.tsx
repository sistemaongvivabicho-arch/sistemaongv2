import React from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAnimalContext();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bg = 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-700';
          let Icon = Info;

          if (toast.type === 'success') {
            bg = 'bg-emerald-800 text-emerald-50 border-emerald-700 shadow-emerald-950/20';
            Icon = CheckCircle2;
          } else if (toast.type === 'warning') {
            bg = 'bg-amber-800 text-amber-50 border-amber-700 shadow-amber-950/20';
            Icon = AlertTriangle;
          } else if (toast.type === 'error') {
            bg = 'bg-rose-800 text-rose-50 border-rose-700 shadow-rose-950/20';
            Icon = AlertCircle;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border shadow-lg text-sm font-semibold ${bg}`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0" />
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
