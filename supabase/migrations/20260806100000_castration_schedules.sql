-- Migration: Create castration_schedules table
-- Stores all castration schedule data previously kept in localStorage

create table if not exists public.castration_schedules (
    id                  text primary key,
    animal_id           uuid not null references public.animals(id) on delete cascade,
    animal_name         text not null,
    animal_species      text not null default 'outro',
    scheduled_date      text not null,
    performed_date      text,
    veterinarian        text not null default '',
    notes               text not null default '',
    status              text not null default 'agendada'
                        check (status in ('agendada', 'confirmada', 'realizada', 'cancelada', 'reagendada')),
    created_at          timestamptz not null default now(),
    created_by          text not null default 'Sistema',
    created_by_role     text not null default 'common',
    updated_at          timestamptz,
    updated_by          text,
    cancel_reason       text,
    history             jsonb not null default '[]'::jsonb
);

-- Indexes
create index if not exists idx_castration_schedules_animal_id on public.castration_schedules(animal_id);
create index if not exists idx_castration_schedules_status on public.castration_schedules(status);
create index if not exists idx_castration_schedules_scheduled_date on public.castration_schedules(scheduled_date);

-- Enable RLS
alter table public.castration_schedules enable row level security;

-- Policies
create policy "Authenticated collaborators can view castration schedules"
    on public.castration_schedules for select
    to authenticated
    using (public.is_active_collaborator());

create policy "Authenticated collaborators can insert castration schedules"
    on public.castration_schedules for insert
    to authenticated
    with check (public.is_active_collaborator());

create policy "Authenticated collaborators can update castration schedules"
    on public.castration_schedules for update
    to authenticated
    using (public.is_active_collaborator());

create policy "Authenticated collaborators can delete castration schedules"
    on public.castration_schedules for delete
    to authenticated
    using (public.is_active_collaborator());

-- Enable realtime
alter publication supabase_realtime add table public.castration_schedules;

-- Migrate existing localStorage data will be handled by the frontend on first load
