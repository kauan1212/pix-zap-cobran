-- SCRIPT PARA DEBUGAR PROBLEMA DE NOVOS USUÁRIOS
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR ESTRUTURA DA TABELA PROFILES
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. VERIFICAR TRIGGERS EXISTENTES
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';

-- 3. VERIFICAR FUNÇÃO DO TRIGGER
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 4. VERIFICAR DADOS ATUAIS DOS PERFIS
SELECT 
  id, 
  email, 
  full_name, 
  access_granted, 
  account_frozen, 
  is_admin,
  created_at,
  updated_at
FROM profiles 
ORDER BY created_at DESC;

-- 5. VERIFICAR USUÁRIOS NA AUTH
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;

-- 6. VERIFICAR SE HÁ USUÁRIOS SEM PERFIL
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- 7. VERIFICAR POLÍTICAS RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 8. TESTAR CRIAÇÃO DE USUÁRIO MANUAL (OPCIONAL)
-- INSERT INTO auth.users (
--   id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   raw_user_meta_data
-- ) VALUES (
--   gen_random_uuid(),
--   'test-debug-' || extract(epoch from now())::text || '@example.com',
--   crypt('password123', gen_salt('bf')),
--   now(),
--   now(),
--   now(),
--   '{"full_name": "Teste Debug"}'
-- );

-- 9. VERIFICAR SE O TRIGGER FUNCIONOU (se executou o teste acima)
-- SELECT * FROM profiles WHERE email LIKE 'test-debug-%@example.com';

-- 10. VERIFICAR LOGS DE ERRO (se houver)
-- SELECT * FROM pg_stat_activity WHERE state = 'active'; 