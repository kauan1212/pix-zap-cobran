
import { AutoBillingPlan } from '@/types/autoBilling';

export const generateBillingsForPlan = (plan: AutoBillingPlan, userId: string) => {
  const billings = [];
  const startDate = new Date(plan.start_date);
  const endDate = new Date(plan.end_date);
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    billings.push({
      user_id: userId,
      client_id: plan.client_id,
      amount: plan.amount,
      description: plan.description,
      due_date: currentDate.toISOString().split('T')[0],
      auto_billing_plan_id: plan.id,
    });

    // Calculate next date based on frequency
    switch (plan.frequency) {
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return billings;
};

export const getFrequencyText = (frequency: string) => {
  switch (frequency) {
    case 'weekly': return 'Semanal';
    case 'biweekly': return 'Quinzenal';
    case 'monthly': return 'Mensal';
    default: return frequency;
  }
};

export const sendNotificationToClient = async (clientId: string, billingCount: number, supabase: any) => {
  try {
    // Get client token
    const { data: tokenData } = await supabase
      .from('client_access_tokens')
      .select('token')
      .eq('client_id', clientId)
      .single();

    if (tokenData?.token) {
      // Simulate push notification (in production, use a service like Firebase)
      console.log(`Notification sent to client: ${billingCount} new charges available`);
      
      // Here you can integrate with a real push notifications service
      // For example: Firebase Cloud Messaging, OneSignal, etc.
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
