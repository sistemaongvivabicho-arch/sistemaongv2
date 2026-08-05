import React, { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';

interface InstagramPhotoUploaderProps {
  photoPreview: string;
  onPhotoSelect: (file: File) => void;
  onPhotoRemove: () => void;
}

export const InstagramPhotoUploader: React.FC<InstagramPhotoUploaderProps> = ({
  photoPreview,
  onPhotoSelect,
  onPhotoRemove
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem (JPG, PNG, WEBP ou GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5 MB.');
      return;
    }

    setError('');
    onPhotoSelect(file);
  };

  const handleClick = () => {
    if (photoPreview) {
      setLightboxOpen(true);
    } else {
      inputRef.current?.click();
    }
  };

  const handleBackdropClick = () => {
    setLightboxOpen(false);
  };

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        {/* Miniatura estilo Instagram */}
        <button
          type="button"
          onClick={handleClick}
          className="relative w-24 h-24 rounded-full overflow-hidden border-3 border-white dark:border-slate-700 shadow-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer transition-transform hover:scale-105"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Foto do animal" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-8 h-8" />
          )}
          {!photoPreview && (
            <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
              <Camera className="w-4 h-4" />
            </span>
          )}
        </button>

        {/* Input de arquivo */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Botões de ação */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold transition-colors"
          >
            {photoPreview ? 'Trocar' : 'Adicionar'}
          </button>
          {photoPreview && (
            <button
              type="button"
              onClick={onPhotoRemove}
              className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold transition-colors"
            >
              Remover
            </button>
          )}
        </div>

        {/* Mensagem de erro */}
        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
        )}

        {/* Instrução */}
        <p className="text-[11px] text-slate-400 text-center">
          Toque na foto para ampliar
        </p>
      </div>

      {/* Lightbox */}
      {lightboxOpen && photoPreview && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          <div
            className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão fechar */}
            <button
              type="button"
              onClick={handleBackdropClick}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Imagem */}
            <img
              src={photoPreview}
              alt="Foto do animal em tamanho grande"
              className="w-full max-h-[70vh] object-contain bg-slate-950"
            />

            {/* Ações */}
            <div className="flex items-center justify-center gap-3 p-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setLightboxOpen(false);
                  inputRef.current?.click();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-sm font-semibold transition-colors"
              >
                <Camera className="w-4 h-4" />
                Trocar foto
              </button>
              <button
                type="button"
                onClick={() => {
                  setLightboxOpen(false);
                  onPhotoRemove();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-sm font-semibold transition-colors"
              >
                <X className="w-4 h-4" />
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
