-- Script para adicionar as colunas que estão faltando
-- Execute este script no SQL Editor do Supabase

-- Adicionar colunas de controle de acesso
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_granted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS frozen_reason TEXT;

-- Verificar se as colunas foram criadas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('access_granted', 'account_frozen', 'frozen_reason');

-- Definir valores padrão para usuários existentes
UPDATE profiles 
SET access_granted = true,
    account_frozen = false,
    frozen_reason = null
WHERE access_granted IS NULL;

-- Verificar dados
SELECT 
  email,
  is_admin,
  access_granted,
  account_frozen
FROM profiles 
ORDER BY created_at DESC; 