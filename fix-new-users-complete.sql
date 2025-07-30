-- SCRIPT COMPLETO PARA RESOLVER PROBLEMA DE NOVAS CONTAS
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR E CORRIGIR ESTRUTURA DA TABELA
-- Adicionar colunas se não existirem
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_granted BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS frozen_reason TEXT;

-- 2. DEFINIR VALORES PADRÃO PARA USUÁRIOS EXISTENTES
UPDATE profiles SET access_granted = false WHERE access_granted IS NULL;
UPDATE profiles SET account_frozen = false WHERE account_frozen IS NULL;
UPDATE profiles SET access_granted = true WHERE is_admin = true;

-- 3. RECRIAR O TRIGGER DE CRIAÇÃO DE PERFIL
-- Primeiro, remover trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remover função existente
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Criar nova função
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    access_granted,
    account_frozen,
    frozen_reason,
    created_at, 
    updated_at
  )
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    false, -- access_granted padrão false
    false, -- account_frozen padrão false
    null,  -- frozen_reason padrão null
    now(), 
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. DESABILITAR RLS TEMPORARIAMENTE PARA VERIFICAR DADOS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 5. VERIFICAR DADOS ATUAIS
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

-- 6. REABILITAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. REMOVER POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

-- 8. CRIAR NOVAS POLÍTICAS RLS
-- Política para admins (acesso total)
CREATE POLICY "Admins can do everything" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Política para usuários verem apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Política para usuários editarem apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para inserção de novos perfis (pelo trigger)
CREATE POLICY "Enable insert for trigger" ON profiles
  FOR INSERT WITH CHECK (true);

-- 9. VERIFICAR SE O ADMIN EXISTE E ESTÁ CORRETO
-- Atualizar o admin kauankg@hotmail.com
UPDATE profiles 
SET is_admin = true, access_granted = true 
WHERE email = 'kauankg@hotmail.com';

-- 10. CRIAR FUNÇÃO RPC PARA BUSCAR TODOS OS PERFIS
CREATE OR REPLACE FUNCTION get_all_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  pix_key text,
  is_admin boolean,
  access_granted boolean,
  account_frozen boolean,
  frozen_reason text,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar esta função';
  END IF;
  
  -- Retornar todos os perfis
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.pix_key,
    p.is_admin,
    p.access_granted,
    p.account_frozen,
    p.frozen_reason,
    p.created_at,
    p.updated_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Dar permissão para executar a função
GRANT EXECUTE ON FUNCTION get_all_profiles() TO authenticated;

-- 11. VERIFICAR RESULTADO FINAL
SELECT 
  'Verificação final:' as info,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_count,
  COUNT(CASE WHEN access_granted = true THEN 1 END) as granted_count,
  COUNT(CASE WHEN account_frozen = true THEN 1 END) as frozen_count
FROM profiles;

-- 12. TESTAR TRIGGER MANUALMENTE (OPCIONAL)
-- INSERT INTO auth.users (
--   id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   raw_user_meta_data
-- ) VALUES (
--   'test-trigger-' || extract(epoch from now())::text,
--   'test-trigger-' || extract(epoch from now())::text || '@example.com',
--   crypt('password123', gen_salt('bf')),
--   now(),
--   now(),
--   now(),
--   '{"full_name": "Teste Trigger"}'
-- );

-- 13. VERIFICAR SE O TRIGGER FUNCIONOU
-- SELECT * FROM profiles WHERE email LIKE 'test-trigger-%@example.com';

-- MENSAGEM DE SUCESSO
SELECT '✅ SCRIPT EXECUTADO COM SUCESSO! Agora teste criar uma nova conta.' as resultado; 