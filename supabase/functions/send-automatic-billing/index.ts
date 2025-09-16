import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      billings: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          amount: number;
          due_date: string;
          status: string;
          description: string;
          receipt_confirmed_at: string | null;
        }
      }
      clients: {
        Row: {
          id: string;
          name: string;
          phone: string;
        }
      }
      automatic_billing_config: {
        Row: {
          user_id: string;
          whatsapp_number: string;
          daily_send_time: string;
          message_template: string;
          is_active: boolean;
        }
      }
      automatic_billing_logs: {
        Insert: {
          billing_id: string;
          user_id: string;
          client_id: string;
          message_content: string;
          status: string;
        }
      }
    }
  }
}

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

function calculateDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
}

function replaceMessageVariables(template: string, billing: any, client: any, daysOverdue: number): string {
  return template
    .replace(/\[NOME\]/g, client.name)
    .replace(/\[VALOR\]/g, formatCurrency(billing.amount))
    .replace(/\[VENCIMENTO\]/g, formatDate(billing.due_date))
    .replace(/\[DIAS_ATRASO\]/g, daysOverdue.toString());
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting automatic billing messages process...');

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    console.log(`Current time: ${currentTime}`);

    // Get all active configurations for the current time
    const { data: configs, error: configError } = await supabase
      .from('automatic_billing_config')
      .select('*')
      .eq('is_active', true)
      .eq('daily_send_time', currentTime);

    if (configError) {
      console.error('Error fetching configs:', configError);
      throw configError;
    }

    console.log(`Found ${configs?.length || 0} active configurations for current time`);

    if (!configs || configs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active configurations for current time',
          processed: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      );
    }

    let totalMessagesSent = 0;
    let totalErrors = 0;

    // Process each user's configuration
    for (const config of configs) {
      try {
        console.log(`Processing user: ${config.user_id}`);

        // Get overdue billings for this user that haven't been confirmed as paid
        const { data: overdueBillings, error: billingsError } = await supabase
          .from('billings')
          .select(`
            *,
            clients (
              id,
              name,
              phone
            )
          `)
          .eq('user_id', config.user_id)
          .eq('status', 'overdue')
          .is('receipt_confirmed_at', null);

        if (billingsError) {
          console.error(`Error fetching billings for user ${config.user_id}:`, billingsError);
          totalErrors++;
          continue;
        }

        console.log(`Found ${overdueBillings?.length || 0} overdue billings for user ${config.user_id}`);

        if (!overdueBillings || overdueBillings.length === 0) {
          continue;
        }

        // Check if we already sent a message today for each billing
        const today = now.toISOString().split('T')[0];
        
        for (const billing of overdueBillings) {
          try {
            // Check if message was already sent today
            const { data: existingLog, error: logCheckError } = await supabase
              .from('automatic_billing_logs')
              .select('id')
              .eq('billing_id', billing.id)
              .gte('message_sent_at', `${today}T00:00:00Z`)
              .lt('message_sent_at', `${today}T23:59:59Z`)
              .single();

            if (logCheckError && logCheckError.code !== 'PGRST116') {
              console.error(`Error checking log for billing ${billing.id}:`, logCheckError);
              continue;
            }

            if (existingLog) {
              console.log(`Message already sent today for billing ${billing.id}`);
              continue;
            }

            const client = (billing as any).clients;
            if (!client) {
              console.error(`No client found for billing ${billing.id}`);
              continue;
            }

            const daysOverdue = calculateDaysOverdue(billing.due_date);
            const message = replaceMessageVariables(config.message_template, billing, client, daysOverdue);

            // Create WhatsApp URL
            const whatsappUrl = `https://wa.me/${config.whatsapp_number}?text=${encodeURIComponent(message)}`;
            
            console.log(`Generated WhatsApp URL for ${client.name}: ${whatsappUrl}`);

            // Log the message
            const { error: logError } = await supabase
              .from('automatic_billing_logs')
              .insert({
                billing_id: billing.id,
                user_id: config.user_id,
                client_id: billing.client_id,
                message_content: message,
                status: 'sent'
              });

            if (logError) {
              console.error(`Error logging message for billing ${billing.id}:`, logError);
              totalErrors++;
            } else {
              totalMessagesSent++;
              console.log(`Message logged successfully for billing ${billing.id}`);
            }

          } catch (billingError) {
            console.error(`Error processing billing ${billing.id}:`, billingError);
            totalErrors++;
          }
        }

      } catch (userError) {
        console.error(`Error processing user ${config.user_id}:`, userError);
        totalErrors++;
      }
    }

    console.log(`Process completed. Messages sent: ${totalMessagesSent}, Errors: ${totalErrors}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed automatic billing messages`,
        messagesSent: totalMessagesSent,
        errors: totalErrors,
        processedConfigs: configs.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-automatic-billing:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});