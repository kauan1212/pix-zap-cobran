-- Script para debug e correção do status de admin
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todos os usuários e seus status
SELECT 
  id,
  email,
  full_name,
  is_admin,
  access_granted,
  account_frozen,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- 2. Verificar especificamente o usuário kauankg@hotmail.com
SELECT 
  id,
  email,
  full_name,
  is_admin,
  access_granted,
  account_frozen
FROM profiles 
WHERE email = 'kauankg@hotmail.com';

-- 3. Definir TODOS os usuários como admin (temporário para teste)
UPDATE profiles 
SET is_admin = true,
    access_granted = true,
    account_frozen = false
WHERE email IN ('kauankg@hotmail.com', 'teste123@gmail.com', 'bruno752010@hotmail.com');

-- 4. Verificar novamente após a atualização
SELECT 
  email,
  is_admin,
  access_granted
FROM profiles 
WHERE email IN ('kauankg@hotmail.com', 'teste123@gmail.com', 'bruno752010@hotmail.com'); 