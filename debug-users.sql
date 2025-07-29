-- SCRIPT DE DIAGNÓSTICO - Execute no SQL Editor do Supabase
-- Este script vai verificar se há usuários na tabela e diagnosticar problemas

-- 1. Verificar se a tabela profiles existe e tem dados
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN is_admin = true THEN 1 END) as admins,
  COUNT(CASE WHEN is_admin = false OR is_admin IS NULL THEN 1 END) as usuarios_normais
FROM profiles;

-- 2. Listar todos os usuários com detalhes
SELECT 
  id,
  email,
  full_name,
  is_admin,
  created_at,
  updated_at
FROM profiles 
ORDER BY created_at DESC;

-- 3. Verificar se as colunas de controle existem
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('access_granted', 'account_frozen', 'frozen_reason');

-- 4. Se as colunas não existirem, criá-las
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'access_granted'
    ) THEN
        ALTER TABLE profiles ADD COLUMN access_granted BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna access_granted criada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'account_frozen'
    ) THEN
        ALTER TABLE profiles ADD COLUMN account_frozen BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna account_frozen criada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'frozen_reason'
    ) THEN
        ALTER TABLE profiles ADD COLUMN frozen_reason TEXT;
        RAISE NOTICE 'Coluna frozen_reason criada';
    END IF;
END
$$;

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