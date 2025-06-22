
-- Adicionar coluna pix_key na tabela profiles
ALTER TABLE public.profiles ADD COLUMN pix_key TEXT;

-- Adicionar RLS policies para a tabela profiles se não existirem
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para profiles
DO $$
BEGIN
    -- Verificar se a política já existe antes de criar
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" 
          ON public.profiles 
          FOR SELECT 
          USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
          ON public.profiles 
          FOR UPDATE 
          USING (auth.uid() = id);
    END IF;
END
$$;

-- Adicionar RLS policies para todas as tabelas que precisam
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_access_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas para clients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clients' 
        AND policyname = 'Users can view their own clients'
    ) THEN
        CREATE POLICY "Users can view their own clients" 
          ON public.clients 
          FOR SELECT 
          USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clients' 
        AND policyname = 'Users can create their own clients'
    ) THEN
        CREATE POLICY "Users can create their own clients" 
          ON public.clients 
          FOR INSERT 
          WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clients' 
        AND policyname = 'Users can update their own clients'
    ) THEN
        CREATE POLICY "Users can update their own clients" 
          ON public.clients 
          FOR UPDATE 
          USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clients' 
        AND policyname = 'Users can delete their own clients'
    ) THEN
        CREATE POLICY "Users can delete their own clients" 
          ON public.clients 
          FOR DELETE 
          USING (user_id = auth.uid());
    END IF;
END
$$;

-- Políticas para billings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'billings' 
        AND policyname = 'Users can view their own billings'
    ) THEN
        CREATE POLICY "Users can view their own billings" 
          ON public.billings 
          FOR SELECT 
          USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'billings' 
        AND policyname = 'Users can create their own billings'
    ) THEN
        CREATE POLICY "Users can create their own billings" 
          ON public.billings 
          FOR INSERT 
          WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'billings' 
        AND policyname = 'Users can update their own billings'
    ) THEN
        CREATE POLICY "Users can update their own billings" 
          ON public.billings 
          FOR UPDATE 
          USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'billings' 
        AND policyname = 'Users can delete their own billings'
    ) THEN
        CREATE POLICY "Users can delete their own billings" 
          ON public.billings 
          FOR DELETE 
          USING (user_id = auth.uid());
    END IF;
END
$$;

-- Política especial para client_access_tokens (permite acesso sem autenticação para o portal)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'client_access_tokens' 
        AND policyname = 'Allow public access to client tokens'
    ) THEN
        CREATE POLICY "Allow public access to client tokens" 
          ON public.client_access_tokens 
          FOR SELECT 
          TO public;
    END IF;
END
$$;
