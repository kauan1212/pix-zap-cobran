import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalculateAmortizationRequest {
  client_id: string;
  payment_amount: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { client_id, payment_amount }: CalculateAmortizationRequest = await req.json();

    // Validações
    if (!client_id || !payment_amount) {
      return new Response(
        JSON.stringify({ error: 'client_id e payment_amount são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (payment_amount < 25) {
      return new Response(
        JSON.stringify({ error: 'Valor mínimo para amortização é R$ 25,00' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se cliente existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      console.error('Erro ao buscar cliente:', clientError);
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular desconto se valor >= 1000
    const has_discount = payment_amount >= 1000;
    const discount_applied = has_discount ? payment_amount * 0.1 : 0;
    const total_credit = payment_amount + discount_applied;

    // Buscar cobranças pendentes ordenadas da mais antiga para mais recente
    const { data: billings, error: billingsError } = await supabase
      .from('billings')
      .select('id, description, due_date, amount, amortized_amount, status')
      .eq('client_id', client_id)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true });

    if (billingsError) {
      console.error('Erro ao buscar cobranças:', billingsError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar cobranças' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!billings || billings.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cliente não possui cobranças pendentes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simular distribuição do crédito
    let remaining_credit = total_credit;
    const affected_billings = [];

    for (const billing of billings) {
      if (remaining_credit <= 0) break;

      const already_amortized = billing.amortized_amount || 0;
      const current_debt = billing.amount - already_amortized;

      if (current_debt <= 0) continue;

      const will_apply = Math.min(remaining_credit, current_debt);
      const remaining_after = current_debt - will_apply;
      const will_be_paid = remaining_after <= 0.01; // Considera pago se restar menos de 1 centavo

      affected_billings.push({
        billing_id: billing.id,
        billing_description: billing.description,
        billing_due_date: billing.due_date,
        billing_amount: billing.amount,
        already_amortized,
        current_debt,
        will_apply,
        remaining_after,
        will_be_paid,
      });

      remaining_credit -= will_apply;
    }

    const response = {
      payment_amount,
      discount_applied,
      total_credit,
      has_discount,
      affected_billings,
      remaining_credit: Math.max(0, remaining_credit),
    };

    console.log('Cálculo de amortização realizado:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na função calculate-amortization:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
