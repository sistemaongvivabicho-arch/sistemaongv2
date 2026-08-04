-- ============================================================================
-- ONG VIVA BICHO – FASE 13: DASHBOARD GERENCIAL COMPLETO
-- Colunas de saúde (castração e vacinação) na tabela public.animals
-- ============================================================================
-- Objetivo: adicionar os campos usados pelo Dashboard Gerencial (cards de
-- castrados/não castrados, agenda de castração e alertas de vacinação).
--
-- Colunas criadas:
--   1. castrado                  (boolean) – se o animal já foi castrado
--   2. castration_date           (text)    – data da castração (DD/MM/AAAA)
--   3. castration_scheduled_date (text)    – data agendada para castração
--   4. vaccination_date          (text)    – data da última vacina
--   5. vaccination_due_date      (text)    – data da próxima vacina
--
-- Observação: as datas são armazenadas como TEXT no mesmo formato DD/MM/AAAA
-- utilizado em todo o front-end (src/types, modais e dashboardUtils).
-- ============================================================================

alter table public.animals
    add column if not exists castrado boolean not null default false,
    add column if not exists castration_date text,
    add column if not exists castration_scheduled_date text,
    add column if not exists vaccination_date text,
    add column if not exists vaccination_due_date text;

comment on column public.animals.castrado is
    'Indica se o animal já foi castrado (verdadeiro = castrado).';
comment on column public.animals.castration_date is
    'Data da castração realizada, no formato DD/MM/AAAA.';
comment on column public.animals.castration_scheduled_date is
    'Data agendada para a castração, no formato DD/MM/AAAA.';
comment on column public.animals.vaccination_date is
    'Data da última vacinação, no formato DD/MM/AAAA.';
comment on column public.animals.vaccination_due_date is
    'Data da próxima vacinação (vencimento), no formato DD/MM/AAAA.';
