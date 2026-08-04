import React from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, Plus, Bell, ChevronRight, Dog } from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNewAnimalModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenNewAnimalModal }) => {
  const { activeTab, selectedAnimalId, getAnimalById, setSelectedAnimalId } = useAnimalContext();
  const { profile } = useAuth();

  const selectedAnimal = selectedAnimalId ? getAnimalById(selectedAnimalId) : null;

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Visão geral dos animais e movimentações da ONG'
    },
    no_abrigo: {
      title: 'Animais no Abrigo',
      subtitle: 'Listagem e controle dos animais atualmente acolhidos'
    },
    triagem: {
      title: 'Animais em Triagem',
      subtitle: 'Animais recém-cadastrados aguardando avaliação de triagem'
    },
    visualizacao: {
      title: 'Visualização por Localização',
      subtitle: 'Acompanhe os animais organizados pelo seu espaço físico atual'
    },
    adotados: {
      title: 'Animais Adotados',
      subtitle: 'Histórico e registro de adoções concluídas'
    },
    obito: {
      title: 'Óbitos Registrados',
      subtitle: 'Registro e histórico respeitoso de animais falecidos'
    },
    configuracoes: {
      title: 'Configurações',
      subtitle: 'Informações do perfil e preferências do sistema'
    }
  };

  const currentTabInfo = tabTitles[activeTab] || {
    title: 'Sistema de Animais',
    subtitle: 'Gestão da ONG'
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left Title Area */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div>
            {selectedAnimal ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <button
                  onClick={() => setSelectedAnimalId(null)}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
                >
                  {currentTabInfo.title}
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Ficha do Animal</span>
              </div>
            ) : null}

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {selectedAnimal ? selectedAnimal.name : currentTabInfo.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
              {selectedAnimal ? `Microchip: ${selectedAnimal.microchip || 'Não informado'} | Entrou em ${selectedAnimal.entryDate}` : currentTabInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Animal Button */}
          <button
            onClick={onOpenNewAnimalModal}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all duration-150 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Nova Entrada</span>
          </button>

          {/* Notification bell mock */}
          <button
            title="Notificações"
            className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          {/* User Avatar with ONG Logo */}
          <div className="hidden md:flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
              <img 
                src="https://i.imgur.com/O6TcG0n.png" 
                alt="Logo ONG" 
                className="w-full h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            {profile && (
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {profile.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {profile.role === 'admin' ? 'Administrador' : 'Colaborador'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
