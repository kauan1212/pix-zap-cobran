-- Script SIMPLES para adicionar as colunas
-- Execute este script no SQL Editor do Supabase

-- Adicionar as colunas que estão faltando
ALTER TABLE profiles ADD COLUMN access_granted BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN account_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN frozen_reason TEXT;

-- Verificar se funcionou
SELECT email, full_name, access_granted, account_frozen FROM profiles; 