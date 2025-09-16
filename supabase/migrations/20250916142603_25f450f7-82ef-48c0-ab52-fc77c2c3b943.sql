-- Create automatic billing configuration table
CREATE TABLE public.automatic_billing_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_number TEXT NOT NULL,
  daily_send_time TIME NOT NULL DEFAULT '10:00',
  message_template TEXT NOT NULL DEFAULT 'Olá [NOME]! Sou a Valéria, assistente virtual da LocAuto - aluguel de motos. Você tem uma cobrança em atraso no valor de [VALOR] com vencimento em [VENCIMENTO]. Há [DIAS_ATRASO] dias em atraso. Por favor, regularize sua situação.',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create automatic billing logs table
CREATE TABLE public.automatic_billing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  billing_id UUID NOT NULL REFERENCES public.billings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  message_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to billings table
ALTER TABLE public.billings 
ADD COLUMN receipt_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN receipt_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN auto_billing_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN receipt_url TEXT;

-- Enable RLS on new tables
ALTER TABLE public.automatic_billing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automatic_billing_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for automatic_billing_config
CREATE POLICY "Users can view their own automatic billing config" 
ON public.automatic_billing_config 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automatic billing config" 
ON public.automatic_billing_config 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automatic billing config" 
ON public.automatic_billing_config 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automatic billing config" 
ON public.automatic_billing_config 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for automatic_billing_logs
CREATE POLICY "Users can view their own automatic billing logs" 
ON public.automatic_billing_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automatic billing logs" 
ON public.automatic_billing_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at on automatic_billing_config
CREATE TRIGGER update_automatic_billing_config_updated_at
BEFORE UPDATE ON public.automatic_billing_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_automatic_billing_logs_billing_id ON public.automatic_billing_logs(billing_id);
CREATE INDEX idx_automatic_billing_logs_user_id ON public.automatic_billing_logs(user_id);
CREATE INDEX idx_automatic_billing_logs_message_sent_at ON public.automatic_billing_logs(message_sent_at);
CREATE INDEX idx_billings_receipt_submitted_at ON public.billings(receipt_submitted_at);
CREATE INDEX idx_billings_receipt_confirmed_at ON public.billings(receipt_confirmed_at);
CREATE INDEX idx_billings_status_due_date ON public.billings(status, due_date);