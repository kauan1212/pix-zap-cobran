export interface PaymentAmortization {
  id: string;
  client_id: string;
  user_id: string;
  payment_amount: number;
  discount_applied: number;
  total_credit: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_code: string;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

export interface AmortizationApplication {
  id: string;
  amortization_id: string;
  billing_id: string;
  amount_applied: number;
  billing_remaining: number;
  created_at: string;
}

export interface ClientCredit {
  id: string;
  client_id: string;
  user_id: string;
  amount: number;
  used_amount: number;
  source: string;
  status: 'active' | 'used' | 'expired';
  created_at: string;
  expires_at: string | null;
}

export interface AmortizationCalculation {
  payment_amount: number;
  discount_applied: number;
  total_credit: number;
  has_discount: boolean;
  affected_billings: {
    billing_id: string;
    billing_description: string;
    billing_due_date: string;
    billing_amount: number;
    already_amortized: number;
    current_debt: number;
    will_apply: number;
    remaining_after: number;
    will_be_paid: boolean;
  }[];
  remaining_credit: number;
}
