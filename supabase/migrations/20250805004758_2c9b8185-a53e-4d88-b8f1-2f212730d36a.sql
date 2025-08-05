-- Liberar acesso completo para o admin kauankg@hotmail.com
UPDATE profiles 
SET 
    is_admin = true,
    access_granted = true,
    account_frozen = false,
    frozen_reason = null
WHERE email = 'kauankg@hotmail.com';

-- Verificar se foi atualizado
SELECT 
    email, 
    is_admin, 
    access_granted, 
    account_frozen 
FROM profiles 
WHERE email = 'kauankg@hotmail.com';