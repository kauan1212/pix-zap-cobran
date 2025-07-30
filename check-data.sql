-- SCRIPT PARA VERIFICAR SE OS DADOS ESTÃO SENDO SALVOS
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se as colunas existem e têm dados
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('access_granted', 'account_frozen', 'frozen_reason');

-- 2. Verificar todos os usuários e seus status
SELECT 
  id,
  email,
  full_name,
  is_admin,
  access_granted,
  account_frozen,
  frozen_reason,
  created_at,
  updated_at
FROM profiles 
ORDER BY created_at DESC;

-- 3. Testar uma atualização manual
-- Substitua 'ID_DO_USUARIO' pelo ID real de um usuário
-- UPDATE profiles SET access_granted = true WHERE id = 'ID_DO_USUARIO';

-- 4. Verificar políticas RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'; 