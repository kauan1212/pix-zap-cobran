import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessAmortizationRequest {
  payment_code: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { payment_code }: ProcessAmortizationRequest = await req.json();

    if (!payment_code) {
      return new Response(
        JSON.stringify({ error: 'Código de pagamento é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar amortização pendente
    const { data: amortization, error: amortizationError } = await supabase
      .from('payment_amortizations')
      .select('*')
      .eq('payment_code', payment_code)
      .eq('status', 'pending')
      .single();

    if (amortizationError || !amortization) {
      console.error('Erro ao buscar amortização:', amortizationError);
      return new Response(
        JSON.stringify({ error: 'Amortização não encontrada ou já processada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permissão
    if (amortization.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Sem permissão para processar esta amortização' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar status para processing
    await supabase
      .from('payment_amortizations')
      .update({ status: 'processing' })
      .eq('id', amortization.id);

    // Buscar cobranças pendentes do cliente
    const { data: billings, error: billingsError } = await supabase
      .from('billings')
      .select('*')
      .eq('client_id', amortization.client_id)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true });

    if (billingsError) {
      console.error('Erro ao buscar cobranças:', billingsError);
      throw new Error('Erro ao buscar cobranças');
    }

    let remaining_credit = amortization.total_credit;
    const applications = [];
    const updated_billings = [];

    // Distribuir crédito nas cobranças
    for (const billing of billings) {
      if (remaining_credit <= 0) break;

      const already_amortized = billing.amortized_amount || 0;
      const current_debt = billing.amount - already_amortized;

      if (current_debt <= 0) continue;

      const amount_to_apply = Math.min(remaining_credit, current_debt);
      const new_amortized = already_amortized + amount_to_apply;
      const billing_remaining = billing.amount - new_amortized;

      // Criar aplicação
      applications.push({
        amortization_id: amortization.id,
        billing_id: billing.id,
        amount_applied: amount_to_apply,
        billing_remaining,
      });

      // Atualizar cobrança
      const updateData: any = {
        amortized_amount: new_amortized,
      };

      // Se foi totalmente pago
      if (billing_remaining <= 0.01) {
        updateData.status = 'paid';
        updateData.payment_date = new Date().toISOString();
      }

      updated_billings.push({
        id: billing.id,
        ...updateData,
      });

      remaining_credit -= amount_to_apply;
    }

    // Inserir aplicações
    if (applications.length > 0) {
      const { error: applicationsError } = await supabase
        .from('amortization_applications')
        .insert(applications);

      if (applicationsError) {
        console.error('Erro ao criar aplicações:', applicationsError);
        throw new Error('Erro ao registrar aplicações');
      }
    }

    // Atualizar cobranças
    for (const billing of updated_billings) {
      const { error: updateError } = await supabase
        .from('billings')
        .update({
          amortized_amount: billing.amortized_amount,
          status: billing.status,
          payment_date: billing.payment_date,
        })
        .eq('id', billing.id);

      if (updateError) {
        console.error('Erro ao atualizar cobrança:', updateError);
      }
    }

    // Se sobrou crédito, criar crédito futuro
    if (remaining_credit > 0.01) {
      await supabase.from('client_credits').insert({
        client_id: amortization.client_id,
        user_id: amortization.user_id,
        amount: remaining_credit,
        used_amount: 0,
        source: 'amortization',
        status: 'active',
      });
    }

    // Finalizar amortização
    await supabase
      .from('payment_amortizations')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      })
      .eq('id', amortization.id);

    // Registrar log
    await supabase.from('amortization_logs').insert({
      amortization_id: amortization.id,
      user_id: user.id,
      action: 'processed',
      details: {
        applications_count: applications.length,
        billings_paid: updated_billings.filter(b => b.status === 'paid').length,
        remaining_credit,
      },
    });

    console.log('Amortização processada com sucesso:', amortization.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Amortização processada com sucesso',
        billings_affected: applications.length,
        billings_paid: updated_billings.filter(b => b.status === 'paid').length,
        remaining_credit,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na função process-amortization:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao processar amortização', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
