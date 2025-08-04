-- Atualizar função get_all_profiles_simple para incluir whatsapp
CREATE OR REPLACE FUNCTION public.get_all_profiles_simple()
 RETURNS TABLE(id uuid, email text, full_name text, pix_key text, whatsapp text, is_admin boolean, access_granted boolean, account_frozen boolean, frozen_reason text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    p.whatsapp,
    p.is_admin,
    p.access_granted,
    p.account_frozen,
    p.frozen_reason,
    p.created_at,
    p.updated_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$function$;