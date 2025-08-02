-- Fix create_user_with_profile function
CREATE OR REPLACE FUNCTION public.create_user_with_profile(user_email text, user_password text, user_full_name text, user_company text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem criar usuários';
  END IF;

  -- Verificar se o email já existe
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = user_email
  ) THEN
    RAISE EXCEPTION 'Email já está em uso';
  END IF;

  -- Gerar novo UUID para o usuário
  new_user_id := gen_random_uuid();
  
  -- Inserir diretamente na tabela auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_sent_at,
    recovery_token,
    email_change_sent_at,
    email_change,
    email_change_token_new,
    email_change_token_current,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    '',
    null,
    '',
    null,
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    json_build_object('full_name', user_full_name, 'company', user_company),
    false,
    now(),
    now(),
    null,
    null,
    '',
    '',
    null,
    0,
    null,
    '',
    null,
    false,
    null
  );
  
  -- Aguardar um pouco para o trigger ser executado
  PERFORM pg_sleep(0.5);
  
  -- Atualizar o perfil com informações adicionais
  UPDATE public.profiles
  SET 
    company = user_company,
    access_granted = false,
    account_frozen = false,
    frozen_reason = null,
    full_name = user_full_name
  WHERE id = new_user_id;

  -- Retornar resultado
  result := json_build_object(
    'user_id', new_user_id, 
    'email', user_email,
    'message', 'Usuário criado com sucesso. O acesso deve ser liberado por um administrador.'
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, tentar desfazer a criação do usuário
  IF new_user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = new_user_id;
    DELETE FROM profiles WHERE id = new_user_id;
  END IF;
  RAISE EXCEPTION 'Erro ao criar usuário: %', SQLERRM;
END;
$function$;

-- Fix delete_user_complete function  
CREATE OR REPLACE FUNCTION public.delete_user_complete(user_email text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_id UUID;
    deleted_count INTEGER := 0;
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    ) THEN
      RAISE EXCEPTION 'Acesso negado: apenas administradores podem deletar usuários';
    END IF;

    -- Pegar o ID do usuário pelo email do perfil
    SELECT id INTO user_id FROM profiles WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN '❌ Usuário não encontrado: ' || user_email;
    END IF;
    
    RAISE NOTICE '🗑️ Deletando usuário: % (%)', user_email, user_id;
    
    -- Deletar dados relacionados primeiro
    DELETE FROM billings WHERE user_id = user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '💳 Cobranças deletadas: %', deleted_count;
    
    DELETE FROM clients WHERE user_id = user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '👥 Clientes deletados: %', deleted_count;
    
    DELETE FROM auto_billing_plans WHERE user_id = user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '🤖 Planos de cobrança deletados: %', deleted_count;
    
    DELETE FROM recurring_plans WHERE user_id = user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '🔄 Planos recorrentes deletados: %', deleted_count;
    
    -- Deletar perfil do usuário
    DELETE FROM profiles WHERE id = user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '👤 Perfil deletado: %', deleted_count;
    
    -- Deletar da tabela auth.users diretamente
    DELETE FROM auth.users WHERE id = user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '🔐 Usuário auth deletado: %', deleted_count;
    
    RETURN '✅ Usuário deletado completamente: ' || user_email;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro durante deleção: %', SQLERRM;
        RETURN '❌ Erro ao deletar usuário: ' || SQLERRM;
END;
$function$;