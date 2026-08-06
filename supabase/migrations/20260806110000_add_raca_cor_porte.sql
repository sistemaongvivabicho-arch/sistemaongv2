-- Migration: Add raca, cor, porte columns to animals table
-- These fields exist in the TypeScript Animal type but were never added to the DB

alter table public.animals
  add column if not exists raca text default '',
  add column if not exists cor text default '',
  add column if not exists porte text default '';
