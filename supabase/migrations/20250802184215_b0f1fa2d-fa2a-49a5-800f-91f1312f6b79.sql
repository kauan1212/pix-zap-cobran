-- Corrigir a função delete_user_complete para funcionar corretamente
-- Primeiro, vamos dropar a função existente e criar uma nova

DROP FUNCTION IF EXISTS public.delete_user_complete(text);

-- Nova função para deletar usuário completamente
CREATE OR REPLACE FUNCTION public.delete_user_complete(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    user_uuid uuid;
    delete_count int := 0;
BEGIN
    -- Encontrar o UUID do usuário pelo email
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = user_email;
    
    -- Se usuário não encontrado
    IF user_uuid IS NULL THEN
        RETURN '❌ Usuário não encontrado';
    END IF;
    
    -- Deletar do profiles primeiro (cascade irá deletar de auth.users)
    DELETE FROM public.profiles WHERE id = user_uuid;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    
    -- Deletar de auth.users se ainda existir
    DELETE FROM auth.users WHERE id = user_uuid;
    
    IF delete_count > 0 THEN
        RETURN '✅ Usuário deletado com sucesso';
    ELSE
        RETURN '❌ Erro ao deletar usuário';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN '❌ Erro: ' || SQLERRM;
END;
$$;