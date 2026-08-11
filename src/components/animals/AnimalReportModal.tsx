import React, { useState, useEffect } from 'react';
import {
  X, FileText, Printer, Download, MapPin, Camera, Clock, Heart,
  Syringe, Scissors, AlertCircle, PawPrint, User, Calendar, Tag, Home
} from 'lucide-react';
import {
  Animal, LOCATION_LABELS, SPECIES_LABELS, SEX_LABELS, PORTE_LABELS,
  ORIGIN_LABELS, RESCUE_ORIGIN_LABELS
} from '../../types/animal';
import { CASTRATION_STATUS_LABELS } from '../../types/castrations';
import { getPublicPhotoUrl } from '../../context/lib/photos';
import { useAuditActions } from '../../context/useAuditActions';
import { fetchDocumentsByAnimal } from '../../services/animalDocumentService';
import { AnimalDocument, DOCUMENT_TYPE_LABELS, formatFileSize } from '../../types/animalDocument';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnimalReportModalProps {
  isOpen: boolean;
  animal: Animal;
  onClose: () => void;
}

function parseEntryDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }
  return null;
}

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ icon, title, children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}>
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20">
      <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const InfoRow: React.FC<{ label: string; value?: string | null; icon?: React.ReactNode }> = ({
  label, value, icon
}) => (
  <div className="flex items-start gap-2 py-1.5">
    {icon && <span className="mt-0.5 text-slate-400 dark:text-slate-500">{icon}</span>}
    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 min-w-[120px]">{label}:</span>
    <span className="text-sm font-semibold text-slate-900 dark:text-white">{value || 'Não informado'}</span>
  </div>
);

export const AnimalReportModal: React.FC<AnimalReportModalProps> = ({ isOpen, animal, onClose }) => {
  const { getPhotosByAnimal } = useAuditActions();

  const [documents, setDocuments] = useState<AnimalDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    if (!isOpen || !animal?.id) return;
    setLoadingDocs(true);
    fetchDocumentsByAnimal(animal.id)
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoadingDocs(false));
  }, [isOpen, animal?.id]);

  if (!isOpen) return null;

  const photos = getPhotosByAnimal(animal.id);
  const locationHistory = (animal.history || []).filter((h) => h.iconType === 'move');
  const generalHistory = (animal.history || []).filter((h) => {
    if (h.iconType === 'move') return false;
    const lower = (h.title + ' ' + h.description).toLowerCase();
    return !lower.includes('foto') && !lower.includes('documento');
  });

  const entryDateObj = parseEntryDate(animal.entryDate);
  const daysSinceEntry = entryDateObj
    ? Math.floor((Date.now() - entryDateObj.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const locationChangesCount = locationHistory.length;
  const vaccinationCount = [animal.vaccinationDate, animal.vaccinationDueDate].filter(Boolean).length;
  const castrationCount = animal.castrationStatus ? 1 : 0;
  const adoptionsCount = animal.adoptionDetails ? 1 : 0;

  const handlePrint = () => window.print();

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Prontuário Completo — ${animal.name}`, pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório detalhado do animal', pageWidth / 2, 22, { align: 'center' });
    y = 38;

    const addSection = (title: string, rows: (string | number)[][]) => {
      if (y > 260) { doc.addPage(); y = 15; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(title, 14, y);
      y += 2;
      doc.setDrawColor(16, 185, 129);
      doc.line(14, y, pageWidth - 14, y);
      y += 5;
      if (rows.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [],
          body: rows,
          theme: 'plain',
          styles: { fontSize: 9, cellPadding: 2, textColor: [51, 65, 85] },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
          margin: { left: 14, right: 14 }
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }
    };

    // 1. Dados Gerais
    addSection('1. Dados Gerais', [
      ['Nome', animal.name],
      ['Espécie', SPECIES_LABELS[animal.species] || animal.species],
      ['Sexo', SEX_LABELS[animal.sex] || animal.sex],
      ['Porte', animal.porte ? PORTE_LABELS[animal.porte] : 'Não informado'],
      ['Raça', animal.raca || 'Não informado'],
      ['Cor', animal.cor || 'Não informado'],
      ['Microchip', animal.microchip || 'Não informado'],
      ['Data de Entrada', animal.entryDate || 'Não informado'],
      ['Idade', animal.age || 'Não identificada'],
      ['Peso', animal.weight ? `${animal.weight} kg` : 'Não informado'],
      ['Status', animal.status === 'no_abrigo' ? 'No Abrigo' : animal.status === 'adotado' ? 'Adotado' : 'Óbito'],
      ['Localização Atual', LOCATION_LABELS[animal.currentLocation]?.label || animal.currentLocation]
    ]);

    // 2. Histórico de Localizações
    if (locationHistory.length > 0) {
      if (y > 260) { doc.addPage(); y = 15; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('2. Histórico de Localizações', 14, y);
      y += 2;
      doc.setDrawColor(16, 185, 129);
      doc.line(14, y, pageWidth - 14, y);
      y += 5;
      autoTable(doc, {
        startY: y,
        head: [['Data', 'Descrição']],
        body: locationHistory.map((h) => [h.date, h.description]),
        styles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 }
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // 3. Histórico Médico
    addSection('3. Histórico Médico', [
      ['Vacinação', animal.vaccinationDate || 'Não informado'],
      ['Próxima Vacina', animal.vaccinationDueDate || 'Não informado'],
      ['Status Castração', animal.castrationStatus ? CASTRATION_STATUS_LABELS[animal.castrationStatus as keyof typeof CASTRATION_STATUS_LABELS] : 'Não informado'],
      ['Data Castração', animal.castrationDate || 'Não informado'],
      ['Data Agendamento', animal.castrationScheduledDate || 'Não informado'],
      ['Veterinário', animal.castrationVeterinarian || 'Não informado']
    ]);

    // 4. Documentos
    if (documents.length > 0) {
      if (y > 260) { doc.addPage(); y = 15; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('4. Documentos', 14, y);
      y += 2;
      doc.setDrawColor(16, 185, 129);
      doc.line(14, y, pageWidth - 14, y);
      y += 5;
      autoTable(doc, {
        startY: y,
        head: [['Tipo', 'Data', 'Tamanho']],
        body: documents.map((d) => [
          DOCUMENT_TYPE_LABELS[d.documentType] || d.documentType,
          d.documentDate || d.createdAt?.split('T')[0] || '—',
          formatFileSize(d.fileSize)
        ]),
        styles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 }
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // 5. Observações
    addSection('5. Observações Gerais', [
      ['Observação Atual', animal.currentObservation || 'Nenhuma'],
      ['Notas de Entrada', animal.entryNotes || 'Nenhuma'],
      ['Notas de Origem', animal.originNotes || 'Nenhuma'],
      ['Notas Castração', animal.castrationNotes || 'Nenhuma']
    ]);

    // 6. Origem
    addSection('6. Informações de Origem', [
      ['Responsável Tutor', animal.originTutorName || 'Não identificado'],
      ['Contato Tutor', animal.originTutorContact || 'Contato não informado'],
      ['Origem', ORIGIN_LABELS[animal.origin] || animal.origin],
      ['Endereço Resgate', animal.rescueAddress || 'Não informado'],
      ['Origem Resgate', animal.rescueOrigin ? RESCUE_ORIGIN_LABELS[animal.rescueOrigin] : 'Não informado']
    ]);

    // 7. Resumo Estatístico
    if (y > 240) { doc.addPage(); y = 15; }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('7. Resumo Estatístico', 14, y);
    y += 2;
    doc.setDrawColor(16, 185, 129);
    doc.line(14, y, pageWidth - 14, y);
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [['Métrica', 'Valor']],
      body: [
        ['Dias desde entrada', String(daysSinceEntry)],
        ['Mudanças de local', String(locationChangesCount)],
        ['Fotos', String(photos.length)],
        ['Documentos', String(documents.length)],
        ['Vacinas registradas', String(vaccinationCount)],
        ['Castrações', String(castrationCount)],
        ['Adoções', String(adoptionsCount)]
      ],
      styles: { fontSize: 9, cellPadding: 2, textColor: [51, 65, 85] },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      margin: { left: 14, right: 14 }
    });

    doc.save(`prontuario_${animal.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-600 to-emerald-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Prontuário Completo</h2>
              <p className="text-sm text-emerald-100/80">{animal.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. Dados Gerais */}
          <SectionCard icon={<PawPrint className="w-4 h-4" />} title="1. Dados Gerais">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                {animal.photoUrl || animal.photos?.[0]?.storage_path ? (
                  <img
                    src={getPublicPhotoUrl(animal.photos?.[0]?.storage_path || animal.photoUrl || '')}
                    alt={animal.name}
                    className="w-28 h-28 rounded-2xl object-cover border-2 border-emerald-200 dark:border-emerald-800"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center border-2 border-emerald-200 dark:border-emerald-800">
                    <PawPrint className="w-10 h-10 text-emerald-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0.5">
                <InfoRow label="Nome" value={animal.name} icon={<User className="w-3 h-3" />} />
                <InfoRow label="Espécie" value={SPECIES_LABELS[animal.species]} icon={<PawPrint className="w-3 h-3" />} />
                <InfoRow label="Sexo" value={SEX_LABELS[animal.sex]} icon={<Tag className="w-3 h-3" />} />
                <InfoRow label="Porte" value={animal.porte ? PORTE_LABELS[animal.porte] : null} icon={<Tag className="w-3 h-3" />} />
                <InfoRow label="Raça" value={animal.raca} icon={<Tag className="w-3 h-3" />} />
                <InfoRow label="Cor" value={animal.cor} icon={<Tag className="w-3 h-3" />} />
                <InfoRow label="Microchip" value={animal.microchip} icon={<Tag className="w-3 h-3" />} />
                <InfoRow label="Data de Entrada" value={animal.entryDate} icon={<Calendar className="w-3 h-3" />} />
                <InfoRow label="Idade" value={animal.age} icon={<Clock className="w-3 h-3" />} />
                <InfoRow label="Peso" value={animal.weight ? `${animal.weight} kg` : null} icon={<Tag className="w-3 h-3" />} />
                <InfoRow
                  label="Status"
                  value={animal.status === 'no_abrigo' ? 'No Abrigo' : animal.status === 'adotado' ? 'Adotado' : 'Óbito'}
                  icon={<Heart className="w-3 h-3" />}
                />
                <InfoRow
                  label="Localização"
                  value={LOCATION_LABELS[animal.currentLocation]?.label}
                  icon={<MapPin className="w-3 h-3" />}
                />
              </div>
            </div>
          </SectionCard>

          {/* 2. Histórico de Localizações */}
          <SectionCard icon={<MapPin className="w-4 h-4" />} title="2. Histórico de Localizações">
            {locationHistory.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhum registro de movimentação.</p>
            ) : (
              <div className="relative ml-3 border-l-2 border-emerald-200 dark:border-emerald-800 space-y-4">
                {locationHistory.map((entry) => (
                  <div key={entry.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{entry.date}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{entry.description}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* 3. Histórico Médico */}
          <SectionCard icon={<Syringe className="w-4 h-4" />} title="3. Histórico Médico">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Syringe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Vacinação</span>
                </div>
                <InfoRow label="Última vacina" value={animal.vaccinationDate} />
                <InfoRow label="Próxima vacina" value={animal.vaccinationDueDate} />
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/20 rounded-xl p-4 border border-rose-200/50 dark:border-rose-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Scissors className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="text-sm font-bold text-rose-700 dark:text-rose-300">Castração</span>
                </div>
                <InfoRow
                  label="Status"
                  value={animal.castrationStatus ? CASTRATION_STATUS_LABELS[animal.castrationStatus as keyof typeof CASTRATION_STATUS_LABELS] : null}
                />
                <InfoRow label="Data" value={animal.castrationDate} />
                <InfoRow label="Agendamento" value={animal.castrationScheduledDate} />
                <InfoRow label="Veterinário" value={animal.castrationVeterinarian} />
                {animal.castrationNotes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 italic">{animal.castrationNotes}</p>
                )}
              </div>
            </div>
          </SectionCard>

          {/* 4. Medicações */}
          <SectionCard icon={<AlertCircle className="w-4 h-4" />} title="4. Medicações">
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhuma medicação registrada.</p>
          </SectionCard>

          {/* 5. Documentos */}
          <SectionCard icon={<FileText className="w-4 h-4" />} title="5. Documentos">
            {loadingDocs ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">Carregando documentos...</p>
            ) : documents.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhum documento anexado.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {doc.documentDate || doc.createdAt?.split('T')[0] || '—'}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      {formatFileSize(doc.fileSize)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* 6. Galeria */}
          <SectionCard icon={<Camera className="w-4 h-4" />} title="6. Galeria">
            {photos.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhuma foto na galeria.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                    <img
                      src={getPublicPhotoUrl(photo.storage_path)}
                      alt={`Foto ${photo.id}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {photo.is_primary && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-emerald-500 text-[8px] font-bold text-white">
                        Principal
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* 7. Histórico de Movimentações */}
          <SectionCard icon={<Clock className="w-4 h-4" />} title="7. Histórico de Movimentações">
            {generalHistory.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhum registro no histórico.</p>
            ) : (
              <div className="relative ml-3 border-l-2 border-emerald-200 dark:border-emerald-800 space-y-4">
                {generalHistory.map((entry) => (
                  <div key={entry.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{entry.date}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{entry.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{entry.description}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* 8. Observações Gerais */}
          <SectionCard icon={<AlertCircle className="w-4 h-4" />} title="8. Observações Gerais">
            <div className="space-y-3">
              {[
                { label: 'Observação Atual', value: animal.currentObservation },
                { label: 'Notas de Entrada', value: animal.entryNotes },
                { label: 'Notas de Origem', value: animal.originNotes },
                { label: 'Notas de Castração', value: animal.castrationNotes }
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{item.label}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                    {item.value || <span className="italic text-slate-400 dark:text-slate-500">Nenhuma</span>}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 9. Informações de Origem */}
          <SectionCard icon={<Home className="w-4 h-4" />} title="9. Informações de Origem">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
              <InfoRow label="Responsável Tutor" value={animal.originTutorName} icon={<User className="w-3 h-3" />} />
              <InfoRow label="Contato Tutor" value={animal.originTutorContact} icon={<User className="w-3 h-3" />} />
              <InfoRow label="Origem" value={ORIGIN_LABELS[animal.origin]} icon={<Home className="w-3 h-3" />} />
              <InfoRow label="Endereço Resgate" value={animal.rescueAddress} icon={<MapPin className="w-3 h-3" />} />
              <InfoRow
                label="Origem Resgate"
                value={animal.rescueOrigin ? RESCUE_ORIGIN_LABELS[animal.rescueOrigin] : null}
                icon={<MapPin className="w-3 h-3" />}
              />
            </div>
          </SectionCard>

          {/* 10. Resumo Estatístico */}
          <SectionCard icon={<Heart className="w-4 h-4" />} title="10. Resumo Estatístico">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { label: 'Dias no Abrigo', value: daysSinceEntry, bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200/50 dark:border-emerald-800/50', text: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Mudanças de Local', value: locationChangesCount, bg: 'bg-sky-50 dark:bg-sky-950/20', border: 'border-sky-200/50 dark:border-sky-800/50', text: 'text-sky-600 dark:text-sky-400' },
                { label: 'Fotos', value: photos.length, bg: 'bg-violet-50 dark:bg-violet-950/20', border: 'border-violet-200/50 dark:border-violet-800/50', text: 'text-violet-600 dark:text-violet-400' },
                { label: 'Documentos', value: documents.length, bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200/50 dark:border-amber-800/50', text: 'text-amber-600 dark:text-amber-400' },
                { label: 'Vacinas', value: vaccinationCount, bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-200/50 dark:border-cyan-800/50', text: 'text-cyan-600 dark:text-cyan-400' },
                { label: 'Castrações', value: castrationCount, bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-200/50 dark:border-rose-800/50', text: 'text-rose-600 dark:text-rose-400' },
                { label: 'Adoções', value: adoptionsCount, bg: 'bg-teal-50 dark:bg-teal-950/20', border: 'border-teal-200/50 dark:border-teal-800/50', text: 'text-teal-600 dark:text-teal-400' }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`p-3 rounded-xl ${stat.bg} border ${stat.border} text-center`}
                >
                  <p className={`text-xl font-black ${stat.text}`}>{stat.value}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm shadow-emerald-600/25 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar PDF
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm font-bold transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
