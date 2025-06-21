
-- Criar tabela para clientes/locatários
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf_cnpj TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para cobranças
CREATE TABLE public.billings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  penalty DECIMAL(10,2),
  interest DECIMAL(5,2),
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para tokens de acesso dos clientes
CREATE TABLE public.client_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 year')
);

-- Habilitar RLS (Row Level Security) nas tabelas
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_access_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clients
CREATE POLICY "Users can view their own clients" 
  ON public.clients 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients" 
  ON public.clients 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" 
  ON public.clients 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" 
  ON public.clients 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para billings
CREATE POLICY "Users can view their own billings" 
  ON public.billings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own billings" 
  ON public.billings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own billings" 
  ON public.billings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own billings" 
  ON public.billings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Política especial para permitir que clientes vejam suas próprias cobranças através do token
CREATE POLICY "Clients can view their billings via token"
  ON public.billings
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id 
      FROM public.client_access_tokens 
      WHERE token = current_setting('app.client_token', true)
      AND expires_at > now()
    )
  );

-- Políticas RLS para client_access_tokens
CREATE POLICY "Users can manage client tokens" 
  ON public.client_access_tokens 
  FOR ALL 
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Função para gerar token único para clientes
CREATE OR REPLACE FUNCTION generate_client_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar token automaticamente quando um cliente é criado
CREATE OR REPLACE FUNCTION create_client_token()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.client_access_tokens (client_id, token)
  VALUES (NEW.id, generate_client_token());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_client_created
  AFTER INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION create_client_token();
