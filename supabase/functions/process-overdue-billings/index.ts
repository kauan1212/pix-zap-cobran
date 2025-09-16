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
          auto_billing_enabled: boolean;
          receipt_confirmed_at: string | null;
        }
      }
      automatic_billing_config: {
        Row: {
          user_id: string;
          is_active: boolean;
          daily_send_time: string;
        }
      }
    }
  }
}

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting overdue billings process...');

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Find all billings that are overdue and not yet marked as such
    const { data: overdueBillings, error: billingsError } = await supabase
      .from('billings')
      .select('*')
      .lt('due_date', today)
      .neq('status', 'paid')
      .eq('auto_billing_enabled', true);

    if (billingsError) {
      console.error('Error fetching overdue billings:', billingsError);
      throw billingsError;
    }

    console.log(`Found ${overdueBillings?.length || 0} potentially overdue billings`);

    if (!overdueBillings || overdueBillings.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No overdue billings found',
          processed: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      );
    }

    // Update status to 'overdue' for billings that aren't marked as such
    const billingsToUpdate = overdueBillings.filter(billing => billing.status !== 'overdue');
    
    if (billingsToUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from('billings')
        .update({ status: 'overdue' })
        .in('id', billingsToUpdate.map(b => b.id));

      if (updateError) {
        console.error('Error updating billing status:', updateError);
        throw updateError;
      }

      console.log(`Updated ${billingsToUpdate.length} billings to overdue status`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${overdueBillings.length} overdue billings`,
        processed: overdueBillings.length,
        updated: billingsToUpdate.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in process-overdue-billings:', error);
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