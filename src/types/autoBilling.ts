
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface AutoBillingPlan {
  id: string;
  client_id: string;
  name: string;
  amount: number;
  description: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  clients?: Client;
}

export interface AutoBillingFormData {
  client_id: string;
  name: string;
  amount: string;
  description: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  start_date: string;
  end_date: string;
}
