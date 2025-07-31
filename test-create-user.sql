-- SCRIPT PARA TESTAR CRIAÇÃO DE USUÁRIOS
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR SE A FUNÇÃO RPC EXISTE
SELECT 
  'Verificando função RPC:' as info,
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'create_user_with_profile';

-- 2. VERIFICAR PERMISSÕES
SELECT 
  'Verificando permissões:' as info,
  grantee,
  privilege_type
FROM information_schema.routine_privileges 
WHERE routine_name = 'create_user_with_profile';

-- 3. VERIFICAR SE O ADMIN EXISTE
SELECT 
  'Verificando admin:' as info,
  id,
  email,
  is_admin,
  access_granted
FROM profiles 
WHERE email = 'kauankg@hotmail.com';

-- 4. TESTAR A FUNÇÃO RPC (OPCIONAL - DESCOMENTE PARA TESTAR)
-- SELECT create_user_with_profile(
--   'teste-' || extract(epoch from now())::text || '@example.com',
--   'senha123',
--   'Usuário Teste',
--   'Empresa Teste'
-- );

-- 5. VERIFICAR USUÁRIOS CRIADOS RECENTEMENTE
SELECT 
  'Usuários criados recentemente:' as info,
  id,
  email,
  full_name,
  access_granted,
  created_at
FROM profiles 
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;

-- 6. VERIFICAR TRIGGER
SELECT 
  'Verificando trigger:' as info,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth'; 