import React, { useState, useRef } from 'react';
import { Upload, Camera, FileText, X } from 'lucide-react';
import { DOCUMENT_TYPE_OPTIONS } from '../../types/animalDocument';
import { DatePicker } from '../common/DatePicker';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    file: File;
    documentType: string;
    customName?: string;
    documentDate: string;
    observation?: string;
  }) => Promise<void>;
  initialData?: {
    documentType: string;
    customName?: string;
    documentDate: string;
    observation?: string;
    fileName?: string;
  };
  isEdit?: boolean;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false
}) => {
  const [documentType, setDocumentType] = useState(initialData?.documentType || '');
  const [customName, setCustomName] = useState(initialData?.customName || '');
  const [documentDate, setDocumentDate] = useState(initialData?.documentDate || '');
  const [observation, setObservation] = useState(initialData?.observation || '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen && initialData) {
      setDocumentType(initialData.documentType || '');
      setCustomName(initialData.customName || '');
      setDocumentDate(initialData.documentDate || '');
      setObservation(initialData.observation || '');
    }
    if (!isOpen) {
      setFile(null);
      setPreview(null);
      setError('');
    }
  }, [isOpen, initialData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selected.type)) {
      setError('Tipo de arquivo não permitido. Use PDF, JPG, JPEG, PNG ou WEBP.');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setFile(selected);
    setError('');

    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!isEdit && !file) {
      setError('Selecione um arquivo.');
      return;
    }
    if (!documentType) {
      setError('Selecione o tipo do documento.');
      return;
    }
    if (!documentDate) {
      setError('Informe a data do documento.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSubmit({
        file: file!,
        documentType,
        customName: documentType === 'personalizado' ? customName : undefined,
        documentDate,
        observation
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar documento.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEdit ? 'Editar Documento' : 'Novo Documento'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEdit ? 'Altere os dados do documento' : 'Adicione um novo documento ao animal'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isEdit && initialData?.fileName && (
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                Arquivo Atual
              </label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-600 dark:text-slate-300 flex-1 truncate">{initialData.fileName}</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  Substituir Arquivo
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file && (
                <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">{file.name}</span>
                  <button onClick={() => { setFile(null); setPreview(null); }} className="ml-auto">
                    <X className="w-3.5 h-3.5 text-emerald-600 hover:text-emerald-800" />
                  </button>
                </div>
              )}
              {preview && (
                <img src={preview} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-xl" />
              )}
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                Arquivo
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-bold"
                >
                  <Upload className="w-4 h-4" />
                  Selecionar Arquivo
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-bold"
                >
                  <Camera className="w-4 h-4" />
                  Tirar Foto
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file && (
                <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">{file.name}</span>
                  <button onClick={() => { setFile(null); setPreview(null); }} className="ml-auto">
                    <X className="w-3.5 h-3.5 text-emerald-600 hover:text-emerald-800" />
                  </button>
                </div>
              )}
              {preview && (
                <img src={preview} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-xl" />
              )}
            </div>
          )}

          {isEdit && initialData?.fileName && (
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-600 dark:text-slate-300">{initialData.fileName}</span>
              <span className="text-xs text-slate-400 ml-auto">Arquivo atual</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">
              Tipo do Documento
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Selecione...</option>
              {DOCUMENT_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {documentType === 'personalizado' && (
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">
                Nome do Documento
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex: Laudo radiológico"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">
              Data do Documento
            </label>
            <DatePicker value={documentDate} onChange={setDocumentDate} />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">
              Observações
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Observações opcionais..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm shadow-emerald-600/25 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Documento'}
          </button>
        </div>
      </div>
    </div>
  );
};
