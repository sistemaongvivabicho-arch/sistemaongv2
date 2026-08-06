import React, { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { AnimalDocument, isImageMime, isPdfMime } from '../../types/animalDocument';
import { getDocumentSignedUrl } from '../../services/animalDocumentService';

interface DocumentViewModalProps {
  isOpen: boolean;
  document: AnimalDocument | null;
  documents: AnimalDocument[];
  onClose: () => void;
  onNavigate: (doc: AnimalDocument) => void;
}

export const DocumentViewModal: React.FC<DocumentViewModalProps> = ({
  isOpen,
  document: currentDoc,
  documents,
  onClose,
  onNavigate
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!isOpen || !currentDoc) return;
    setLoading(true);
    setZoom(1);
    getDocumentSignedUrl(currentDoc.filePath)
      .then(setUrl)
      .catch(() => setUrl(null))
      .finally(() => setLoading(false));
  }, [isOpen, currentDoc]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') navigatePrev();
      if (e.key === 'ArrowRight') navigateNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, currentDoc, documents]);

  const currentIndex = documents.findIndex(d => d.id === currentDoc?.id);

  const navigatePrev = () => {
    if (currentIndex > 0) onNavigate(documents[currentIndex - 1]);
  };

  const navigateNext = () => {
    if (currentIndex < documents.length - 1) onNavigate(documents[currentIndex + 1]);
  };

  const handleDownload = () => {
    if (!url || !currentDoc) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = currentDoc.fileName;
    a.click();
  };

  if (!isOpen || !currentDoc) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm font-bold text-white">{currentDoc.fileName}</p>
            <p className="text-[11px] text-white/60">
              {currentIndex + 1} de {documents.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isImageMime(currentDoc.mimeType) && (
            <>
              <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                <ZoomIn className="w-4 h-4" />
              </button>
            </>
          )}
          <button onClick={handleDownload} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={navigatePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {currentIndex < documents.length - 1 && (
        <button
          onClick={navigateNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Content */}
      <div className="w-full h-full flex items-center justify-center p-16" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : isImageMime(currentDoc.mimeType) && url ? (
          <img
            src={url}
            alt={currentDoc.fileName}
            className="max-w-full max-h-full object-contain transition-transform"
            style={{ transform: `scale(${zoom})` }}
          />
        ) : isPdfMime(currentDoc.mimeType) && url ? (
          <iframe
            src={url}
            className="w-full h-full rounded-xl bg-white"
            title={currentDoc.fileName}
          />
        ) : (
          <div className="text-center text-white/60">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-sm font-bold">Não foi possível carregar o documento</p>
          </div>
        )}
      </div>
    </div>
  );
};
