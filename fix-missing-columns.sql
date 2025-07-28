-- Script para adicionar as colunas que estão faltando
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna access_granted
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_granted BOOLEAN DEFAULT FALSE;

-- 2. Adicionar coluna account_frozen  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_frozen BOOLEAN DEFAULT FALSE;

-- 3. Adicionar coluna frozen_reason
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS frozen_reason TEXT;

-- 4. Definir valores padrão para usuários existentes
UPDATE profiles 
SET access_granted = false 
WHERE access_granted IS NULL;

UPDATE profiles 
SET account_frozen = false 
WHERE account_frozen IS NULL;

-- 5. Verificar se funcionou
SELECT 
  email,
  full_name,
  access_granted,
  account_frozen,
  frozen_reason
FROM profiles 
ORDER BY created_at DESC; 