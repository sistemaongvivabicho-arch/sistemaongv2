import React, { useState, useEffect } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { 
  X, 
  Dog, 
  User, 
  ShieldAlert, 
  MapPin, 
  ClipboardList, 
  FileText, 
  Check, 
  AlertCircle,
  Camera,
  UploadCloud
} from 'lucide-react';
import { 
  SpeciesType, 
  SexType, 
  EntryOrigin,
  RESCUE_ORIGIN_OPTIONS
} from '../../types/animal';

interface NewAnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewAnimalModal: React.FC<NewAnimalModalProps> = ({ isOpen, onClose }) => {
  const { addAnimal, navigateToAnimal, uploadAnimalPhoto } = useAnimalContext();

  const todayStr = new Date().toISOString().split('T')[0];

  // Essential required fields
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<SpeciesType>('cachorro');
  const [sex, setSex] = useState<SexType>('macho');
  const [entryDate, setEntryDate] = useState(
    `${new Date().getDate().toString().padStart(2, '0')}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}`
  );

  // Optional fields
  const [microchip, setMicrochip] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');

  // Origin tutor
  const [originTutorName, setOriginTutorName] = useState('');
  const [originTutorContact, setOriginTutorContact] = useState('');

  // Entry origin details
  const [origin, setOrigin] = useState<EntryOrigin>('resgate_ong');
  const [originProtocol, setOriginProtocol] = useState('');
  const [originNotes, setOriginNotes] = useState('');

  // Rescue information
  const [rescueOrigin, setRescueOrigin] = useState('');
  const [rescueAddress, setRescueAddress] = useState('');
  const [entryNotes, setEntryNotes] = useState('');

  // Current observation
  const [currentObservation, setCurrentObservation] = useState('');

  // Health: castration & vaccination
  const [castrado, setCastrado] = useState(false);
  const [castrationDate, setCastrationDate] = useState('');
  const [castrationScheduledDate, setCastrationScheduledDate] = useState('');
  const [vaccinationDate, setVaccinationDate] = useState('');
  const [vaccinationDueDate, setVaccinationDueDate] = useState('');

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile);
      setPhotoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPhotoPreview('');
  }, [photoFile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Por favor, informe o nome do animal.');
      return;
    }

    setSubmitting(true);
    try {
      const createdId = await addAnimal({
        name: name.trim(),
        microchip: microchip.trim() || undefined,
        species,
        sex,
        age: age.trim() || undefined,
        weight: weight.trim() ? (weight.trim().toLowerCase().endsWith('kg') ? weight.trim() : `${weight.trim()} kg`) : undefined,
        entryDate: entryDate || '26/07/2026',
        currentLocation: 'triagem',
        origin,
        originProtocol: originProtocol.trim() || undefined,
        originNotes: originNotes.trim() || undefined,
        rescueOrigin: rescueOrigin || undefined,
        rescueAddress: rescueAddress.trim() || undefined,
        entryNotes: entryNotes.trim() || undefined,
        originTutorName: originTutorName.trim() || undefined,
        originTutorContact: originTutorContact.trim() || undefined,
        currentObservation: currentObservation.trim() || undefined,
        castrado,
        castrationDate: castrationDate.trim() || undefined,
        castrationScheduledDate: castrationScheduledDate.trim() || undefined,
        vaccinationDate: vaccinationDate.trim() || undefined,
        vaccinationDueDate: vaccinationDueDate.trim() || undefined
      });

      if (createdId) {
        if (photoFile) {
          await uploadAnimalPhoto(createdId, photoFile);
        }
        onClose();
        navigateToAnimal(createdId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              🐾
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Nova Entrada de Animal
              </h2>
              <p className="text-xs text-slate-500">
                Cadastre as informações essenciais para controle do abrigo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* SEÇÃO 1: INFORMAÇÕES DO ANIMAL */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Dog className="w-4 h-4" />
              1. Informações do Animal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome (Obrigatório) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Animal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Thor, Luna, Bob..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              {/* Microchip (Opcional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Microchip <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={microchip}
                  onChange={(e) => setMicrochip(e.target.value)}
                  placeholder="Ex: 982000123456789"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Se em branco: exibirá "Não informado"
                </span>
              </div>

              {/* Espécie (Obrigatório) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Espécie <span className="text-rose-500">*</span>
                </label>
                <select
                  value={species}
                  onChange={(e) => setSpecies(e.target.value as SpeciesType)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cachorro">Cachorro</option>
                  <option value="gato">Gato</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              {/* Sexo (Obrigatório) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sexo <span className="text-rose-500">*</span>
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as SexType)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="macho">Macho</option>
                  <option value="femea">Fêmea</option>
                </select>
              </div>

              {/* Data de Entrada (Obrigatório) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Data de Entrada <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Idade (Opcional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Idade <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ex: 2 anos, 5 meses..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Se em branco: exibirá "Não identificada"
                </span>
              </div>

              {/* Peso (Opcional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Peso <span className="text-emerald-600 dark:text-emerald-400 font-bold">(em kg)</span> <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Ex: 25"
                    className="w-full p-2.5 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    kg
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Se em branco: exibirá "Não informado"
                </span>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: TUTOR DE ORIGEM (Opcional) */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              2. Tutor de Origem (Opcional)
            </h3>
            <p className="text-xs text-slate-500">
              Caso o animal seja de resgate sem tutor conhecido, pode deixar estes campos em branco.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Tutor
                </label>
                <input
                  type="text"
                  value={originTutorName}
                  onChange={(e) => setOriginTutorName(e.target.value)}
                  placeholder="Deixe em branco se não identificado"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contato do Tutor
                </label>
                <input
                  type="text"
                  value={originTutorContact}
                  onChange={(e) => setOriginTutorContact(e.target.value)}
                  placeholder="Telefone / Celular"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: ORIGEM DA ENTRADA */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              3. Origem da Entrada
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Origem do Resgate <span className="text-rose-500">*</span>
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value as EntryOrigin)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="guarda_municipal">Guarda Municipal</option>
                  <option value="resgate_ong">Resgate pela ONG</option>
                  <option value="entrega_voluntaria">Entrega voluntária</option>
                  <option value="resgate_emergencia">Resgate de emergência</option>
                  <option value="terceiros">Terceiros</option>
                  <option value="nao_informado">Não informado</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nº do Registro / Protocolo
                </label>
                <input
                  type="text"
                  value={originProtocol}
                  onChange={(e) => setOriginProtocol(e.target.value)}
                  placeholder="Ex: GM-2026-0841"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações da Entrada
                </label>
                <textarea
                  rows={2}
                  value={originNotes}
                  onChange={(e) => setOriginNotes(e.target.value)}
                  placeholder="Ex: Animal resgatado pela Guarda Municipal após denúncia de maus-tratos..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: INFORMAÇÕES DO RESGATE */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              4. Informações do Resgate
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Origem do Resgate
                </label>
                <select
                  value={rescueOrigin}
                  onChange={(e) => setRescueOrigin(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione a origem do resgate</option>
                  {RESCUE_ORIGIN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Endereço do Resgate
                </label>
                <input
                  type="text"
                  value={rescueAddress}
                  onChange={(e) => setRescueAddress(e.target.value)}
                  placeholder="Informe onde o animal foi encontrado"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observação de Entrada
                </label>
                <textarea
                  rows={2}
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  placeholder="Descreva as condições em que o animal foi encontrado..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 5: LOCALIZAÇÃO INICIAL */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              5. Localização Inicial no Abrigo <span className="text-rose-500">*</span>
            </h3>

            <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Triagem <span className="text-sky-700 dark:text-sky-300 font-bold">(EM TRIAGEM)</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Todo animal cadastrado entra automaticamente em triagem. A localização definitiva será definida após o término da triagem.
                </p>
              </div>
            </div>
          </div>

          {/* SEÇÃO 6: CASTRAÇÃO E VACINAÇÃO */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              6. Castração e Vacinação
            </h3>

            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={castrado}
                onChange={(e) => setCastrado(e.target.checked)}
                className="w-5 h-5 rounded-md accent-emerald-600"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Animal castrado
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Data da Castração <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={castrationDate}
                  onChange={(e) => setCastrationDate(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  disabled={!castrado}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Castração Agendada <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={castrationScheduledDate}
                  onChange={(e) => setCastrationScheduledDate(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  disabled={castrado}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Última Vacina <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={vaccinationDate}
                  onChange={(e) => setVaccinationDate(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Próxima Vacina <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={vaccinationDueDate}
                  onChange={(e) => setVaccinationDueDate(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 7: OBSERVAÇÕES ATUAIS */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              7. Observações Atuais / Estado de Saúde
            </h3>

            <textarea
              rows={2}
              value={currentObservation}
              onChange={(e) => setCurrentObservation(e.target.value)}
              placeholder="Ex: Animal tranquilo e alimentando-se normalmente. Aguardando triagem..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* SEÇÃO 7: FOTO DO ANIMAL (Opcional) */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              8. Foto do Animal (Opcional)
            </h3>

            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                  <img src={photoPreview} alt="Prévia da foto" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                  <Camera className="w-8 h-8" />
                </div>
              )}

              <div className="space-y-2">
                <input
                  id="new-animal-photo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    if (!file.type.startsWith('image/')) {
                      alert('Selecione um arquivo de imagem (JPG, PNG, WEBP ou GIF).');
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      alert('A imagem deve ter no máximo 5 MB.');
                      return;
                    }
                    setPhotoFile(file);
                  }}
                />
                <label
                  htmlFor="new-animal-photo-input"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  {photoFile ? 'Trocar foto' : 'Adicionar foto'}
                </label>

                {photoFile && (
                  <button
                    type="button"
                    onClick={() => setPhotoFile(null)}
                    className="block text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Remover seleção
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              A foto será enviada logo após o cadastro do animal. Máximo 5 MB.
            </p>
          </div>

          {/* Buttons Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Registrar Entrada
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
