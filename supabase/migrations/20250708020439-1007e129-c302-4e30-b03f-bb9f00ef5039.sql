-- Corrigir política para clientes para permitir leitura via token válido
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;

CREATE POLICY "Users can view their own clients" 
ON clients 
FOR SELECT 
USING (
  -- Acesso normal autenticado
  (auth.uid() = user_id) 
  OR 
  -- Acesso via token válido para área do cliente
  (id IN (
    SELECT cat.client_id 
    FROM client_access_tokens cat 
    WHERE cat.expires_at > now()
  ))
);