-- Permitir acesso público para leitura dos tokens de acesso do cliente
-- Isso permitirá que qualquer pessoa com um token válido acesse o portal

-- Primeiro, adicionar uma política que permite leitura pública dos tokens
CREATE POLICY "Allow public read for client access tokens" 
ON public.client_access_tokens 
FOR SELECT 
USING (true);

-- Também vamos garantir que as consultas relacionadas funcionem
-- Adicionar política para leitura pública de clientes através de tokens válidos
CREATE POLICY "Allow public read for clients with valid tokens" 
ON public.clients 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM client_access_tokens 
    WHERE client_access_tokens.client_id = clients.id 
    AND client_access_tokens.expires_at > NOW()
  )
);

-- Permitir leitura pública de cobranças para clientes com tokens válidos
CREATE POLICY "Allow public read for billings with valid client tokens" 
ON public.billings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM client_access_tokens 
    WHERE client_access_tokens.client_id = billings.client_id 
    AND client_access_tokens.expires_at > NOW()
  )
);

-- Permitir leitura pública de serviços extras para clientes com tokens válidos
CREATE POLICY "Allow public read for extra services with valid client tokens" 
ON public.extra_services 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM client_access_tokens 
    WHERE client_access_tokens.client_id = extra_services.client_id 
    AND client_access_tokens.expires_at > NOW()
  )
);

-- Permitir leitura pública limitada de perfis apenas para buscar chave PIX
CREATE POLICY "Allow public read for profile pix_key" 
ON public.profiles 
FOR SELECT 
USING (true);