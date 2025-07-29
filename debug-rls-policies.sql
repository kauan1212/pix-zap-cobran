-- Script para verificar e corrigir políticas RLS
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se as colunas existem
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('access_granted', 'account_frozen', 'frozen_reason');

-- 2. Verificar políticas RLS atuais
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 4. Recriar políticas RLS para garantir acesso correto
-- Desabilitar RLS temporariamente para verificar dados
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verificar dados atuais
SELECT id, email, full_name, access_granted, account_frozen, created_at 
FROM profiles 
ORDER BY created_at DESC;

-- Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recriar política para admins (acesso total)
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
CREATE POLICY "Admins can do everything" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Política para usuários verem apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Política para usuários editarem apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. Verificar se o trigger está funcionando
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- 6. Testar inserção manual (se necessário)
-- INSERT INTO profiles (id, email, full_name, access_granted, account_frozen, created_at, updated_at)
-- VALUES (
--   'test-user-id', 
--   'test@example.com', 
--   'Test User', 
--   false, 
--   false, 
--   now(), 
--   now()
-- ); 