-- SCRIPT PARA GARANTIR PERSISTÊNCIA DOS DADOS
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar as colunas se não existirem
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_granted BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS frozen_reason TEXT;

-- 2. Definir valores padrão para usuários existentes
UPDATE profiles SET access_granted = false WHERE access_granted IS NULL;
UPDATE profiles SET account_frozen = false WHERE account_frozen IS NULL;

-- 3. Liberar acesso para admins automaticamente
UPDATE profiles SET access_granted = true WHERE is_admin = true;

-- 4. Verificar se as colunas foram criadas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('access_granted', 'account_frozen', 'frozen_reason');

-- 5. Verificar dados dos usuários
SELECT 
  email,
  full_name,
  is_admin,
  access_granted,
  account_frozen,
  frozen_reason
FROM profiles 
ORDER BY created_at DESC; 