-- Script para permitir que admins deletem usuários
-- Execute este script no SQL Editor do Supabase

-- Remover política existente se houver
DROP POLICY IF EXISTS "Allow admins full access to profiles" ON public.profiles;

-- Criar política que permite admins fazerem tudo (incluindo DELETE)
CREATE POLICY "Allow admins full access to profiles" 
  ON public.profiles 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Verificar políticas existentes
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'profiles';

-- Verificar se a tabela profiles tem RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles'; 