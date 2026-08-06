-- Migration: Create photos table for multi-photo support
-- Each animal can have multiple photos, one marked as primary

create table if not exists public.photos (
    id          uuid primary key default gen_random_uuid(),
    animal_id   uuid not null references public.animals(id) on delete cascade,
    storage_path text not null,
    is_primary  boolean not null default false,
    created_at  timestamptz not null default now()
);

-- Index for fast lookups by animal
create index if not exists idx_photos_animal_id on public.photos(animal_id);

-- Enable RLS
alter table public.photos enable row level security;

-- Policies: authenticated collaborators can read, write
create policy "Authenticated collaborators can view animal photos"
    on public.photos for select
    to authenticated
    using (public.is_active_collaborator());

create policy "Authenticated collaborators can insert animal photos"
    on public.photos for insert
    to authenticated
    with check (public.is_active_collaborator());

create policy "Authenticated collaborators can update animal photos"
    on public.photos for update
    to authenticated
    using (public.is_active_collaborator());

create policy "Authenticated collaborators can delete animal photos"
    on public.photos for delete
    to authenticated
    using (public.is_active_collaborator());

-- Enable realtime
alter publication supabase_realtime add table public.photos;

-- Migrate existing photo_url data into the photos table
-- Only for animals that have a photo_url but no photos yet
insert into public.photos (animal_id, storage_path, is_primary, created_at)
select id, photo_url, true, now()
from public.animals
where photo_url is not null
  and photo_url != ''
  and not exists (
    select 1 from public.photos where animal_id = animals.id
  );
