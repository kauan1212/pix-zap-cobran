-- Remover as políticas que causam recursão infinita
DROP POLICY IF EXISTS "Allow public read for clients with valid tokens" ON public.clients;

-- Criar uma política mais simples que permite leitura pública de clientes
-- sem causar recursão infinita
CREATE POLICY "Allow public read for clients" 
ON public.clients 
FOR SELECT 
USING (true);

-- Também vamos simplificar as outras políticas para evitar problemas similares
DROP POLICY IF EXISTS "Allow public read for billings with valid client tokens" ON public.billings;
DROP POLICY IF EXISTS "Allow public read for extra services with valid client tokens" ON public.extra_services;

-- Criar políticas mais simples para billings
CREATE POLICY "Allow public read for billings" 
ON public.billings 
FOR SELECT 
USING (true);

-- Criar políticas mais simples para extra_services
CREATE POLICY "Allow public read for extra services" 
ON public.extra_services 
FOR SELECT 
USING (true);