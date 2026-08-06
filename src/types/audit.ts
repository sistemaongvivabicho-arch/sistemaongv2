export type AuditActionType =
  | 'cadastro_animal'
  | 'exclusao_animal'
  | 'alteracao_cadastro'
  | 'alteracao_especie'
  | 'alteracao_sexo'
  | 'alteracao_localizacao'
  | 'entrada_triagem'
  | 'saida_triagem'
  | 'adocao'
  | 'registro_obito'
  | 'alteracao_vacinacao'
  | 'agendamento_castracao'
  | 'alteracao_agendamento'
  | 'exclusao_agendamento'
  | 'upload_foto'
  | 'troca_foto'
  | 'exclusao_foto'
  | 'animal_delete'
  | 'exclusao_aviso'
  | 'login'
  | 'logout'
  | 'alteracao_senha'
  | 'criacao_usuario'
  | 'edicao_usuario'
  | 'desativacao_usuario'
  | 'reset_senha'
  | 'backup_gerado'
  | 'backup_erro'
  | 'documento_criado'
  | 'documento_editado'
  | 'documento_substituido'
  | 'documento_excluido';

export interface AuditLogEntry {
  id: string;
  user_name: string;
  user_role: 'admin' | 'common' | 'sistema';
  timestamp: string;
  animal_id: string | null;
  animal_name: string | null;
  action_type: AuditActionType;
  description: string;
  details?: string;
}

export const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
  cadastro_animal: 'Cadastro de animal',
  exclusao_animal: 'Exclusão de cadastro',
  alteracao_cadastro: 'Alteração de cadastro',
  alteracao_especie: 'Alteração de espécie',
  alteracao_sexo: 'Alteração de sexo',
  alteracao_localizacao: 'Alteração de localização',
  entrada_triagem: 'Entrada na triagem',
  saida_triagem: 'Saída da triagem',
  adocao: 'Adoção',
  registro_obito: 'Registro de óbito',
  alteracao_vacinacao: 'Alteração de vacinação',
  agendamento_castracao: 'Agendamento de castração',
  alteracao_agendamento: 'Alteração de agendamento',
  exclusao_agendamento: 'Exclusão de agendamento',
  upload_foto: 'Upload de foto',
  troca_foto: 'Troca de foto',
  exclusao_foto: 'Exclusão de foto',
  animal_delete: 'Exclusão de animal',
  exclusao_aviso: 'Exclusão de aviso',
  login: 'Login',
  logout: 'Logout',
  alteracao_senha: 'Alteração de senha',
  criacao_usuario: 'Criação de usuário',
  edicao_usuario: 'Edição de usuário',
  desativacao_usuario: 'Ativação/Desativação',
  reset_senha: 'Reset de senha',
  backup_gerado: 'Backup gerado',
  backup_erro: 'Erro no backup',
  documento_criado: 'Documento criado',
  documento_editado: 'Documento editado',
  documento_substituido: 'Documento substituído',
  documento_excluido: 'Documento excluído'
};

export const AUDIT_ACTION_COLORS: Record<AuditActionType, string> = {
  cadastro_animal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  exclusao_animal: 'bg-rose-50 text-rose-700 border-rose-200',
  alteracao_cadastro: 'bg-blue-50 text-blue-700 border-blue-200',
  alteracao_especie: 'bg-violet-50 text-violet-700 border-violet-200',
  alteracao_sexo: 'bg-pink-50 text-pink-700 border-pink-200',
  alteracao_localizacao: 'bg-amber-50 text-amber-700 border-amber-200',
  entrada_triagem: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  saida_triagem: 'bg-teal-50 text-teal-700 border-teal-200',
  adocao: 'bg-rose-50 text-rose-700 border-rose-200',
  registro_obito: 'bg-slate-100 text-slate-700 border-slate-300',
  alteracao_vacinacao: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  agendamento_castracao: 'bg-orange-50 text-orange-700 border-orange-200',
  alteracao_agendamento: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  exclusao_agendamento: 'bg-red-50 text-red-700 border-red-200',
  upload_foto: 'bg-green-50 text-green-700 border-green-200',
  troca_foto: 'bg-lime-50 text-lime-700 border-lime-200',
  exclusao_foto: 'bg-red-50 text-red-700 border-red-200',
  animal_delete: 'bg-red-100 text-red-800 border-red-300',
  exclusao_aviso: 'bg-red-50 text-red-700 border-red-200',
  login: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  logout: 'bg-slate-100 text-slate-700 border-slate-300',
  alteracao_senha: 'bg-amber-50 text-amber-700 border-amber-200',
  criacao_usuario: 'bg-blue-50 text-blue-700 border-blue-200',
  edicao_usuario: 'bg-violet-50 text-violet-700 border-violet-200',
  desativacao_usuario: 'bg-rose-50 text-rose-700 border-rose-200',
  reset_senha: 'bg-orange-50 text-orange-700 border-orange-200',
  backup_gerado: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  backup_erro: 'bg-red-50 text-red-700 border-red-200',
  documento_criado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  documento_editado: 'bg-blue-50 text-blue-700 border-blue-200',
  documento_substituido: 'bg-amber-50 text-amber-700 border-amber-200',
  documento_excluido: 'bg-red-50 text-red-700 border-red-200'
};
