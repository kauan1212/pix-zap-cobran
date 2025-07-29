-- Script para testar criação de novo usuário
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o trigger existe e está funcionando
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- 2. Verificar a função do trigger
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 3. Testar inserção manual de um usuário de teste
-- Primeiro, vamos inserir um usuário de teste na tabela auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  'test-user-' || extract(epoch from now())::text,
  'test-' || extract(epoch from now())::text || '@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "Usuário Teste"}'
) RETURNING id, email;

-- 4. Verificar se o perfil foi criado automaticamente
SELECT 
  id,
  email,
  full_name,
  access_granted,
  account_frozen,
  created_at
FROM profiles 
WHERE email LIKE 'test-%@example.com'
ORDER BY created_at DESC;

-- 5. Verificar todas as políticas RLS
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. Verificar se RLS está habilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 7. Testar consulta como admin (substitua pelo ID do admin real)
-- SELECT 
--   id,
--   email,
--   full_name,
--   access_granted,
--   account_frozen,
--   created_at
-- FROM profiles 
-- ORDER BY created_at DESC; 