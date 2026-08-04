-- ============================================================================
-- ONG VIVA BICHO — FASE 6: CORREÇÃO DE RLS — UPDATE EM public.profiles
-- ============================================================================
-- Vulnerabilidade: a policy "profiles_update_own_or_admin" permitia que um
-- usuário autenticado alterasse a PRÓPRIA linha com qualquer valor, pois o
-- "with check (auth.uid() = id or public.is_admin())" era satisfeito por
-- "auth.uid() = id". Isso viabilizava, via chamada direta à API (PostgREST):
--   1. ELEVAÇÃO DE PRIVILÉGIO: um 'common' promovendo o próprio role para 'admin';
--   2. AUTO-REATIVAÇÃO: um usuário 'inactive' reativando o próprio status.
--
-- Correção: substituir a policy única por duas policies separadas:
--   - profiles_update_own  : o usuário altera apenas a própria linha, sem poder
--                            mudar role nem status (novos valores precisam ser
--                            iguais aos valores atuais);
--   - profiles_update_admin: somente admin altera role/status de qualquer linha.
--
-- Fluxos do app preservados:
--   - first_access: o usuário atualiza o próprio first_access (FirstAccessChangePasswordView);
--   - status: o admin altera o status de qualquer perfil (SettingsView);
--   - criação de usuários: edge function manage-users (service role, ignora RLS).
-- ============================================================================


-- ============================================================================
-- 1) REMOVER A POLICY VULNERÁVEL
-- ============================================================================

drop policy if exists "profiles_update_own_or_admin" on public.profiles;


-- ============================================================================
-- 2) POLICY: USUÁRIO ALTERA A PRÓPRIA LINHA (SEM ALTERAR ROLE/STATUS)
-- ============================================================================
-- using: só a própria linha pode ser alvo do UPDATE.
-- with check: o novo role e o novo status devem ser iguais aos valores atuais
-- (subquery lê o estado já persistido), impedindo autopromoção e auto-reativação.
-- ============================================================================

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and status = (select p.status from public.profiles p where p.id = auth.uid())
  );


-- ============================================================================
-- 3) POLICY: SOMENTE ADMIN ALTERA QUALQUER LINHA (INCLUINDO ROLE/STATUS)
-- ============================================================================

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
