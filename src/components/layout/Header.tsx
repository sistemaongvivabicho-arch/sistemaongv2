import React, { useState, useRef, useEffect } from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { Menu, Plus, Bell, ChevronRight, X, Search } from 'lucide-react';
import { PRIORITY_COLORS, RECIPIENT_LABELS } from '../../types/alerts';
import { HeaderSearch } from './HeaderSearch';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNewAnimalModal: () => void;
  onOpenNewAlertModal?: () => void;
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return ts;
  }
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenNewAnimalModal, onOpenNewAlertModal }) => {
  const { activeTab, selectedAnimalId, getAnimalById, setSelectedAnimalId, setActiveTab } = useAnimalContext();
  const { profile } = useAuth();
  const { alerts, unreadCount, markAsRead, markAllAsRead } = useAlerts();
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedAnimal = selectedAnimalId ? getAnimalById(selectedAnimalId) : null;

  // Fechar painel ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    if (panelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelOpen]);

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    entrada: {
      title: 'Cadastro de Entrada',
      subtitle: 'Pesquise animais ou cadastre uma nova entrada'
    },
    triagem: {
      title: 'Animais em Triagem',
      subtitle: 'Animais recém-cadastrados aguardando avaliação de triagem'
    },
    no_abrigo: {
      title: 'Animais no Abrigo',
      subtitle: 'Listagem e controle dos animais atualmente acolhidos'
    },
    castracoes: {
      title: 'Castrações',
      subtitle: 'Agenda de castrações, agendamentos e registros do mês'
    },
    visualizacao: {
      title: 'Localizações',
      subtitle: 'Acompanhe os animais organizados pelo seu espaço físico atual'
    },
    adotados: {
      title: 'Adoções',
      subtitle: 'Histórico e registro de adoções concluídas'
    },
    obito: {
      title: 'Óbitos',
      subtitle: 'Registro e histórico respeitoso de animais falecidos'
    },
    relatorios: {
      title: 'Relatórios',
      subtitle: 'Dashboard gerencial com indicadores, gráficos e alertas'
    },
    avisos: {
      title: 'Avisos',
      subtitle: 'Central de comunicação interna da ONG'
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

  const recentAlerts = alerts.filter((a) => a.status === 'ativo').slice(0, 8);

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
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
              {selectedAnimal ? `Microchip: ${selectedAnimal.microchip || 'Não informado'} | Entrou em ${selectedAnimal.entryDate}` : currentTabInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search - Desktop */}
          <div className="hidden md:block">
            <HeaderSearch />
          </div>

          {/* Mobile Search Button */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Buscar"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Contextual Action Button */}
          {activeTab === 'entrada' && (
              <button
              onClick={onOpenNewAnimalModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all duration-150 active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Nova Entrada</span>
            </button>
          )}
          {activeTab === 'avisos' && (
              <button
              onClick={onOpenNewAlertModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all duration-150 active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Novo Aviso</span>
            </button>
          )}

          {/* Notification bell with counter */}
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setPanelOpen((v) => !v)}
              title="Notificações"
              className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] flex items-center justify-center px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold ring-2 ring-white dark:ring-slate-900">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Side Panel */}
            {panelOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notificações</h3>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <button
                        onClick={markAllAsRead}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                      >
                        Marcar tudo lido
                      </button>
                    )}
                    <button
                      onClick={() => setPanelOpen(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {recentAlerts.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Nenhuma notificação</p>
                    </div>
                  ) : (
                    recentAlerts.map((alert) => {
                      const colors = PRIORITY_COLORS[alert.priority];
                      return (
                        <button
                          key={alert.id}
                          onClick={() => {
                            markAsRead(alert.id);
                            setPanelOpen(false);
                            setActiveTab('avisos');
                          }}
                          className={`w-full text-left p-4 border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                            !alert.is_read ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors.dot}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className={`text-sm font-bold truncate ${!alert.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                  {alert.title}
                                </p>
                                {!alert.is_read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                {alert.message}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                <span>{alert.author_name}</span>
                                <span>·</span>
                                <span>{formatTimestamp(alert.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {alerts.length > 0 && (
                  <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setPanelOpen(false);
                        setActiveTab('avisos');
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      Ver todos os avisos
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {profile.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {profile.role === 'admin' ? 'Administrador' : 'Colaborador'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Panel */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-4 pt-2">
          <HeaderSearch />
        </div>
      )}
    </header>
  );
};
