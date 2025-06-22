
-- Criar tabela para planos de recorrência
CREATE TABLE public.recurring_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  penalty NUMERIC,
  interest NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  next_billing_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adicionar RLS para planos de recorrência
ALTER TABLE public.recurring_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recurring plans" 
  ON public.recurring_plans 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own recurring plans" 
  ON public.recurring_plans 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own recurring plans" 
  ON public.recurring_plans 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own recurring plans" 
  ON public.recurring_plans 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Adicionar coluna para identificar cobranças de recorrência
ALTER TABLE public.billings ADD COLUMN recurring_plan_id UUID REFERENCES recurring_plans(id) ON DELETE SET NULL;

-- Corrigir tokens de acesso do cliente - garantir que sempre existam
INSERT INTO public.client_access_tokens (client_id, token, expires_at)
SELECT 
  c.id,
  generate_client_token(),
  now() + interval '10 years'
FROM clients c 
WHERE NOT EXISTS (
  SELECT 1 FROM client_access_tokens cat WHERE cat.client_id = c.id
);
