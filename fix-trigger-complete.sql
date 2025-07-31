-- SCRIPT COMPLETO PARA CORRIGIR TRIGGER DE NOVOS USUÁRIOS
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR E CORRIGIR ESTRUTURA DA TABELA
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

-- Criar nova função com controle de acesso
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
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuário'), 
    false, -- access_granted padrão false (precisa de aprovação)
    false, -- account_frozen padrão false
    null,  -- frozen_reason padrão null
    now(), 
    now()
  );
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- Se já existe o perfil, apenas retornar
    RETURN new;
  WHEN OTHERS THEN
    -- Log do erro
    RAISE LOG 'Erro ao criar perfil para usuário %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. CORRIGIR POLÍTICAS RLS
-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for trigger" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Criar novas políticas
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

-- 5. GARANTIR QUE O ADMIN ESTÁ CORRETO
UPDATE profiles 
SET is_admin = true, access_granted = true 
WHERE email = 'kauankg@hotmail.com';

-- 6. CRIAR FUNÇÃO RPC PARA BUSCAR PERFIS (se não existir)
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
  ORDER BY p.access_granted ASC, p.created_at DESC;
END;
$$;

-- Dar permissão para executar a função
GRANT EXECUTE ON FUNCTION get_all_profiles() TO authenticated;

-- 7. VERIFICAR RESULTADO
SELECT 
  'Verificação final:' as info,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_count,
  COUNT(CASE WHEN access_granted = true THEN 1 END) as granted_count,
  COUNT(CASE WHEN access_granted = false THEN 1 END) as pending_count,
  COUNT(CASE WHEN account_frozen = true THEN 1 END) as frozen_count
FROM profiles;

-- 8. MOSTRAR USUÁRIOS PENDENTES DE APROVAÇÃO
SELECT 
  'Usuários pendentes de aprovação:' as status,
  id,
  email,
  full_name,
  created_at
FROM profiles 
WHERE access_granted = false 
AND account_frozen = false
ORDER BY created_at DESC;

-- MENSAGEM DE SUCESSO
SELECT '✅ TRIGGER CORRIGIDO! Agora novos usuários devem aparecer na lista de aprovação.' as resultado; 