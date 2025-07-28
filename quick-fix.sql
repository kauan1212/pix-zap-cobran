-- SCRIPT RÁPIDO - Execute no SQL Editor do Supabase
-- Este script vai resolver o erro "column profiles.access_granted does not exist"

-- Adicionar as colunas que estão faltando
ALTER TABLE profiles ADD COLUMN access_granted BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN account_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN frozen_reason TEXT;

-- Verificar se funcionou
SELECT email, full_name, access_granted, account_frozen FROM profiles; 