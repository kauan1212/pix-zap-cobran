-- Script para verificar e definir o usuário kauankg@hotmail.com como admin
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar o status atual do usuário
SELECT 
  id,
  email,
  full_name,
  is_admin,
  access_granted,
  account_frozen
FROM profiles 
WHERE email = 'kauankg@hotmail.com';

-- 2. Definir o usuário como admin
UPDATE profiles 
SET is_admin = true,
    access_granted = true,
    account_frozen = false
WHERE email = 'kauankg@hotmail.com';

-- 3. Verificar se a atualização foi bem-sucedida
SELECT 
  id,
  email,
  full_name,
  is_admin,
  access_granted,
  account_frozen
FROM profiles 
WHERE email = 'kauankg@hotmail.com';

-- 4. Listar todos os usuários admin para verificação
SELECT 
  email,
  full_name,
  is_admin,
  access_granted
FROM profiles 
WHERE is_admin = true
ORDER BY email; 