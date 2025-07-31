-- SCRIPT PARA DEBUGAR PROBLEMA DE LOGIN
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR USUÁRIOS CRIADOS RECENTEMENTE
SELECT 
  'Usuários recentes:' as info,
  id,
  email,
  full_name,
  access_granted,
  account_frozen,
  frozen_reason,
  created_at
FROM profiles 
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- 2. VERIFICAR SE HÁ USUÁRIOS COM EMAIL CONFIRMADO MAS SEM ACESSO
SELECT 
  'Usuários sem acesso:' as info,
  p.id,
  p.email,
  p.full_name,
  p.access_granted,
  p.account_frozen,
  au.email_confirmed_at,
  au.created_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.access_granted = false 
  AND p.account_frozen = false
  AND au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC;

-- 3. VERIFICAR SE HÁ PROBLEMAS NA TABELA AUTH.USERS
SELECT 
  'Usuários auth:' as info,
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- 4. VERIFICAR SE HÁ USUÁRIOS ÓRFÃOS (SEM PERFIL)
SELECT 
  'Usuários sem perfil:' as info,
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.created_at > now() - interval '24 hours';

-- 5. VERIFICAR RLS POLICIES
SELECT 
  'RLS Policies:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. TESTAR CONSULTA DE CONTROLE DE ACESSO
-- Substitua 'USER_ID_AQUI' pelo ID de um usuário real
-- SELECT 
--   'Teste de acesso:' as info,
--   access_granted,
--   account_frozen,
--   frozen_reason
-- FROM profiles 
-- WHERE id = 'USER_ID_AQUI'; 