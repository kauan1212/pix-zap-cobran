
-- Create auto_billing_plans table
CREATE TABLE public.auto_billing_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.auto_billing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own auto billing plans" 
  ON public.auto_billing_plans 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own auto billing plans" 
  ON public.auto_billing_plans 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auto billing plans" 
  ON public.auto_billing_plans 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own auto billing plans" 
  ON public.auto_billing_plans 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add auto_billing_plan_id column to billings table
ALTER TABLE public.billings ADD COLUMN auto_billing_plan_id UUID;
