-- ============================================================================
-- ONG VIVA BICHO — FASE 1: ESTRUTURA INICIAL DO BANCO DE DADOS
-- ============================================================================
-- Objetivo: criar o schema inicial a partir de um Supabase totalmente vazio.
-- Fonte de verdade: código-fonte (src/types, contexts, modais, views).
--
-- O que esta migration cria:
--   1. Tabela profiles  (usuários do sistema, vinculada ao auth do Supabase)
--   2. Tabela animals   (fichas de acolhimento dos animais)
--   3. Índices e constraints de integridade
--
-- O que NÃO cria (etapas futuras):
--   Castrações, Agenda, Documentos, Buckets, Storage, Edge Functions,
--   RLS/Policies e Triggers.
-- ============================================================================


-- ============================================================================
-- 1) TABELA profiles
-- ============================================================================
-- Perfil de cada usuário autenticado no Supabase Auth.
-- A linha só existe se o usuário existir em auth.users; se o usuário for
-- excluído, o perfil é removido automaticamente (ON DELETE CASCADE).
-- ============================================================================
create table if not exists public.profiles (
    id           uuid        primary key
                           references auth.users (id)
                           on delete cascade,
    name         text        not null,
    cpf          text        not null,
    role         text        not null default 'common',
    status       text        not null default 'active',
    first_access boolean     not null default true,
    email        text,
    created_at   timestamptz not null default now()
);

-- Regras de conteúdo (evita valores inválidos)
alter table public.profiles
    add constraint profiles_role_check check (role in ('admin', 'common')),
    add constraint profiles_status_check check (status in ('active', 'inactive')),
    add constraint profiles_cpf_unique unique (cpf);

-- Índices para consultas comuns (lista de colaboradores, filtros por papel/status)
create index if not exists idx_profiles_role   on public.profiles (role);
create index if not exists idx_profiles_status on public.profiles (status);
create index if not exists idx_profiles_email  on public.profiles (email);

comment on table public.profiles is
    'Perfis de colaboradores da ONG, vinculados ao Supabase Auth.';


-- ============================================================================
-- 2) TABELA animals
-- ============================================================================
-- Ficha completa de acolhimento de cada animal.
-- Histórico, dados de adoção e óbito são armazenados em JSONB na própria linha.
-- ============================================================================
create table if not exists public.animals (
    id                  uuid        primary key default gen_random_uuid(),
    name                text        not null,
    microchip           text,
    species             text        not null default 'outro',
    sex                 text        not null default 'macho',
    age                 text,
    weight              numeric,
    entry_date          date        not null,
    current_location    text        not null default 'triagem',
    status              text        not null default 'no_abrigo',
    origin              text        not null default 'nao_informado',
    origin_protocol     text,
    origin_notes        text,
    rescue_origin       text,
    rescue_address      text,
    entry_notes         text,
    origin_tutor_name   text,
    origin_tutor_contact text,
    current_observation text,
    history             jsonb       not null default '[]'::jsonb,
    adoption_details    jsonb,
    death_details       jsonb,
    photo_url           text,
    created_at          timestamptz not null default now()
);

-- Regras de conteúdo (evita valores inválidos)
alter table public.animals
    add constraint animals_species_check
        check (species in ('cachorro', 'gato', 'outro')),
    add constraint animals_sex_check
        check (sex in ('macho', 'femea')),
    add constraint animals_weight_check
        check (weight is null or weight > 0),
    add constraint animals_current_location_check
        check (current_location in (
            'triagem',
            'internacao_gatos',
            'internacao_caes',
            'gatil',
            'area_caes',
            'lar_temporario',
            'guarda_compartilhada',
            'clinica_parceira'
        )),
    add constraint animals_status_check
        check (status in ('no_abrigo', 'adotado', 'obito')),
    add constraint animals_origin_check
        check (origin in (
            'guarda_municipal',
            'resgate_ong',
            'entrega_voluntaria',
            'resgate_emergencia',
            'terceiros',
            'nao_informado',
            'outro'
        )),
    add constraint animals_rescue_origin_check
        check (rescue_origin is null or rescue_origin in (
            'guarda_municipal',
            'departamento_protecao_animal',
            'diretoria',
            'deixado_no_portao',
            'judice'
        )),
    add constraint animals_microchip_unique unique (microchip);

-- Índices para as consultas mais comuns
-- (microchip não precisa de índice explícito: a constraint animals_microchip_unique
--  já cria o índice btree correspondente)
create index if not exists idx_animals_status           on public.animals (status);
create index if not exists idx_animals_current_location on public.animals (current_location);
create index if not exists idx_animals_species          on public.animals (species);
-- Consulta combinada usada pela tela de Triagem (status + localização)
create index if not exists idx_animals_status_location  on public.animals (status, current_location);
-- Ordenação padrão do app (created_at desc)
create index if not exists idx_animals_created_at       on public.animals (created_at desc);

comment on table public.animals is
    'Fichas de acolhimento dos animais da ONG.';
