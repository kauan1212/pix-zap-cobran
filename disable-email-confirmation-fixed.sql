-- DESABILITAR CONFIRMAÇÃO DE EMAIL NO SUPABASE (VERSÃO CORRIGIDA)
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se existe a tabela de configurações
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' 
AND table_name LIKE '%config%';

-- 2. Verificar configurações de autenticação (método alternativo)
SELECT 
  setting_name,
  setting_value
FROM pg_settings 
WHERE setting_name LIKE '%auth%' 
OR setting_name LIKE '%email%';

-- 3. Verificar se existe a função de configuração
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'auth' 
AND routine_name LIKE '%config%';

-- 4. Tentar método alternativo - verificar configurações do projeto
-- Esta é a forma correta de verificar configurações no Supabase
SELECT 
  'Configurações de autenticação:' as info,
  'Para desabilitar confirmação de email, vá em:' as instrucao,
  'Dashboard > Authentication > Settings > Email Auth' as localizacao;

-- 5. Verificar se o trigger está funcionando corretamente
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- 6. Verificar se as políticas RLS estão corretas
SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 7. Testar criação de usuário sem confirmação
-- (Este teste será feito via interface, não via SQL)

-- MENSAGEM IMPORTANTE
SELECT 
  '⚠️ IMPORTANTE:' as aviso,
  'Para desabilitar confirmação de email, vá no Dashboard do Supabase:' as instrucao1,
  '1. Dashboard > Authentication > Settings' as passo1,
  '2. Email Auth > Disable "Confirm email"' as passo2,
  '3. Save changes' as passo3;

-- 8. Verificar se o sistema está funcionando
SELECT 
  '✅ Sistema funcionando:' as status,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN access_granted = true THEN 1 END) as liberados,
  COUNT(CASE WHEN access_granted = false THEN 1 END) as aguardando
FROM profiles; 