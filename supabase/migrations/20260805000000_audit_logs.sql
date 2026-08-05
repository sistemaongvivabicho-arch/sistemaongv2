-- ============================================================================
-- ONG VIVA BICHO — MIGRAÇÃO: TABELA DE AUDITORIA (REGISTRO DE ALTERAÇÕES)
-- ============================================================================
-- Objetivo: criar tabela audit_logs para registro permanente de todas as
-- alterações realizadas pelos usuários no sistema.
--
-- A tabela é append-only: registros nunca são apagados automaticamente.
-- Somente administradores podem visualizar os registros via interface.
-- ============================================================================

create table if not exists public.audit_logs (
    id           uuid        primary key default gen_random_uuid(),
    user_name    text        not null,
    user_role    text        not null default 'common',
    timestamp    timestamptz not null default now(),
    animal_id    uuid        not null,
    animal_name  text        not null,
    action_type  text        not null,
    description  text        not null,
    details      text
);

-- Regras de conteúdo
alter table public.audit_logs
    add constraint audit_logs_user_role_check
        check (user_role in ('admin', 'common', 'sistema')),
    add constraint audit_logs_action_type_check
        check (action_type in (
            'cadastro_animal',
            'exclusao_animal',
            'alteracao_cadastro',
            'alteracao_especie',
            'alteracao_sexo',
            'alteracao_localizacao',
            'entrada_triagem',
            'saida_triagem',
            'adocao',
            'registro_obito',
            'alteracao_vacinacao',
            'agendamento_castracao',
            'alteracao_agendamento',
            'exclusao_agendamento',
            'upload_foto',
            'troca_foto',
            'exclusao_aviso',
            'login',
            'logout',
            'alteracao_senha',
            'criacao_usuario',
            'edicao_usuario',
            'desativacao_usuario',
            'reset_senha'
        ));

-- Índices para consultas comuns
create index if not exists idx_audit_logs_timestamp    on public.audit_logs (timestamp desc);
create index if not exists idx_audit_logs_animal_id    on public.audit_logs (animal_id);
create index if not exists idx_audit_logs_user_name    on public.audit_logs (user_name);
create index if not exists idx_audit_logs_action_type  on public.audit_logs (action_type);

comment on table public.audit_logs is
    'Registro permanente de todas as alterações realizadas no sistema (auditoria).';

-- ============================================================================
-- RLS: somente admin pode ler; qualquer colaborador ativo pode inserir
-- (o app insere registros via client, mas só admin visualiza)
-- ============================================================================

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin"
    on public.audit_logs for select
    to authenticated
    using (public.is_admin());

drop policy if exists "audit_logs_insert_collaborator" on public.audit_logs;
create policy "audit_logs_insert_collaborator"
    on public.audit_logs for insert
    to authenticated
    with check (public.is_active_collaborator());

-- Garante privilégios
grant select, insert on public.audit_logs to authenticated;
