-- ⚠️ EXECUTE ESTE SCRIPT AGORA NO SUPABASE ⚠️
-- Este script vai resolver todos os problemas

-- 1. Adicionar as colunas que estão faltando
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_granted BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS frozen_reason TEXT;

-- 2. Definir valores padrão para todos os usuários existentes
UPDATE profiles SET access_granted = false WHERE access_granted IS NULL;
UPDATE profiles SET account_frozen = false WHERE account_frozen IS NULL;

-- 3. Liberar acesso para admins automaticamente
UPDATE profiles SET access_granted = true WHERE is_admin = true;

-- 4. Verificar se tudo funcionou
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