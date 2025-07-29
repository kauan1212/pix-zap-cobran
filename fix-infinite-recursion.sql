-- CORRIGIR ERRO DE RECURSÃO INFINITA NAS POLÍTICAS RLS
-- Execute este script no SQL Editor do Supabase

-- 1. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable insert for trigger" ON profiles;

-- 3. VERIFICAR DADOS ATUAIS (sem RLS)
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

-- 4. GARANTIR QUE O ADMIN ESTÁ CORRETO
UPDATE profiles 
SET is_admin = true, access_granted = true 
WHERE email = 'kauankg@hotmail.com';

-- 5. REABILITAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS SIMPLES SEM RECURSÃO
-- Política para admins (usando email direto para evitar recursão)
CREATE POLICY "Admin access by email" ON profiles
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'kauankg@hotmail.com'
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

-- 7. TESTAR CONSULTA
-- Esta consulta deve funcionar agora
SELECT 
  'Teste de consulta:' as info,
  COUNT(*) as total_profiles
FROM profiles;

-- 8. CRIAR FUNÇÃO RPC ALTERNATIVA (SEM RECURSÃO)
CREATE OR REPLACE FUNCTION get_all_profiles_simple()
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
  -- Verificar se o usuário atual é admin pelo email (sem recursão)
  IF auth.jwt() ->> 'email' != 'kauankg@hotmail.com' THEN
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
GRANT EXECUTE ON FUNCTION get_all_profiles_simple() TO authenticated;

-- 9. VERIFICAR RESULTADO
SELECT 
  '✅ SCRIPT EXECUTADO COM SUCESSO!' as resultado,
  'Recursão infinita corrigida. Teste agora.' as instrucao; 