-- SCRIPT FINAL PARA RESOLVER TODOS OS PROBLEMAS
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar as colunas que estão faltando
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_granted BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS frozen_reason TEXT;

-- 2. Definir valores padrão para usuários existentes
UPDATE profiles SET access_granted = false WHERE access_granted IS NULL;
UPDATE profiles SET account_frozen = false WHERE account_frozen IS NULL;

-- 3. Liberar acesso para admins automaticamente
UPDATE profiles SET access_granted = true WHERE is_admin = true;

-- 4. Verificar se funcionou
SELECT 
  email, 
  full_name, 
  is_admin,
  access_granted, 
  account_frozen,
  frozen_reason
FROM profiles 
ORDER BY created_at DESC; 