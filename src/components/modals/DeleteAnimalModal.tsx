import React, { useState } from 'react';
import { useAuditActions } from '../../context/useAuditActions';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../context/lib/supabase';
import { X, AlertTriangle, Trash2, Loader2, Lock, ArrowLeft } from 'lucide-react';

interface DeleteAnimalModalProps {
  isOpen: boolean;
  animalId: string | null;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteAnimalModal: React.FC<DeleteAnimalModalProps> = ({
  isOpen,
  animalId,
  onClose,
  onDeleted
}) => {
  const { getAnimalById, deleteAnimal } = useAuditActions();
  const { user } = useAuth();

  const animal = animalId ? getAnimalById(animalId) : null;

  const [step, setStep] = useState<'confirm' | 'password'>('confirm');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setStep('confirm');
    setEmail(user?.email || '');
    setPassword('');
    setError('');
    setLoading(false);
    onClose();
  };

  const handleConfirmStep = () => {
    setStep('password');
    setError('');
  };

  const handleAuthenticateAndDelete = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Preencha o email e a senha.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (authError) {
        setError('Senha incorreta. Tente novamente.');
        setLoading(false);
        return;
      }

      if (!animalId) {
        setLoading(false);
        return;
      }

      const success = await deleteAnimal(animalId);

      if (success) {
        handleClose();
        onDeleted();
      } else {
        setError('Falha ao excluir o animal. Tente novamente.');
      }
    } catch (err: any) {
      setError('Erro ao autenticar: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !animal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
              {step === 'confirm' ? <AlertTriangle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {step === 'confirm' ? 'Confirmar Exclusão' : 'Autenticar Exclusão'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 'confirm' ? 'Esta ação é irreversível' : 'Digite sua senha para confirmar'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {step === 'confirm' && (
            <>
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                <p className="text-sm font-bold text-rose-800 dark:text-rose-200">
                  Tem certeza que deseja excluir o animal <span className="underline">"{animal.name}"</span>?
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">
                  Todos os dados serão removidos permanentemente:
                </p>
                <ul className="text-xs text-rose-600 dark:text-rose-400 mt-1 ml-4 list-disc space-y-0.5">
                  <li>Fotos do animal</li>
                  <li>Histórico de movimentações</li>
                  <li>Registros de castração e vacinação</li>
                  <li>Registros de adoção e óbito</li>
                  <li>Todos os dados cadastrais</li>
                </ul>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStep}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Sim, excluir
                </button>
              </div>
            </>
          )}

          {step === 'password' && (
            <>
              <button
                type="button"
                onClick={() => { setStep('confirm'); setError(''); setPassword(''); }}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar
              </button>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  Para excluir <span className="font-bold">"{animal.name}"</span>, confirme sua identidade com email e senha.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleAuthenticateAndDelete(); }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold"
                    placeholder="Sua senha"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAuthenticateAndDelete}
                  disabled={loading || !email.trim() || !password.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Confirmar Exclusão
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
