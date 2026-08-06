export interface AnimalDocument {
  id: string;
  animalId: string;
  documentType: string;
  customName?: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  documentDate?: string;
  observation?: string;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  boletim_entrada: 'Boletim de Entrada',
  receita_veterinaria: 'Receita Veterinária',
  exame: 'Exame',
  laudo: 'Laudo',
  vacinacao: 'Vacinação',
  castracao: 'Castração',
  contrato: 'Contrato',
  rg_animal: 'RG Animal',
  microchip: 'Microchip',
  termo: 'Termo',
  atestado: 'Atestado',
  personalizado: 'Documento Personalizado'
};

export const DOCUMENT_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export function isImageMime(mime: string): boolean {
  return mime.startsWith('image/');
}

export function isPdfMime(mime: string): boolean {
  return mime === 'application/pdf';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
