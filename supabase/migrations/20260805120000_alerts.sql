-- ============================================================================
-- ONG VIVA BICHO — MIGRAÇÃO: TABELA DE AVISOS E NOTIFICAÇÕES
-- ============================================================================

create table if not exists public.alerts (
    id           uuid        primary key default gen_random_uuid(),
    title        text        not null,
    message      text        not null,
    priority     text        not null default 'media',
    recipient    text        not null default 'todos',
    author_name  text        not null,
    author_role  text        not null default 'common',
    created_at   timestamptz not null default now(),
    expires_at   timestamptz,
    status       text        not null default 'ativo',
    is_read      boolean     not null default false,
    is_reminder  boolean     not null default false
);

-- Constraints
alter table public.alerts
    add constraint alerts_priority_check
        check (priority in ('baixa', 'media', 'alta')),
    add constraint alerts_recipient_check
        check (recipient in ('todos', 'administracao', 'veterinaria', 'recepcao')),
    add constraint alerts_status_check
        check (status in ('ativo', 'expirado', 'arquivado')),
    add constraint alerts_author_role_check
        check (author_role in ('admin', 'common'));

-- Índices
create index if not exists idx_alerts_created_at    on public.alerts (created_at desc);
create index if not exists idx_alerts_status        on public.alerts (status);
create index if not exists idx_alerts_priority      on public.alerts (priority);
create index if not exists idx_alerts_recipient     on public.alerts (recipient);
create index if not exists idx_alerts_is_read       on public.alerts (is_read);

comment on table public.alerts is
    'Central de avisos e notificações internas da ONG.';

-- ============================================================================
-- RLS: qualquer colaborador ativo pode ler; somente admin pode escrever
-- ============================================================================

alter table public.alerts enable row level security;

drop policy if exists "alerts_select_active_collaborator" on public.alerts;
create policy "alerts_select_active_collaborator"
    on public.alerts for select
    to authenticated
    using (public.is_active_collaborator());

drop policy if exists "alerts_insert_admin" on public.alerts;
create policy "alerts_insert_admin"
    on public.alerts for insert
    to authenticated
    with check (public.is_admin());

drop policy if exists "alerts_update_admin" on public.alerts;
create policy "alerts_update_admin"
    on public.alerts for update
    to authenticated
    using (public.is_admin());

drop policy if exists "alerts_delete_admin" on public.alerts;
create policy "alerts_delete_admin"
    on public.alerts for delete
    to authenticated
    using (public.is_admin());

grant select, insert, update, delete on public.alerts to authenticated;
