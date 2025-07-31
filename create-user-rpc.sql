-- FUNÇÃO RPC PARA CRIAR USUÁRIOS COM PERFIL
-- Execute este script no SQL Editor do Supabase

-- Criar função para criar usuário com perfil
CREATE OR REPLACE FUNCTION create_user_with_profile(
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT,
  user_company TEXT
)
RETURNS JSON
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

  -- Criar o usuário na tabela auth.users
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

  -- Aguardar um pouco para o trigger executar
  PERFORM pg_sleep(0.5);

  -- Verificar se o perfil foi criado pelo trigger
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = new_user_id
  ) THEN
    -- Se não foi criado pelo trigger, criar manualmente
    INSERT INTO profiles (
      id,
      email,
      full_name,
      access_granted,
      account_frozen,
      frozen_reason,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      user_email,
      user_full_name,
      false, -- access_granted padrão false
      false, -- account_frozen padrão false
      null,  -- frozen_reason padrão null
      now(),
      now()
    );
  ELSE
    -- Atualizar o perfil existente com os dados corretos
    UPDATE profiles SET
      access_granted = false,
      account_frozen = false,
      frozen_reason = null,
      updated_at = now()
    WHERE id = new_user_id;
  END IF;

  -- Retornar resultado
  result := jsonb_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', user_email,
    'message', 'Usuário criado com sucesso'
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retornar detalhes
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erro ao criar usuário'
    );
    RETURN result;
END;
$$;

-- Dar permissão para executar a função
GRANT EXECUTE ON FUNCTION create_user_with_profile(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Verificar se a função foi criada
SELECT 
  'Função RPC criada com sucesso!' as status,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'create_user_with_profile'; 