-- FORÇAR CONFIRMAÇÃO DE EMAIL DE TODOS OS USUÁRIOS
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar usuários não confirmados
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email_confirmed_at IS NULL;

-- 2. Forçar confirmação de email para todos os usuários
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, created_at),
  updated_at = now()
WHERE email_confirmed_at IS NULL;

-- 3. Verificar se a atualização funcionou
SELECT 
  'Usuários confirmados:' as info,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmados,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as nao_confirmados
FROM auth.users;

-- 4. Verificar perfis correspondentes
SELECT 
  'Perfis no sistema:' as info,
  COUNT(*) as total_perfis,
  COUNT(CASE WHEN access_granted = true THEN 1 END) as liberados,
  COUNT(CASE WHEN access_granted = false THEN 1 END) as aguardando
FROM profiles;

-- 5. Garantir que o admin está confirmado
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, created_at),
  updated_at = now()
WHERE email = 'kauankg@hotmail.com';

-- 6. Verificar admin
SELECT 
  'Admin confirmado:' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.users 
      WHERE email = 'kauankg@hotmail.com' 
      AND email_confirmed_at IS NOT NULL
    ) 
    THEN '✅ Sim' 
    ELSE '❌ Não' 
  END as status_admin;

-- 7. MENSAGEM FINAL
SELECT 
  '✅ EMAILS FORÇADOS A CONFIRMAR!' as resultado,
  'Agora todos os usuários podem fazer login sem confirmação de email.' as instrucao; 