
-- Adicionar foreign keys que estão faltando para manter integridade referencial
ALTER TABLE public.auto_billing_plans 
ADD CONSTRAINT auto_billing_plans_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.auto_billing_plans 
ADD CONSTRAINT auto_billing_plans_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar foreign key para auto_billing_plan_id na tabela billings
ALTER TABLE public.billings 
ADD CONSTRAINT billings_auto_billing_plan_id_fkey 
FOREIGN KEY (auto_billing_plan_id) REFERENCES public.auto_billing_plans(id) ON DELETE SET NULL;

-- Corrigir a constraint de frequency para incluir valores corretos
ALTER TABLE public.auto_billing_plans 
DROP CONSTRAINT IF EXISTS auto_billing_plans_frequency_check;

ALTER TABLE public.auto_billing_plans 
ADD CONSTRAINT auto_billing_plans_frequency_check 
CHECK (frequency IN ('weekly', 'biweekly', 'monthly'));

-- Adicionar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_auto_billing_plans_updated_at 
    BEFORE UPDATE ON public.auto_billing_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
