-- SCRIPT PARA VERIFICAR E CORRIGIR PROBLEMAS COM TRIGGER DE PERFIL
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%profiles%' OR event_object_table = 'profiles';

-- 2. Verificar se a função do trigger existe
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%profiles%' OR routine_name LIKE '%handle_new_user%';

-- 3. Criar ou recriar a função do trigger se não existir
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar ou recriar o trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Verificar se as colunas de controle de acesso existem
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_granted BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS frozen_reason TEXT;

-- 6. Verificar usuários recentes
SELECT 
  id,
  email,
  full_name,
  created_at,
  access_granted,
  account_frozen
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Verificar se há usuários na autenticação sem perfil
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC; 