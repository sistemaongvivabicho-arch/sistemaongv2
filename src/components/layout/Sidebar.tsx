import React from 'react';
import { useAnimalContext } from '../../context/AnimalContext';
import { useAuth } from '../../context/AuthContext';
import {
  ClipboardList,
  Dog,
  MapPin,
  HeartHandshake,
  Bird,
  LogOut,
  X,
  Scissors,
  BarChart3,
  ClipboardCheck
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { activeTab, setActiveTab, setSelectedAnimalId } = useAnimalContext();
  const { profile, signOut } = useAuth();

  const navItems = [
    { id: 'entrada', label: 'Cadastro de Entrada', icon: ClipboardList },
    { id: 'triagem', label: 'Triagem', icon: ClipboardCheck },
    { id: 'no_abrigo', label: 'Animais no Abrigo', icon: Dog },
    { id: 'castracoes', label: 'Castracoes', icon: Scissors },
    { id: 'visualizacao', label: 'Localizacoes', icon: MapPin },
    { id: 'adotados', label: 'Adocoes', icon: HeartHandshake },
    { id: 'obito', label: 'Obitos', icon: Bird },
    { id: 'relatorios', label: 'Relatorios', icon: BarChart3 }
  ];

  const handleNavClick = (id: string) => {
    setSelectedAnimalId(null);
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    signOut();
  };

  const userName = profile?.name || 'Colaborador';
  const userRole = profile?.role === 'admin' ? 'Administrador' : 'Colaborador';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800 w-64 shrink-0 select-none">
      {/* ONG Brand / Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center p-1 shadow-md shrink-0">
            <img
              src="https://i.imgur.com/O6TcG0n.png"
              alt="Logo ONG Viva Bicho"
              className="w-full h-full object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white leading-snug">ONG Viva Bicho</h1>
            <p className="text-xs text-emerald-400 font-medium">Controle de Animais</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu Principal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="https://i.imgur.com/O6TcG0n.png"
                alt="Logo ONG"
                className="w-full h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[11px] text-slate-400 truncate">{userRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-50 h-full max-w-xs w-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
