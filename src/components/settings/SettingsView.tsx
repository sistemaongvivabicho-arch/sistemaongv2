import React, { useState, useEffect } from 'react';
import { useAuth, Profile } from '../../context/AuthContext';
import { supabase } from '../../context/lib/supabase';
import { auditService } from '../../context/lib/auditService';
import { 
  User, 
  Shield, 
  Building2, 
  Database, 
  LogOut, 
  KeyRound, 
  UserPlus, 
  Users, 
  UserCheck, 
  UserX, 
  RefreshCw, 
  Search,
  Check,
  AlertCircle
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { profile, signOut } = useAuth();
  
  // Passwords state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Admin: User Management state
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Admin: Create User state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCpf, setNewUserCpf] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'common'>('common');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const fetchUsers = async () => {
    if (profile?.role !== 'admin') return;
    setListLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) {
        setUsersList(data as Profile[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUsers();
    }
  }, [profile]);

  const handleCpfFormatter = (val: string): string => {
    let clean = val.replace(/\D/g, '');
    if (clean.length > 11) clean = clean.slice(0, 11);
    if (clean.length > 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
    if (clean.length > 6) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    if (clean.length > 3) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    return clean;
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordLoading(true);

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas digitadas não coincidem.');
      setPasswordLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw new Error(error.message);
      
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');

      if (profile) {
        await auditService.log(
          'alteracao_senha',
          `${profile.name} alterou a própria senha.`,
          profile.name,
          profile.role
        );
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Erro ao alterar senha.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Admin: Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(false);
    setCreateLoading(true);

    const cleanCpf = newUserCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setCreateError('CPF inválido. Deve conter 11 dígitos.');
      setCreateLoading(false);
      return;
    }

    const cleanEmail = newUserEmail.trim();
    if (!cleanEmail) {
      setCreateError('Por favor, informe o e-mail do colaborador.');
      setCreateLoading(false);
      return;
    }

    try {
      // Call the secure Supabase Edge Function to create user & profile
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setCreateError('Sessão expirada. Faça login novamente.');
        setCreateLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('manage-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          action: 'create_user',
          email: cleanEmail,
          cpf: cleanCpf,
          name: newUserName.trim(),
          role: newUserRole
        }
      });

      const actualError = error || (data && data.error ? new Error(data.error) : null);
      if (actualError) throw actualError;

      setCreateSuccess(true);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserCpf('');
      setNewUserRole('common');
      fetchUsers();

      if (profile) {
        await auditService.log(
          'criacao_usuario',
          `${profile.name} criou o usuário "${newUserName.trim()}" (${cleanEmail}).`,
          profile.name,
          profile.role
        );
      }
    } catch (err: any) {
      setCreateError(err.message || 'Falha ao registrar usuário.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Admin: Toggle user status (active/inactive)
  const handleToggleStatus = async (targetUser: Profile) => {
    if (targetUser.id === profile?.id) {
      alert('Você não pode desativar a si mesmo.');
      return;
    }

    const nextStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: nextStatus })
        .eq('id', targetUser.id);

      if (error) throw new Error(error.message);
      
      fetchUsers();

      if (profile) {
        await auditService.log(
          'desativacao_usuario',
          `${profile.name} ${nextStatus === 'active' ? 'ativou' : 'desativou'} o usuário "${targetUser.name}".`,
          profile.name,
          profile.role
        );
      }
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  // Admin: Reset password
  const handleResetPassword = async (targetUser: Profile) => {
    const confirmReset = window.confirm(`Tem certeza que deseja resetar a senha de ${targetUser.name} para a senha inicial "1234"?`);
    if (!confirmReset) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Sessão expirada. Faça login novamente.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('manage-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          action: 'reset_password',
          target_uid: targetUser.id
        }
      });

      const actualError = error || (data && data.error ? new Error(data.error) : null);
      if (actualError) throw actualError;

      alert(`Senha de ${targetUser.name} resetada com sucesso para "1234".`);
      fetchUsers();

      if (profile) {
        await auditService.log(
          'reset_senha',
          `${profile.name} resetou a senha do usuário "${targetUser.name}".`,
          profile.name,
          profile.role
        );
      }
    } catch (err: any) {
      alert('Erro ao resetar senha: ' + err.message);
    }
  };

  const filteredUsers = usersList.filter(u => {
    const term = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.cpf.includes(term);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto items-start font-sans">
      
      {/* COLUMN 1: Profile & Password change */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 p-1.5 flex items-center justify-center shadow-sm shrink-0">
              <img 
                src="https://i.imgur.com/O6TcG0n.png" 
                alt="Logo ONG" 
                className="w-full h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            {profile && (
              <div>
                <h1 className="text-lg font-black text-slate-950 dark:text-white leading-tight">
                  {profile.name}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  {profile.role === 'admin' ? 'Administrador Geral' : 'Colaborador'}
                </p>
              </div>
            )}
          </div>

          {profile && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                <span className="text-xs text-slate-400 font-bold uppercase block tracking-wider">CPF Registrado</span>
                <p className="font-mono font-bold text-slate-950 dark:text-white mt-1 text-base">
                  {handleCpfFormatter(profile.cpf)}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                <span className="text-xs text-slate-400 font-bold uppercase block tracking-wider">E-mail Cadastrado</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {profile.email || 'Não informado'}
                </p>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => signOut()}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-extrabold text-xs transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Sair do Sistema
            </button>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            Alterar Senha
          </h2>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              Senha alterada com sucesso!
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Nova Senha
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all"
            >
              {passwordLoading ? 'Alterando...' : 'Atualizar Senha'}
            </button>
          </form>
        </div>
      </div>

      {/* COLUMN 2 & 3: ONG Data + Admin User Management Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* ONG Data Section - visible to all users */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-4.5 h-4.5 text-emerald-600" />
            Dados da ONG
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 font-bold block">Razao Social</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">ONG Associacao Viva Bicho</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 font-bold block">CNPJ</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">12.345.678/0001-90</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 flex items-start gap-3">
            <Database className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sm text-white block">Persistencia Ativa (Supabase)</span>
              <p className="text-xs leading-relaxed">
                O sistema esta totalmente conectado ao banco de dados relacional Supabase. Todas as operacoes de cadastros de animais, movimentacoes de setores e alteracoes de fichas estao sendo salvas de forma segura e compartilhadas em tempo real.
              </p>
            </div>
          </div>
        </div>

        {profile?.role === 'admin' && (
          <>
            {/* Create User Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                <UserPlus className="w-4.5 h-4.5 text-emerald-600" />
                Cadastrar Colaborador (Admin Only)
              </h2>

              {createSuccess && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Usuário cadastrado com sucesso! Senha inicial padrão: "1234".
                </div>
              )}

              {createError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Nome do Colaborador
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Ex: Carlos Andrade"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    E-mail do Colaborador
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="carlos@ong.org"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    CPF
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserCpf}
                    onChange={(e) => setNewUserCpf(handleCpfFormatter(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Função no Sistema
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'common')}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white text-sm font-bold"
                  >
                    <option value="common">Colaborador Comum</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={createLoading}
                  className="sm:col-span-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all"
                >
                  {createLoading ? 'Cadastrando no Supabase...' : 'Registrar Novo Usuário'}
                </button>
              </form>
            </div>

            {/* Users List Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-emerald-600" />
                  Lista de Colaboradores ({filteredUsers.length})
                </h2>
                
                {/* Search in Users */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome ou CPF..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {listLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Carregando lista...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">Nenhum colaborador encontrado.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-slate-500 tracking-wider">
                        <th className="py-3 px-3">Nome</th>
                        <th className="py-3 px-3">E-mail</th>
                        <th className="py-3 px-3">CPF</th>
                        <th className="py-3 px-3">Função</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850 transition-colors">
                          <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                            {u.name} {u.id === profile?.id && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-normal">(Você)</span>}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                            {u.email || '-'}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-semibold text-slate-600 dark:text-slate-400">
                            {handleCpfFormatter(u.cpf)}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                              {u.role === 'admin' ? 'Admin' : 'Colaborador'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={u.id === profile?.id}
                              title={u.status === 'active' ? 'Clique para desativar' : 'Clique para ativar'}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors disabled:opacity-50 ${u.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200'}`}
                            >
                              {u.status === 'active' ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Ativo
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3.5 h-3.5" />
                                  Inativo
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleResetPassword(u)}
                              title="Resetar senha para 1234"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors font-bold text-xs"
                            >
                              Resetar Senha
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
};
