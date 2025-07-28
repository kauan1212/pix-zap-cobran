-- Script simples para definir o usuário kauankg@hotmail.com como admin
-- Execute este script no SQL Editor do Supabase

UPDATE profiles 
SET is_admin = true,
    access_granted = true,
    account_frozen = false
WHERE email = 'kauankg@hotmail.com';

-- Verificar se foi atualizado
SELECT email, is_admin, access_granted FROM profiles WHERE email = 'kauankg@hotmail.com'; 