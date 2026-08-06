import React, { useState } from 'react';
import { AnimalProvider, useAnimalContext } from './context/AnimalContext';
import { AuditProvider } from './context/AuditContext';
import { AlertProvider } from './context/AlertContext';
import { CastrationsProvider } from './context/CastrationsContext';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { ResultsListView } from './components/dashboard/ResultsListView';
import { ShelterAnimalsView } from './components/animals/ShelterAnimalsView';
import { TriageAnimalsView } from './components/animals/TriageAnimalsView';
import { LocationVisualizationView } from './components/animals/LocationVisualizationView';
import { AdoptedAnimalsView } from './components/animals/AdoptedAnimalsView';
import { DeceasedAnimalsView } from './components/animals/DeceasedAnimalsView';
import { CadastroEntradaView } from './components/animals/CadastroEntradaView';
import { CastracoesView } from './components/animals/CastracoesView';
import { AuditLogView } from './components/animals/AuditLogView';
import { AlertsView } from './components/alerts/AlertsView';
import { SettingsView } from './components/settings/SettingsView';
import { BackupView } from './components/backup/BackupView';
import { AnimalDetailView } from './components/animals/AnimalDetailView';

// Auth Views
import { LoginView } from './components/auth/LoginView';
import { FirstAccessChangePasswordView } from './components/auth/FirstAccessChangePasswordView';

// Modals
import { NewAnimalModal } from './components/modals/NewAnimalModal';
import { EditAnimalModal } from './components/modals/EditAnimalModal';
import { ChangeLocationModal } from './components/modals/ChangeLocationModal';
import { RegisterAdoptionModal } from './components/modals/RegisterAdoptionModal';
import { RegisterDeathModal } from './components/modals/RegisterDeathModal';
import { UndoConfirmModal } from './components/modals/UndoConfirmModal';
import { ToastContainer } from './components/common/ToastContainer';

const MainAppContent: React.FC = () => {
  const { activeTab, selectedAnimalId, resultsList } = useAnimalContext();
  const { user, profile, loading, signOut } = useAuth();

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedAnimalId, activeTab]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal triggers & targeted animal id
  const [isNewAnimalModalOpen, setIsNewAnimalModalOpen] = useState(false);
  const [targetedAnimalId, setTargetedAnimalId] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangeLocationModalOpen, setIsChangeLocationModalOpen] = useState(false);
  const [isAdoptionModalOpen, setIsAdoptionModalOpen] = useState(false);
  const [isDeathModalOpen, setIsDeathModalOpen] = useState(false);
  const [isUndoModalOpen, setIsUndoModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const openEditModal = (id: string) => {
    setTargetedAnimalId(id);
    setIsEditModalOpen(true);
  };

  const openChangeLocationModal = (id: string) => {
    setTargetedAnimalId(id);
    setIsChangeLocationModalOpen(true);
  };

  const openAdoptionModal = (id: string) => {
    setTargetedAnimalId(id);
    setIsAdoptionModalOpen(true);
  };

  const openDeathModal = (id: string) => {
    setTargetedAnimalId(id);
    setIsDeathModalOpen(true);
  };

  const openUndoModal = (id: string) => {
    setTargetedAnimalId(id);
    setIsUndoModalOpen(true);
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-slate-500">Carregando sistema...</p>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!user || !profile) {
    return <LoginView />;
  }

  // 3. Inactive Account State
  if (profile.status === 'inactive') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 font-sans text-slate-900 dark:text-slate-100">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-lg">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Conta Desativada</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              O seu perfil de colaborador foi desativado pela coordenação. Entre em contato com um administrador do sistema.
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-all"
          >
            Voltar para o Login
          </button>
        </div>
      </div>
    );
  }

  // 4. First Access Change Password State
  if (profile.first_access) {
    return <FirstAccessChangePasswordView />;
  }

  // 5. Normal Authenticated Application
  const renderActiveView = () => {
    if (selectedAnimalId) {
      return (
        <AnimalDetailView
          animalId={selectedAnimalId}
          onOpenEditModal={openEditModal}
          onOpenChangeLocationModal={openChangeLocationModal}
          onOpenAdoptionModal={openAdoptionModal}
          onOpenDeathModal={openDeathModal}
          onOpenUndoModal={openUndoModal}
        />
      );
    }

    if (resultsList && resultsList.length > 0) {
      return (
        <ResultsListView
          onOpenEditModal={openEditModal}
          onOpenChangeLocationModal={openChangeLocationModal}
        />
      );
    }

    switch (activeTab) {
      case 'entrada':
        return (
          <CadastroEntradaView
            onOpenNewAnimalModal={() => setIsNewAnimalModalOpen(true)}
          />
        );
      case 'triagem':
        return (
          <TriageAnimalsView
            onOpenEditModal={openEditModal}
            onOpenChangeLocationModal={openChangeLocationModal}
          />
        );
      case 'no_abrigo':
        return (
          <ShelterAnimalsView
            onOpenEditModal={openEditModal}
            onOpenChangeLocationModal={openChangeLocationModal}
          />
        );
      case 'castracoes':
        return <CastracoesView />;
      case 'visualizacao':
        return <LocationVisualizationView />;
      case 'adotados':
        return <AdoptedAnimalsView />;
      case 'obito':
        return <DeceasedAnimalsView />;
      case 'relatorios':
        return <DashboardView />;
      case 'auditoria':
        return <AuditLogView />;
      case 'avisos':
        return (
          <AlertsView
            isModalOpen={isAlertModalOpen}
            onModalClose={() => setIsAlertModalOpen(false)}
          />
        );
      case 'configuracoes':
        return <SettingsView />;
      case 'backup':
        return <BackupView />;
      default:
        return (
          <AlertsView
            isModalOpen={isAlertModalOpen}
            onModalClose={() => setIsAlertModalOpen(false)}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNewAnimalModal={() => setIsNewAnimalModalOpen(true)}
          onOpenNewAlertModal={() => setIsAlertModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Modals */}
      <NewAnimalModal
        isOpen={isNewAnimalModalOpen}
        onClose={() => setIsNewAnimalModalOpen(false)}
      />

      <EditAnimalModal
        isOpen={isEditModalOpen}
        animalId={targetedAnimalId}
        onClose={() => setIsEditModalOpen(false)}
      />

      <ChangeLocationModal
        isOpen={isChangeLocationModalOpen}
        animalId={targetedAnimalId}
        onClose={() => setIsChangeLocationModalOpen(false)}
      />

      <RegisterAdoptionModal
        isOpen={isAdoptionModalOpen}
        animalId={targetedAnimalId}
        onClose={() => setIsAdoptionModalOpen(false)}
      />

      <RegisterDeathModal
        isOpen={isDeathModalOpen}
        animalId={targetedAnimalId}
        onClose={() => setIsDeathModalOpen(false)}
      />

      <UndoConfirmModal
        isOpen={isUndoModalOpen}
        animalId={targetedAnimalId}
        onClose={() => setIsUndoModalOpen(false)}
      />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AnimalProvider>
      <AuditProvider>
        <AlertProvider>
          <CastrationsProvider>
            <MainAppContent />
          </CastrationsProvider>
        </AlertProvider>
      </AuditProvider>
    </AnimalProvider>
  );
}
