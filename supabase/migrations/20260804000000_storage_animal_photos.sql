-- ============================================================================
-- ONG VIVA BICHO — FASE 10: STORAGE PARA FOTOS DOS ANIMAIS
-- ============================================================================
-- Objetivo: permitir o upload/exibição de fotos nas fichas dos animais.
--
-- O que esta migration cria:
--   1. Bucket 'animal-photos' (público, até 5 MB, só imagens)
--   2. Policies de storage.objects compatíveis com o modelo de acesso do app
--
-- Modelo de acesso (reutiliza as funções criadas na FASE 2):
--   - SELECT: qualquer um autenticado/anon (bucket público -> URL pública).
--   - INSERT/UPDATE/DELETE: apenas colaborador autenticado e ativo.
-- ============================================================================


-- ============================================================================
-- 1) BUCKET animal-photos
-- ============================================================================
-- Público: a URL pública funciona sem autenticação (necessário para o <img>).
-- file_size_limit em bytes (5 MB). allowed_mime_types restrito a imagens.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'animal-photos',
    'animal-photos',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;


-- ============================================================================
-- 2) RLS + POLICIES — STORAGE.OBJECTS (apenas para o bucket animal-photos)
-- ============================================================================

-- SELECT: leitura pública do bucket (URL pública usada no frontend).
drop policy if exists "animal_photos_select_public" on storage.objects;
create policy "animal_photos_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'animal-photos');

-- INSERT: colaborador ativo pode enviar fotos.
drop policy if exists "animal_photos_insert_active_collaborator" on storage.objects;
create policy "animal_photos_insert_active_collaborator"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'animal-photos'
    and public.is_active_collaborator()
  );

-- UPDATE: colaborador ativo pode sobrescrever (upsert) fotos.
drop policy if exists "animal_photos_update_active_collaborator" on storage.objects;
create policy "animal_photos_update_active_collaborator"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'animal-photos' and public.is_active_collaborator())
  with check (bucket_id = 'animal-photos' and public.is_active_collaborator());

-- DELETE: colaborador ativo pode remover fotos.
drop policy if exists "animal_photos_delete_active_collaborator" on storage.objects;
create policy "animal_photos_delete_active_collaborator"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'animal-photos' and public.is_active_collaborator());

-- Garante privilégios para a role autenticada
grant select, insert, update, delete on storage.objects to authenticated;
