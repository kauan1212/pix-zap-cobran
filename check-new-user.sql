-- Script para verificar nova conta e diagnosticar problemas
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a nova conta foi criada
SELECT 
  id,
  email,
  full_name,
  is_admin,
  access_granted,
  account_frozen,
  frozen_reason,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- 2. Verificar se as colunas de controle de acesso existem
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('access_granted', 'account_frozen', 'frozen_reason');

-- 3. Se as colunas não existirem, criá-las
DO $$
BEGIN
    -- Adicionar coluna access_granted se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'access_granted'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN access_granted BOOLEAN DEFAULT FALSE;
    END IF;

    -- Adicionar coluna account_frozen se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'account_frozen'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN account_frozen BOOLEAN DEFAULT FALSE;
    END IF;

    -- Adicionar coluna frozen_reason se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'frozen_reason'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN frozen_reason TEXT;
    END IF;
END
$$;

-- 4. Definir valores padrão para usuários existentes
UPDATE profiles 
SET access_granted = COALESCE(access_granted, false),
    account_frozen = COALESCE(account_frozen, false),
    frozen_reason = COALESCE(frozen_reason, null)
WHERE access_granted IS NULL OR account_frozen IS NULL;

-- 5. Verificar novamente após as correções
SELECT 
  email,
  full_name,
  is_admin,
  access_granted,
  account_frozen,
  created_at
FROM profiles 
ORDER BY created_at DESC; 