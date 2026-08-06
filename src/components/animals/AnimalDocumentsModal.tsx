import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Plus, FileText, Trash2, Edit3, Eye, AlertTriangle, Lock,
  ArrowLeft, Loader2, Check, XCircle, Image, File
} from 'lucide-react';
import { useAuditActions } from '../../context/useAuditActions';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../context/lib/supabase';
import {
  AnimalDocument, DOCUMENT_TYPE_LABELS, formatFileSize,
  isImageMime, isPdfMime
} from '../../types/animalDocument';
import { fetchDocumentsByAnimal, deleteDocument } from '../../services/animalDocumentService';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentViewModal } from './DocumentViewModal';

interface AnimalDocumentsModalProps {
  isOpen: boolean;
  animalId: string;
  animalName: string;
  onClose: () => void;
}

const DOCUMENT_TYPE_COLORS: Record<string, string> = {
  boletim_entrada: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  receita_veterinaria: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
  exame: 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
  laudo: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
  vacinacao: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400',
  castracao: 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
  contrato: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  rg_animal: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
  microchip: 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
  termo: 'bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
  atestado: 'bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400',
  personalizado: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
};

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => (
  <div className="fixed top-4 right-4 z-[70] max-w-sm animate-in slide-in-from-top-2 fade-in duration-300">
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

function getDocTypeIcon(doc: AnimalDocument) {
  if (isImageMime(doc.mimeType)) return <Image className="w-5 h-5" />;
  if (isPdfMime(doc.mimeType)) return <FileText className="w-5 h-5" />;
  return <File className="w-5 h-5" />;
}

export const AnimalDocumentsModal: React.FC<AnimalDocumentsModalProps> = ({
  isOpen,
  animalId,
  animalName,
  onClose
}) => {
  const { user } = useAuth();
  const { getAnimalById } = useAuditActions();

  const [documents, setDocuments] = useState<AnimalDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [editDoc, setEditDoc] = useState<AnimalDocument | null>(null);

  const [viewDoc, setViewDoc] = useState<AnimalDocument | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AnimalDocument | null>(null);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'password'>('confirm');
  const [deleteEmail, setDeleteEmail] = useState(user?.email || '');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!animalId) return;
    setLoading(true);
    try {
      const docs = await fetchDocumentsByAnimal(animalId);
      setDocuments(docs);
    } catch {
      setToast({ message: 'Erro ao carregar documentos.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [animalId]);

  useEffect(() => {
    if (isOpen && animalId) {
      loadDocuments();
    }
  }, [isOpen, animalId, loadDocuments]);

  useEffect(() => {
    if (isOpen) {
      setDeleteEmail(user?.email || '');
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleOpenDelete = (doc: AnimalDocument) => {
    setDeleteTarget(doc);
    setDeleteStep('confirm');
    setDeleteEmail(user?.email || '');
    setDeletePassword('');
    setDeleteError('');
  };

  const handleDeleteAuth = async () => {
    if (!deleteEmail.trim() || !deletePassword.trim()) {
      setDeleteError('Preencha o email e a senha.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: deleteEmail.trim(),
        password: deletePassword
      });

      if (authError) {
        setDeleteError('Senha incorreta. Tente novamente.');
        setDeleteLoading(false);
        return;
      }

      if (!deleteTarget) {
        setDeleteLoading(false);
        return;
      }

      await deleteDocument(deleteTarget.id);
      setToast({ message: 'Documento excluído com sucesso.', type: 'success' });
      closeDeleteModal();
      loadDocuments();
    } catch (err: any) {
      setDeleteError('Erro ao excluir: ' + (err.message || err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteStep('confirm');
    setDeleteEmail(user?.email || '');
    setDeletePassword('');
    setDeleteError('');
    setDeleteLoading(false);
  };

  const handleUploadSubmit = async (data: {
    file: File;
    documentType: string;
    customName?: string;
    documentDate: string;
    observation?: string;
  }) => {
    const { uploadDocument } = await import('../../services/animalDocumentService');
    await uploadDocument(
      animalId,
      data.file,
      data.documentType,
      data.customName,
      data.documentDate,
      data.observation,
      user?.email || undefined
    );
    setToast({ message: 'Documento enviado com sucesso.', type: 'success' });
    loadDocuments();
  };

  const handleEditSubmit = async (data: {
    file: File;
    documentType: string;
    customName?: string;
    documentDate: string;
    observation?: string;
  }) => {
    if (!editDoc) return;
    const { updateDocument, replaceDocumentFile } = await import('../../services/animalDocumentService');
    await updateDocument(editDoc.id, {
      documentType: data.documentType,
      customName: data.customName,
      documentDate: data.documentDate,
      observation: data.observation
    });
    if (data.file) {
      await replaceDocumentFile(editDoc.id, data.file);
    }
    setToast({ message: 'Documento atualizado com sucesso.', type: 'success' });
    setEditDoc(null);
    loadDocuments();
  };

  if (!isOpen) return null;

  const deleteModalOpen = deleteTarget !== null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Documentos do Animal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Todos os arquivos anexados deste animal.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditDoc(null); setShowUpload(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/25 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Documento
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nenhum documento cadastrado
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cadastre o primeiro documento para este animal.
                </p>
                <button
                  onClick={() => { setEditDoc(null); setShowUpload(true); }}
                  className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/25 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar primeiro documento
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {documents.map(doc => {
                  const colorClass = DOCUMENT_TYPE_COLORS[doc.documentType] || DOCUMENT_TYPE_COLORS.personalizado;
                  const label = doc.customName || DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType;

                  return (
                    <div
                      key={doc.id}
                      className="group bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden flex flex-col"
                    >
                      {/* Icon */}
                      <div className={`flex items-center justify-center py-6 ${colorClass.split(' ')[0]}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                          {getDocTypeIcon(doc)}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="px-3 pb-3 flex-1 flex flex-col">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={label}>
                          {label}
                        </p>
                        {doc.documentDate && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {new Date(doc.documentDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatFileSize(doc.fileSize)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex border-t border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => setViewDoc(doc)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Visualizar
                        </button>
                        <div className="w-px bg-slate-200 dark:bg-slate-700" />
                        <button
                          onClick={() => { setEditDoc(doc); setShowUpload(true); }}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <div className="w-px bg-slate-200 dark:bg-slate-700" />
                        <button
                          onClick={() => handleOpenDelete(doc)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto" onClick={closeDeleteModal}>
          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                  {deleteStep === 'confirm' ? <AlertTriangle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {deleteStep === 'confirm' ? 'Confirmar Exclusão' : 'Autenticar Exclusão'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {deleteStep === 'confirm' ? 'Esta ação é irreversível' : 'Digite sua senha para confirmar'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDeleteModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {deleteStep === 'confirm' && (
                <>
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                    <p className="text-sm font-bold text-rose-800 dark:text-rose-200">
                      Tem certeza que deseja excluir o documento{' '}
                      <span className="underline">"{deleteTarget.customName || DOCUMENT_TYPE_LABELS[deleteTarget.documentType] || deleteTarget.fileName}"</span>?
                    </p>
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">
                      Este arquivo será removido permanentemente do sistema.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={closeDeleteModal}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDeleteStep('password'); setDeleteError(''); }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Sim, excluir
                    </button>
                  </div>
                </>
              )}

              {deleteStep === 'password' && (
                <>
                  <button
                    type="button"
                    onClick={() => { setDeleteStep('confirm'); setDeleteError(''); setDeletePassword(''); }}
                    className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Voltar
                  </button>

                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                      Para excluir o documento, confirme sua identidade com email e senha.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={deleteEmail}
                        onChange={(e) => setDeleteEmail(e.target.value)}
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
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !deleteLoading) handleDeleteAuth(); }}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold"
                        placeholder="Sua senha"
                        autoFocus
                      />
                    </div>
                  </div>

                  {deleteError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{deleteError}</p>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeDeleteModal}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAuth}
                      disabled={deleteLoading || !deleteEmail.trim() || !deletePassword.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {deleteLoading ? (
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
      )}

      {/* Upload / Edit Modal */}
      <DocumentUploadModal
        isOpen={showUpload}
        onClose={() => { setShowUpload(false); setEditDoc(null); }}
        onSubmit={editDoc ? handleEditSubmit : handleUploadSubmit}
        isEdit={!!editDoc}
        initialData={editDoc ? {
          documentType: editDoc.documentType,
          customName: editDoc.customName,
          documentDate: editDoc.documentDate || '',
          observation: editDoc.observation,
          fileName: editDoc.fileName
        } : undefined}
      />

      {/* View Modal */}
      <DocumentViewModal
        isOpen={!!viewDoc}
        document={viewDoc}
        documents={documents}
        onClose={() => setViewDoc(null)}
        onNavigate={(doc) => setViewDoc(doc)}
      />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};
