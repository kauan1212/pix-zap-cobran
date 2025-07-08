create table extra_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) not null,
  description text not null,
  amount numeric(12,2) not null,
  status text not null default 'pendente', -- 'pendente' ou 'pago'
  created_at timestamp with time zone default now(),
  paid_at timestamp with time zone
); 