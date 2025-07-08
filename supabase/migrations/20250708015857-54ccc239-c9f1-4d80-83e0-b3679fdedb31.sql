-- Corrigir política RLS para client_access_tokens
DROP POLICY IF EXISTS "Policy to implement Time To Live (TTL)" ON client_access_tokens;
DROP POLICY IF EXISTS "Users can manage client tokens" ON client_access_tokens;

-- Política para permitir leitura anônima de tokens válidos (necessário para validação)
CREATE POLICY "Allow public token validation" 
ON client_access_tokens 
FOR SELECT 
USING (expires_at > now());

-- Política para proprietários gerenciarem tokens
CREATE POLICY "Users can manage client tokens" 
ON client_access_tokens 
FOR ALL 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- Corrigir política de billings para permitir acesso via token
DROP POLICY IF EXISTS "Clients can view their billings via token" ON billings;

CREATE POLICY "Clients can view their billings via token" 
ON billings 
FOR SELECT 
USING (
  -- Permitir acesso autenticado normal
  (auth.uid() = user_id) 
  OR 
  -- Permitir acesso via token válido (para área do cliente)
  (client_id IN (
    SELECT cat.client_id 
    FROM client_access_tokens cat 
    WHERE cat.expires_at > now()
  ))
);