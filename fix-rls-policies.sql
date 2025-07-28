-- Script para verificar e corrigir políticas RLS
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se existem políticas que bloqueiam o acesso
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. Remover políticas restritivas temporariamente
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- 3. Criar política que permite acesso total para admins
CREATE POLICY "Allow admins full access to profiles" 
  ON public.profiles 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 4. Criar política que permite usuários verem seu próprio perfil
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- 5. Verificar se há dados na tabela
SELECT COUNT(*) as total_users FROM profiles;

-- 6. Listar todos os usuários
SELECT 
  id,
  email,
  full_name,
  is_admin,
  access_granted,
  account_frozen
FROM profiles 
ORDER BY created_at DESC; 