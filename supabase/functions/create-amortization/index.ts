import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAmortizationRequest {
  client_id: string;
  payment_amount: number;
  calculation: any;
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

    const { client_id, payment_amount, calculation }: CreateAmortizationRequest = await req.json();

    // Validações
    if (!client_id || !payment_amount || !calculation) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se cliente pertence ao usuário
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, user_id')
      .eq('id', client_id)
      .single();

    if (clientError || !client || client.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado ou sem permissão' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar código único de pagamento
    const { data: codeData, error: codeError } = await supabase.rpc('generate_payment_code');
    
    if (codeError) {
      console.error('Erro ao gerar código:', codeError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar código de pagamento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payment_code = codeData;

    // Criar registro de amortização
    const { data: amortization, error: amortizationError } = await supabase
      .from('payment_amortizations')
      .insert({
        client_id,
        user_id: user.id,
        payment_amount: calculation.payment_amount,
        discount_applied: calculation.discount_applied,
        total_credit: calculation.total_credit,
        status: 'pending',
        payment_code,
      })
      .select()
      .single();

    if (amortizationError) {
      console.error('Erro ao criar amortização:', amortizationError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar amortização', details: amortizationError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Registrar log
    await supabase.from('amortization_logs').insert({
      amortization_id: amortization.id,
      user_id: user.id,
      action: 'created',
      details: {
        payment_code,
        calculation,
      },
    });

    console.log('Amortização criada:', amortization);

    return new Response(
      JSON.stringify({
        success: true,
        payment_code,
        amortization_id: amortization.id,
        message: 'Use este código ao fazer o pagamento PIX',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na função create-amortization:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
