-- ============================================================================
-- ONG VIVA BICHO — FASE 2: RLS, POLICIES E REALTIME
-- ============================================================================
-- Objetivo: deixar o novo projeto Supabase funcional para o frontend.
--
-- O que esta migration faz:
--   1. Cria funções auxiliares de segurança (is_admin, is_active_collaborator)
--   2. Habilita RLS em profiles e animals
--   3. Cria policies compatíveis com o funcionamento atual do app
--   4. Habilita Realtime na tabela animals
--
-- Modelo de acesso da aplicação (fonte: código-fonte):
--   - profiles:  usuário lê/atualiza o próprio perfil; admin lista e gerencia todos.
--   - animals:   qualquer colaborador autenticado e ativo faz CRUD completo.
--   - manage-users (edge function): usa service role (ignora RLS).
-- ============================================================================


-- ============================================================================
-- 1) FUNÇÕES AUXILIARES DE SEGURANÇA
-- ============================================================================
-- security definer + set search_path: evita recursão de RLS ao consultar
-- profiles dentro de policies de profiles.
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function public.is_active_collaborator()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'active'
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_collaborator() to authenticated;


-- ============================================================================
-- 2) RLS + POLICIES — PROFILES
-- ============================================================================

alter table public.profiles enable row level security;

-- SELECT: o usuário vê o próprio perfil; admin vê todos.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

-- INSERT: apenas admin (na prática a edge function usa service role).
drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

-- UPDATE: usuário atualiza o próprio perfil (ex.: first_access); admin atualiza qualquer um (ex.: status).
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- DELETE: apenas admin (não utilizado pelo app hoje, mas mantido seguro).
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- Garante privilégios para a role autenticada
grant select, insert, update, delete on public.profiles to authenticated;


-- ============================================================================
-- 3) RLS + POLICIES — ANIMALS
-- ============================================================================
-- Qualquer colaborador autenticado e com status 'active' pode operar as fichas.
-- ============================================================================

alter table public.animals enable row level security;

drop policy if exists "animals_select_active_collaborator" on public.animals;
create policy "animals_select_active_collaborator"
  on public.animals for select
  to authenticated
  using (public.is_active_collaborator());

drop policy if exists "animals_insert_active_collaborator" on public.animals;
create policy "animals_insert_active_collaborator"
  on public.animals for insert
  to authenticated
  with check (public.is_active_collaborator());

drop policy if exists "animals_update_active_collaborator" on public.animals;
create policy "animals_update_active_collaborator"
  on public.animals for update
  to authenticated
  using (public.is_active_collaborator());

drop policy if exists "animals_delete_active_collaborator" on public.animals;
create policy "animals_delete_active_collaborator"
  on public.animals for delete
  to authenticated
  using (public.is_active_collaborator());

-- Garante privilégios para a role autenticada
grant select, insert, update, delete on public.animals to authenticated;


-- ============================================================================
-- 4) REALTIME — TABELA ANIMALS
-- ============================================================================
-- O app escuta o canal 'public:animals' (postgres_changes) em src/context/AnimalContext.
-- ============================================================================

alter publication supabase_realtime add table public.animals;
