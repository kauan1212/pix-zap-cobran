-- DESABILITAR CONFIRMAÇÃO DE EMAIL NO SUPABASE
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar configurações atuais de autenticação
SELECT 
  id,
  name,
  config
FROM auth.config;

-- 2. Atualizar configuração para desabilitar confirmação de email
UPDATE auth.config 
SET config = jsonb_set(
  config, 
  '{email_confirm}', 
  'false'
);

-- 3. Verificar se a alteração foi aplicada
SELECT 
  id,
  name,
  config->>'email_confirm' as email_confirm_enabled
FROM auth.config;

-- 4. Atualizar configuração de email (opcional)
UPDATE auth.config 
SET config = jsonb_set(
  config, 
  '{mailer_autoconfirm}', 
  'true'
);

-- 5. Verificar configuração final
SELECT 
  'Configuração de email:' as info,
  config->>'email_confirm' as email_confirm,
  config->>'mailer_autoconfirm' as mailer_autoconfirm
FROM auth.config;

-- MENSAGEM DE SUCESSO
SELECT '✅ CONFIRMAÇÃO DE EMAIL DESABILITADA! Agora as contas são liberadas apenas pelo admin.' as resultado; 