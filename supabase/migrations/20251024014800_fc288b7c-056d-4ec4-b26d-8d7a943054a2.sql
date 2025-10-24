-- Corrigir política RLS para permitir criação de amortizações
-- Remover política antiga que impede clientes de criar amortizações
DROP POLICY IF EXISTS "Users can create amortizations for their clients" ON public.payment_amortizations;

-- Nova política: permitir que qualquer um crie amortizações
-- O user_id será validado na aplicação
CREATE POLICY "Anyone can create amortizations"
  ON public.payment_amortizations 
  FOR INSERT 
  WITH CHECK (true);