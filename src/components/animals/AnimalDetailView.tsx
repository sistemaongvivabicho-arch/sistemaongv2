import React from 'react';
import { useAuditActions } from '../../context/useAuditActions';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  Dog, 
  MapPin, 
  Calendar, 
  User, 
  FileText, 
  History, 
  Edit3, 
  Heart, 
  Bird, 
  RotateCcw,
  ShieldCheck,
  Phone,
  Tag,
  AlertCircle,
  Syringe,
  Camera,
  Trash2,
  FolderOpen,
  ClipboardList
} from 'lucide-react';
import { 
  LOCATION_LABELS, 
  SPECIES_LABELS, 
  SEX_LABELS, 
  PORTE_LABELS,
  ORIGIN_LABELS,
  RESCUE_ORIGIN_LABELS,
  formatWeight
} from '../../types/animal';
import { PhotoUploader } from '../common/PhotoUploader';
import { PhotoGallery } from '../common/PhotoGallery';
import { DeleteAnimalModal } from '../modals/DeleteAnimalModal';
import { AnimalDocumentsModal } from './AnimalDocumentsModal';
import { AnimalReportModal } from './AnimalReportModal';

interface AnimalDetailViewProps {
  animalId: string;
  onOpenEditModal: (id: string) => void;
  onOpenChangeLocationModal: (id: string) => void;
  onOpenAdoptionModal: (id: string) => void;
  onOpenDeathModal: (id: string) => void;
  onOpenUndoModal: (id: string) => void;
}

export const AnimalDetailView: React.FC<AnimalDetailViewProps> = ({
  animalId,
  onOpenEditModal,
  onOpenChangeLocationModal,
  onOpenAdoptionModal,
  onOpenDeathModal,
  onOpenUndoModal
}) => {
  const { getAnimalById, setSelectedAnimalId, uploadAnimalPhoto, deleteAnimalPhoto, deleteSpecificPhoto, setPrimaryPhoto, getPhotosByAnimal } = useAuditActions();
  const { isAdmin } = useAuth();

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = React.useState(false);
  const [reportModalOpen, setReportModalOpen] = React.useState(false);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [animalId]);

  const animal = getAnimalById(animalId);

  if (!animal) {
    return (
      <div className="p-8 text-center space-y-4 bg-white dark:bg-slate-900 rounded-2xl border">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <p className="text-base font-bold">Animal não encontrado.</p>
        <button
          onClick={() => setSelectedAnimalId(null)}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          Voltar para a lista
        </button>
      </div>
    );
  }

  const currentLocation = LOCATION_LABELS[animal.currentLocation];
  const animalPhotos = getPhotosByAnimal(animal.id);

  // Status Badge styling
  let statusBadge = (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
      🏠 No Abrigo
    </span>
  );

  if (animal.status === 'adotado') {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
        ❤️ Adotado
      </span>
    );
  } else if (animal.status === 'obito') {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
        🕊️ Óbito
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedAnimalId(null)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <PhotoUploader
            avatar
            photoPath={animal.photoUrl}
            onUpload={(file) => uploadAnimalPhoto(animal.id, file)}
            onDelete={() => deleteAnimalPhoto(animal.id)}
          />

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {animal.name}
              </h1>
              {statusBadge}
            </div>
            <p className="text-xs font-mono text-slate-500 mt-1">
              Microchip: {animal.microchip || 'Não informado'}
            </p>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onOpenEditModal(animal.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Editar
          </button>

          {animal.status === 'no_abrigo' && (
            <>
              <button
                onClick={() => onOpenChangeLocationModal(animal.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Mudar Local
              </button>

              <button
                onClick={() => onOpenAdoptionModal(animal.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold transition-colors"
              >
                <Heart className="w-4 h-4 fill-rose-600/30" />
                Registrar Adoção
              </button>

              <button
                onClick={() => onOpenDeathModal(animal.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-colors"
              >
                <Bird className="w-4 h-4" />
                Registrar Óbito
              </button>
            </>
          )}

          <button
            onClick={() => setReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold transition-colors"
            title="Visualizar relatório completo do animal"
          >
            <ClipboardList className="w-4 h-4" />
            Visualizar Relatório
          </button>

          <button
            onClick={() => onOpenUndoModal(animal.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold transition-colors"
            title="Desfazer última alteração deste animal"
          >
            <RotateCcw className="w-4 h-4" />
            Desfazer
          </button>

          {isAdmin && (
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold transition-colors"
              title="Excluir animal permanentemente"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Animal
            </button>
          )}
        </div>
      </div>

      <DeleteAnimalModal
        isOpen={deleteModalOpen}
        animalId={animal.id}
        onClose={() => setDeleteModalOpen(false)}
        onDeleted={() => setSelectedAnimalId(null)}
      />

      {/* Photo Gallery Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-4">
          <Camera className="w-4 h-4 text-emerald-600" />
          Galeria de Fotos
        </h2>
        <PhotoGallery
          photos={animalPhotos}
          onUpload={(file) => uploadAnimalPhoto(animal.id, file)}
          onDeletePhoto={(photoId) => deleteSpecificPhoto(animal.id, photoId)}
          onDeleteAll={() => deleteAnimalPhoto(animal.id)}
          onSetPrimary={(photoId) => setPrimaryPhoto(animal.id, photoId)}
        />
      </div>

      {/* Documents Section */}
      <div
        onClick={() => setDocumentsModalOpen(true)}
        className="w-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Documentos do Animal
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Gerencie todos os documentos anexados deste animal.
              </p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/25 transition-colors group-hover:shadow-md">
            <FolderOpen className="w-4 h-4" />
            Abrir Documentos
          </button>
        </div>
      </div>

      <AnimalDocumentsModal
        isOpen={documentsModalOpen}
        animalId={animal.id}
        animalName={animal.name}
        onClose={() => setDocumentsModalOpen(false)}
      />

      <AnimalReportModal
        isOpen={reportModalOpen}
        animal={animal}
        onClose={() => setReportModalOpen(false)}
      />

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Primary Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Animal Basic Info */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Dog className="w-4 h-4 text-emerald-600" />
              Informações do Animal
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Nome</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{animal.name}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Microchip</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-xs">
                  {animal.microchip || 'Não informado'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Espécie</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {SPECIES_LABELS[animal.species]}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Sexo</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {SEX_LABELS[animal.sex]}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Porte</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {animal.porte ? PORTE_LABELS[animal.porte] : 'Não informado'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Raça</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {animal.raca || 'Não informado'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Cor</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {animal.cor || 'Não informado'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Idade</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {animal.age || 'Não identificada'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Peso</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatWeight(animal.weight)}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Health - Castration & Vaccination */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Syringe className="w-4 h-4 text-emerald-600" />
              Castração & Vacinação
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Castrado</span>
                {animal.castrado ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 mt-1">
                    Sim
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 mt-1">
                    Não
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Status Castração</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {animal.castrationStatus ? (
                    animal.castrationStatus.charAt(0).toUpperCase() + animal.castrationStatus.slice(1)
                  ) : 'Não agendada'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Data da Castração</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {animal.castrationDate || 'Não informada'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Castração Agendada</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {animal.castrationScheduledDate || 'Sem agendamento'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Veterinário</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {animal.castrationVeterinarian || 'Não informado'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Última Vacina</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {animal.vaccinationDate || 'Não informada'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Próxima Vacina</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {animal.vaccinationDueDate || 'Não informada'}
                </span>
              </div>

              {animal.castrationNotes && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 col-span-2 sm:col-span-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Observações da Castração</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {animal.castrationNotes}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section: Entry Origin & Tutor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Entry Info */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Entrada & Origem
              </h2>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Data de Entrada:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{animal.entryDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Origem do Resgate:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {ORIGIN_LABELS[animal.origin]}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Nº de Registro / Protocolo:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {animal.originProtocol || 'Não informado'}
                  </span>
                </div>
                {animal.originNotes && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-medium block">Observações da Entrada:</span>
                    <p className="text-slate-700 dark:text-slate-300 italic mt-0.5">
                      "{animal.originNotes}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Origin Tutor Info */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Tutor de Origem
              </h2>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Nome do Tutor:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {animal.originTutorName || 'Não identificado'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Contato:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {animal.originTutorContact || 'Contato não informado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Rescue Information */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Informações do Resgate
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Origem do Resgate:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {animal.rescueOrigin ? (RESCUE_ORIGIN_LABELS[animal.rescueOrigin] || animal.rescueOrigin) : 'Não informado'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Endereço do Resgate:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {animal.rescueAddress || 'Não informado'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Observação de Entrada:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {animal.entryNotes || 'Não informado'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Adoption or Death Details if exists */}
          {animal.status === 'adotado' && animal.adoptionDetails && (
            <div className="bg-rose-50 dark:bg-rose-950/30 p-6 rounded-2xl border border-rose-200 dark:border-rose-900 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <Heart className="w-4 h-4 fill-rose-600" />
                Informações da Adoção
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-rose-950 dark:text-rose-100 font-medium">
                <div>
                  <span className="text-rose-600 dark:text-rose-400 font-bold block">Novo Tutor:</span>
                  <span className="font-extrabold text-sm">{animal.adoptionDetails.adopterName}</span>
                </div>
                <div>
                  <span className="text-rose-600 dark:text-rose-400 font-bold block">Contato do Adotante:</span>
                  <span>{animal.adoptionDetails.adopterContact}</span>
                </div>
                <div>
                  <span className="text-rose-600 dark:text-rose-400 font-bold block">Data da Adoção:</span>
                  <span>{animal.adoptionDetails.adoptionDate}</span>
                </div>
                <div>
                  <span className="text-rose-600 dark:text-rose-400 font-bold block">Endereço:</span>
                  <span>{animal.adoptionDetails.adopterAddress || 'Não informado'}</span>
                </div>
                {animal.adoptionDetails.notes && (
                  <div className="col-span-2 pt-2 border-t border-rose-200/60 dark:border-rose-900/60">
                    <span className="text-rose-600 dark:text-rose-400 font-bold block">Observações da Adoção:</span>
                    <p className="italic">"{animal.adoptionDetails.notes}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {animal.status === 'obito' && animal.deathDetails && (
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Bird className="w-4 h-4" />
                Registro do Óbito
              </h2>

              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <p><span className="font-bold">Data do Óbito:</span> {animal.deathDetails.deathDate}</p>
                {animal.deathDetails.notes && (
                  <p><span className="font-bold">Observações:</span> "{animal.deathDetails.notes}"</p>
                )}
              </div>
            </div>
          )}

          {/* Section: Current Location & Observation */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Localização Atual & Estado
              </h2>

              {animal.status === 'no_abrigo' && (
                <button
                  onClick={() => onOpenChangeLocationModal(animal.id)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Alterar localização
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentLocation.icon}</span>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Setor Atual</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {currentLocation.label}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Observações Atuais:</span>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-slate-800 dark:text-slate-200">
                {animal.currentObservation || 'Nenhuma observação cadastrada.'}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: History Timeline (Section 22) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <History className="w-4 h-4 text-emerald-600" />
            Histórico de Movimentações
          </h2>

          <div className="space-y-6 relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 py-2">
            {animal.history
              .filter((hist) => {
                const title = (hist.title || '').toLowerCase();
                const desc = (hist.description || '').toLowerCase();
                if (title.includes('foto') || desc.includes('foto')) return false;
                if (title.includes('documento') || desc.includes('documento')) return false;
                if (title.includes('document') || desc.includes('document')) return false;
                return true;
              })
              .map((hist) => {
              let dotColor = 'bg-emerald-500';
              if (hist.iconType === 'move') dotColor = 'bg-indigo-500';
              if (hist.iconType === 'edit') dotColor = 'bg-blue-500';
              if (hist.iconType === 'adopt') dotColor = 'bg-rose-500';
              if (hist.iconType === 'death') dotColor = 'bg-slate-600';
              if (hist.iconType === 'undo') dotColor = 'bg-amber-500';

              return (
                <div key={hist.id} className="relative group">
                  <span className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full ${dotColor} ring-4 ring-white dark:ring-slate-900`}></span>
                  
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      {hist.date}
                    </span>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {hist.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                      {hist.description}
                    </p>
                    {hist.user && (
                      <span className="text-[10px] text-slate-400 italic block pt-0.5">
                        por {hist.user}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
