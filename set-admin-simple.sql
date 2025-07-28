-- Script SIMPLES para definir o usuário como admin
-- Execute este script no SQL Editor do Supabase

-- Definir o usuário kauankg@hotmail.com como admin
UPDATE profiles 
SET is_admin = true
WHERE email = 'kauankg@hotmail.com';

-- Verificar se funcionou
SELECT email, is_admin FROM profiles WHERE email = 'kauankg@hotmail.com'; 