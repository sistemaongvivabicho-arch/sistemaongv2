-- ============================================================================
-- ONG VIVA BICHO — MIGRAÇÃO: TORNAR AUDITORIA COMPATÍVEL COM EVENTOS ADMIN
-- ============================================================================
-- Objetivo: permitir que animal_id e animal_name sejam nulos para eventos
-- que não envolvem animais (login, logout, gerenciamento de usuários, etc.).
-- ============================================================================

-- Tornar animal_id e animal_name opcionais
alter table public.audit_logs
    alter column animal_id drop not null,
    alter column animal_name drop not null;

-- Garantir que migrations anteriores não quebrem (idempotente)
-- Se a constraint já existir, ignora
