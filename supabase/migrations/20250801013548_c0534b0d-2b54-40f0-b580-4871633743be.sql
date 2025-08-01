-- Criar função RPC para criar usuários com perfil
CREATE OR REPLACE FUNCTION public.create_user_with_profile(
  user_email text,
  user_password text,
  user_full_name text,
  user_company text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  -- Criar usuário no auth.users
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  ) VALUES (
    gen_random_uuid(),
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(), -- Confirmar email automaticamente
    now(),
    now(),
    jsonb_build_object(
      'full_name', user_full_name,
      'company', user_company
    )
  ) RETURNING id INTO new_user_id;

  -- Aguardar um pouco para o trigger ser executado
  PERFORM pg_sleep(0.5);

  -- Retornar resultado
  result := json_build_object('user_id', new_user_id, 'email', user_email);
  RETURN result;
END;
$$;

-- Função para deletar usuário completamente (se não existir)
CREATE OR REPLACE FUNCTION public.delete_user_complete(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

    -- Pegar o ID do usuário
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
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
    
    -- Deletar usuário da autenticação
    DELETE FROM auth.users WHERE id = user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '🔐 Usuário da autenticação deletado: %', deleted_count;
    
    RETURN '✅ Usuário deletado completamente: ' || user_email;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN '❌ Erro ao deletar usuário: ' || SQLERRM;
END;
$$;