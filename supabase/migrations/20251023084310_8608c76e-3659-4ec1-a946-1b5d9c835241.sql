-- Criar tabela de amortizações de pagamento
CREATE TABLE public.payment_amortizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_amount NUMERIC NOT NULL CHECK (payment_amount >= 25.00),
  discount_applied NUMERIC NOT NULL DEFAULT 0,
  total_credit NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  payment_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id)
);

-- Criar tabela de aplicações de amortização
CREATE TABLE public.amortization_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amortization_id UUID NOT NULL REFERENCES public.payment_amortizations(id) ON DELETE CASCADE,
  billing_id UUID NOT NULL REFERENCES public.billings(id) ON DELETE CASCADE,
  amount_applied NUMERIC NOT NULL CHECK (amount_applied > 0),
  billing_remaining NUMERIC NOT NULL CHECK (billing_remaining >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de créditos futuros do cliente
CREATE TABLE public.client_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  used_amount NUMERIC NOT NULL DEFAULT 0 CHECK (used_amount >= 0),
  source TEXT NOT NULL DEFAULT 'amortization',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de logs de amortização
CREATE TABLE public.amortization_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amortization_id UUID REFERENCES public.payment_amortizations(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar coluna amortized_amount à tabela billings
ALTER TABLE public.billings 
ADD COLUMN IF NOT EXISTS amortized_amount NUMERIC NOT NULL DEFAULT 0 CHECK (amortized_amount >= 0);

-- Índices para performance
CREATE INDEX idx_payment_amortizations_client_id ON public.payment_amortizations(client_id);
CREATE INDEX idx_payment_amortizations_user_id ON public.payment_amortizations(user_id);
CREATE INDEX idx_payment_amortizations_status ON public.payment_amortizations(status);
CREATE INDEX idx_payment_amortizations_code ON public.payment_amortizations(payment_code);

CREATE INDEX idx_amortization_applications_amortization_id ON public.amortization_applications(amortization_id);
CREATE INDEX idx_amortization_applications_billing_id ON public.amortization_applications(billing_id);

CREATE INDEX idx_client_credits_client_id ON public.client_credits(client_id);
CREATE INDEX idx_client_credits_status ON public.client_credits(status);

CREATE INDEX idx_amortization_logs_amortization_id ON public.amortization_logs(amortization_id);
CREATE INDEX idx_amortization_logs_user_id ON public.amortization_logs(user_id);

CREATE INDEX idx_billings_amortized_amount ON public.billings(amortized_amount);

-- Habilitar RLS
ALTER TABLE public.payment_amortizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amortization_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amortization_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para payment_amortizations
CREATE POLICY "Allow public read for payment amortizations"
  ON public.payment_amortizations FOR SELECT
  USING (true);

CREATE POLICY "Users can create amortizations for their clients"
  ON public.payment_amortizations FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own amortizations"
  ON public.payment_amortizations FOR UPDATE
  USING (user_id = auth.uid());

-- Políticas RLS para amortization_applications
CREATE POLICY "Allow public read for amortization applications"
  ON public.amortization_applications FOR SELECT
  USING (true);

CREATE POLICY "Users can create amortization applications"
  ON public.amortization_applications FOR INSERT
  WITH CHECK (
    amortization_id IN (
      SELECT id FROM public.payment_amortizations WHERE user_id = auth.uid()
    )
  );

-- Políticas RLS para client_credits
CREATE POLICY "Allow public read for client credits"
  ON public.client_credits FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their clients' credits"
  ON public.client_credits FOR ALL
  USING (user_id = auth.uid());

-- Políticas RLS para amortization_logs
CREATE POLICY "Users can view their own amortization logs"
  ON public.amortization_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own amortization logs"
  ON public.amortization_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Função para gerar código de pagamento único
CREATE OR REPLACE FUNCTION generate_payment_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  code := 'AMORT-' || upper(substring(encode(gen_random_bytes(6), 'hex') from 1 for 10));
  RETURN code;
END;
$$ LANGUAGE plpgsql;