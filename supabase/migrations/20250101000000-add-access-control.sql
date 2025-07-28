-- Adicionar campos de controle de acesso na tabela profiles
ALTER TABLE public.profiles ADD COLUMN access_granted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN account_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN frozen_reason TEXT;

-- Atualizar tipos TypeScript
COMMENT ON COLUMN public.profiles.access_granted IS 'Indica se o acesso à conta foi liberado pelo admin';
COMMENT ON COLUMN public.profiles.account_frozen IS 'Indica se a conta foi congelada por falta de pagamento';
COMMENT ON COLUMN public.profiles.frozen_reason IS 'Motivo do congelamento da conta';

-- Criar política para admins poderem gerenciar acesso de outros usuários
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Admins can manage all profiles'
    ) THEN
        CREATE POLICY "Admins can manage all profiles" 
          ON public.profiles 
          FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() AND is_admin = true
            )
          );
    END IF;
END
$$;

-- Atualizar política existente para permitir que usuários vejam apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Atualizar política existente para permitir que usuários atualizem apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id); 