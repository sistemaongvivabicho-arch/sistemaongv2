-- v2.10.0: Adicionar campos de status, veterinario e observacoes de castracao na tabela animals
-- Esses campos permitem que a aba Castrações leia diretamente da tabela animals

ALTER TABLE animals ADD COLUMN IF NOT EXISTS castration_status text DEFAULT NULL;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS castration_veterinarian text DEFAULT NULL;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS castration_notes text DEFAULT NULL;
