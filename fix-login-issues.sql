-- SCRIPT PARA CORRIGIR PROBLEMAS DE LOGIN
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR E CORRIGIR USUÁRIOS SEM PERFIL
-- Criar perfis para usuários que foram criados mas não têm perfil
INSERT INTO profiles (
  id,
  email,
  full_name,
  access_granted,
  account_frozen,
  frozen_reason,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Usuário'),
  false, -- access_granted padrão false
  false, -- account_frozen padrão false
  null,  -- frozen_reason padrão null
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email_confirmed_at IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 2. VERIFICAR E CORRIGIR USUÁRIOS COM EMAIL CONFIRMADO MAS SEM ACESSO
-- Atualizar usuários que têm email confirmado mas não têm acesso liberado
UPDATE profiles 
SET 
  access_granted = true,
  updated_at = now()
WHERE id IN (
  SELECT p.id
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE p.access_granted = false 
    AND p.account_frozen = false
    AND au.email_confirmed_at IS NOT NULL
    AND au.created_at < now() - interval '1 hour' -- Usuários criados há mais de 1 hora
);

-- 3. VERIFICAR E CORRIGIR DADOS INCONSISTENTES
-- Garantir que usuários com email confirmado tenham dados corretos
UPDATE profiles 
SET 
  full_name = COALESCE(full_name, 'Usuário'),
  access_granted = COALESCE(access_granted, false),
  account_frozen = COALESCE(account_frozen, false),
  updated_at = now()
WHERE full_name IS NULL 
   OR access_granted IS NULL 
   OR account_frozen IS NULL;

-- 4. VERIFICAR SE AS CORREÇÕES FUNCIONARAM
SELECT 
  'Status após correções:' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN access_granted = true THEN 1 END) as users_with_access,
  COUNT(CASE WHEN access_granted = false THEN 1 END) as users_without_access,
  COUNT(CASE WHEN account_frozen = true THEN 1 END) as frozen_users
FROM profiles;

-- 5. MOSTRAR USUÁRIOS QUE AINDA PRECISAM DE ATENÇÃO
SELECT 
  'Usuários que precisam de atenção:' as info,
  p.id,
  p.email,
  p.full_name,
  p.access_granted,
  p.account_frozen,
  au.email_confirmed_at,
  au.created_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE (p.access_granted = false AND p.account_frozen = false)
   OR p.full_name IS NULL
   OR au.email_confirmed_at IS NULL
ORDER BY au.created_at DESC;

-- 6. VERIFICAR RLS POLICIES ESTÃO CORRETAS
-- Garantir que as políticas RLS permitam acesso adequado
SELECT 
  'Verificando RLS:' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname; 