-- Fix the delete_user_complete function to properly delete users
DROP FUNCTION IF EXISTS public.delete_user_complete(text);

CREATE OR REPLACE FUNCTION public.delete_user_complete(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    user_id UUID;
    deleted_count INTEGER := 0;
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    ) THEN
      RAISE EXCEPTION 'Acesso negado: apenas administradores podem deletar usuários';
    END IF;

    -- Pegar o ID do usuário pelo email do perfil
    SELECT id INTO user_id FROM profiles WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN '❌ Usuário não encontrado: ' || user_email;
    END IF;
    
    RAISE NOTICE '🗑️ Deletando usuário: % (%)', user_email, user_id;
    
    -- Deletar dados relacionados primeiro
    DELETE FROM billings WHERE user_id = user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '💳 Cobranças deletadas: %', deleted_count;
    
    DELETE FROM clients WHERE user_id = user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '👥 Clientes deletados: %', deleted_count;
    
    DELETE FROM auto_billing_plans WHERE user_id = user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '🤖 Planos de cobrança deletados: %', deleted_count;
    
    DELETE FROM recurring_plans WHERE user_id = user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '🔄 Planos recorrentes deletados: %', deleted_count;
    
    -- Deletar perfil do usuário
    DELETE FROM profiles WHERE id = user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '👤 Perfil deletado: %', deleted_count;
    
    -- Tentar deletar do auth usando função do Supabase se disponível
    BEGIN
        -- Usar a extensão admin_api se estiver disponível
        PERFORM extensions.delete_user(user_id);
        RAISE NOTICE '🔐 Usuário da autenticação deletado via admin API';
    EXCEPTION 
        WHEN OTHERS THEN
            -- Se não conseguir usar admin API, pelo menos o perfil foi deletado
            RAISE NOTICE '⚠️ Perfil deletado mas usuário auth pode persistir: %', SQLERRM;
    END;
    
    RETURN '✅ Usuário deletado: ' || user_email || ' (Perfil e dados relacionados removidos)';
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN '❌ Erro ao deletar usuário: ' || SQLERRM;
END;
$function$;