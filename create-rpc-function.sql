-- Criar função RPC para buscar todos os perfis
-- Execute este script no SQL Editor do Supabase

-- Função para buscar todos os perfis (apenas para admins)
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

-- Testar a função
-- SELECT * FROM get_all_profiles(); 