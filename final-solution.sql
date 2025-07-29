-- SOLUÇÃO FINAL - Execute este script no SQL Editor do Supabase
-- Este script vai resolver todos os problemas de uma vez

-- 1. Adicionar as colunas que estão faltando (se não existirem)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_granted BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS frozen_reason TEXT;

-- 2. Definir valores padrão para todos os usuários existentes
UPDATE profiles SET access_granted = false WHERE access_granted IS NULL;
UPDATE profiles SET account_frozen = false WHERE account_frozen IS NULL;

-- 3. Liberar acesso para admins automaticamente
UPDATE profiles SET access_granted = true WHERE is_admin = true;

-- 4. Remover políticas RLS que podem estar causando problemas
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 5. Criar políticas RLS corretas
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- 6. Verificar se tudo funcionou
SELECT 
  email,
  full_name,
  is_admin,
  access_granted,
  account_frozen,
  frozen_reason,
  created_at
FROM profiles 
ORDER BY created_at DESC; 