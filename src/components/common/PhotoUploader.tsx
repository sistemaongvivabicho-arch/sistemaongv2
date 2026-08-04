import React, { useRef, useState } from 'react';
import { Camera, Loader2, Trash2, UploadCloud, X } from 'lucide-react';
import { getPublicPhotoUrl } from '../../context/lib/photos';

interface PhotoUploaderProps {
  photoPath?: string;
  onUpload: (file: File) => Promise<string | null>;
  onDelete: () => Promise<boolean>;
  avatar?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photoPath,
  onUpload,
  onDelete,
  avatar = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageUrl = photoPath ? getPublicPhotoUrl(photoPath) : '';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setUploading(true);
    const result = await onUpload(file);
    setUploading(false);
    if (!result) {
      setError('Falha ao enviar a foto. Tente novamente.');
    }
  };

  const handleDelete = async () => {
    setError('');
    setUploading(true);
    const ok = await onDelete();
    setUploading(false);
    if (!ok) {
      setError('Falha ao remover a foto. Tente novamente.');
    } else {
      setLightboxOpen(false);
    }
  };

  if (avatar) {
    return (
      <>
        <div className="relative w-16 h-16 group shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() => {
              if (uploading) return;
              if (photoPath) {
                setLightboxOpen(true);
              } else {
                inputRef.current?.click();
              }
            }}
            title={photoPath ? 'Ver foto em tamanho grande' : 'Adicionar foto'}
            className="relative w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer"
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Foto do animal" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-6 h-6" />
            )}

            {!uploading && (
              <span className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></span>
            )}

            {uploading && (
              <span className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            title={photoPath ? 'Trocar foto' : 'Adicionar foto'}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 dark:bg-blue-500 text-white border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md transition-transform group-hover:scale-110 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {error && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{error}</p>
        )}

        {lightboxOpen && photoPath && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <div
              className="relative max-w-3xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imageUrl}
                alt="Foto do animal em tamanho grande"
                className="w-full max-h-[80vh] object-contain"
              />
              <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover foto
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        {imageUrl ? (
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
            <img src={imageUrl} alt="Foto do animal" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
            <Camera className="w-8 h-8" />
          </div>
        )}

        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            {uploading ? 'Enviando...' : photoPath ? 'Substituir foto' : 'Adicionar foto'}
          </button>

          {photoPath && !uploading && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remover foto
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">{error}</p>
      )}
    </div>
  );
};
