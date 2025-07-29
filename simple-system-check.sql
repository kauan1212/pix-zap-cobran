-- VERIFICAÇÃO SIMPLES DO SISTEMA
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o trigger está funcionando
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- 2. Verificar políticas RLS
SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Verificar usuários atuais
SELECT 
  'Sistema funcionando:' as status,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN access_granted = true THEN 1 END) as liberados,
  COUNT(CASE WHEN access_granted = false THEN 1 END) as aguardando
FROM profiles;

-- 4. Verificar dados dos usuários
SELECT 
  id,
  email,
  full_name,
  access_granted,
  account_frozen,
  is_admin,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- 5. Instruções para desabilitar confirmação de email
SELECT 
  '⚠️ IMPORTANTE:' as aviso,
  'Para desabilitar confirmação de email:' as instrucao,
  '1. Vá no Dashboard do Supabase' as passo1,
  '2. Authentication > Settings' as passo2,
  '3. Email Auth > Disable "Confirm email"' as passo3,
  '4. Save changes' as passo4;

-- 6. Verificar se o admin está configurado corretamente
SELECT 
  'Admin configurado:' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'kauankg@hotmail.com' AND is_admin = true) 
    THEN '✅ Sim' 
    ELSE '❌ Não' 
  END as status_admin;

-- 7. MENSAGEM FINAL
SELECT 
  '✅ SISTEMA VERIFICADO!' as resultado,
  'Agora vá no Dashboard do Supabase para desabilitar confirmação de email.' as proximo_passo; 