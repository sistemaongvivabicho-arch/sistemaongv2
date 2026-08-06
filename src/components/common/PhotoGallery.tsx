import React, { useRef, useState } from 'react';
import { Camera, Loader2, Trash2, UploadCloud, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimalPhoto } from '../../types/animal';
import { getPublicPhotoUrl } from '../../context/lib/photos';

interface PhotoGalleryProps {
  photos: AnimalPhoto[];
  onUpload: (file: File) => Promise<string | null>;
  onDeletePhoto: (photoId: string) => Promise<boolean>;
  onDeleteAll: () => Promise<boolean>;
  onSetPrimary: (photoId: string) => Promise<boolean>;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onUpload,
  onDeletePhoto,
  onDeleteAll,
  onSetPrimary
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  const primaryPhoto = photos.find((p) => p.is_primary) || photos[0];
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
      setError('Selecione um arquivo de imagem (JPG, PNG, WEBP ou GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no maximo 5 MB.');
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

  const handleDelete = async (photoId: string) => {
    setDeleting(photoId);
    const ok = await onDeletePhoto(photoId);
    setDeleting(null);
    if (ok && lightboxOpen) {
      setLightboxOpen(false);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    await onSetPrimary(photoId);
  };

  const scrollGallery = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -120 : 120;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const currentLightboxPhoto = sortedPhotos[lightboxIndex];

  if (photos.length === 0) {
    return (
      <div className="space-y-3">
        <div className="w-full h-48 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Camera className="w-10 h-10" />
          <span className="text-xs font-bold">Nenhuma foto cadastrada</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4" />
          )}
          {uploading ? 'Enviando...' : 'Adicionar Foto'}
        </button>

        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Photo Display */}
      <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
        {primaryPhoto ? (
          <img
            src={getPublicPhotoUrl(primaryPhoto.storage_path)}
            alt="Foto principal do animal"
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => {
              const idx = sortedPhotos.findIndex((p) => p.id === primaryPhoto.id);
              openLightbox(idx >= 0 ? idx : 0);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Camera className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-bold backdrop-blur-sm">
          Principal
        </div>
      </div>

      {/* Horizontal Gallery */}
      <div className="relative">
        <button
          type="button"
          onClick={() => scrollGallery('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-7 py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {sortedPhotos.map((photo, idx) => (
            <div
              key={photo.id}
              className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                photo.is_primary
                  ? 'border-blue-500 ring-2 ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
              }`}
              onClick={() => openLightbox(idx)}
            >
              <img
                src={getPublicPhotoUrl(photo.storage_path)}
                alt={`Foto ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {photo.is_primary && (
                <div className="absolute top-0.5 right-0.5">
                  <Star className="w-3 h-3 text-blue-500 fill-blue-500" />
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollGallery('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4" />
          )}
          {uploading ? 'Enviando...' : 'Adicionar Foto'}
        </button>

        {photos.length > 0 && (
          <button
            type="button"
            onClick={onDeleteAll}
            disabled={uploading}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Foto
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      )}

      {/* Lightbox */}
      {lightboxOpen && currentLightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getPublicPhotoUrl(currentLightboxPhoto.storage_path)}
              alt="Foto do animal em tamanho grande"
              className="w-full max-h-[70vh] object-contain"
            />
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {!currentLightboxPhoto.is_primary && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSetPrimary(currentLightboxPhoto.id);
                      setLightboxOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold transition-colors"
                  >
                    <Star className="w-4 h-4" />
                    Definir como principal
                  </button>
                )}
                {currentLightboxPhoto.is_primary && (
                  <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
                    <Star className="w-4 h-4 fill-blue-500" />
                    Foto Principal
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDelete(currentLightboxPhoto.id)}
                  disabled={deleting === currentLightboxPhoto.id}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {deleting === currentLightboxPhoto.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Remover
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
        </div>
      )}
    </div>
  );
};
