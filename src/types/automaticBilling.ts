export interface AutomaticBillingConfig {
  id: string;
  user_id: string;
  whatsapp_number: string;
  daily_send_time: string;
  message_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomaticBillingLog {
  id: string;
  billing_id: string;
  user_id: string;
  client_id: string;
  message_sent_at: string;
  message_content: string;
  status: string;
  created_at: string;
}

export interface AutomaticBillingFormData {
  whatsapp_number: string;
  daily_send_time: string;
  message_template: string;
  is_active: boolean;
}

export interface OverdueBilling {
  id: string;
  client_id: string;
  amount: number;
  due_date: string;
  description: string;
  days_overdue: number;
  client_name: string;
  receipt_submitted_at?: string;
  receipt_confirmed_at?: string;
  receipt_url?: string;
}