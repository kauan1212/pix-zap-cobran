-- Fix the get_all_profiles function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS TABLE(
  id uuid, 
  email text, 
  full_name text, 
  company text,
  pix_key text, 
  is_admin boolean, 
  access_granted boolean, 
  account_frozen boolean, 
  frozen_reason text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar esta função';
  END IF;
  
  -- Retornar todos os perfis com especificação explícita das colunas
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.company,
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
$function$;