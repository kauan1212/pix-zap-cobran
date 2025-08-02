
import { AutoBillingPlan } from '@/types/autoBilling';

export const generateBillingsForPlan = (plan: AutoBillingPlan, userId: string) => {
  const billings = [];
  
  // Criar datas corretamente no timezone local sem problemas de offset
  const [startYear, startMonth, startDay] = plan.start_date.split('-').map(Number);
  const [endYear, endMonth, endDay] = plan.end_date.split('-').map(Number);
  
  const startDate = new Date(startYear, startMonth - 1, startDay); // month é 0-indexed
  const endDate = new Date(endYear, endMonth - 1, endDay);
  let currentDate = new Date(startDate);

  // Validate dates
  if (startDate >= endDate) {
    console.error('Invalid date range: start date must be before end date');
    return [];
  }

  // Prevent infinite loops by limiting iterations
  let iterations = 0;
  const maxIterations = 1000; // Limit to prevent infinite loops

  while (currentDate <= endDate && iterations < maxIterations) {
    // Formatar a data corretamente no formato YYYY-MM-DD
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dueDate = `${year}-${month}-${day}`;
    
    billings.push({
      user_id: userId,
      client_id: plan.client_id,
      amount: plan.amount,
      description: plan.description,
      due_date: dueDate,
      auto_billing_plan_id: plan.id,
      status: 'pending'
    });

    // Calculate next date based on frequency
    const nextDate = new Date(currentDate);
    switch (plan.frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        console.error('Invalid frequency:', plan.frequency);
        return billings;
    }
    
    currentDate = nextDate;
    iterations++;
  }

  if (iterations >= maxIterations) {
    console.warn('Maximum iterations reached while generating billings');
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
    const { data: tokenData, error } = await supabase
      .from('client_access_tokens')
      .select('token')
      .eq('client_id', clientId)
      .single();

    if (error) {
      console.warn('No access token found for client:', clientId);
      return;
    }

    if (tokenData?.token) {
      // Simulate push notification (in production, use a service like Firebase)
      console.log(`Notification sent to client: ${billingCount} new charges available`);
      
      // Here you can integrate with a real push notifications service
      // For example: Firebase Cloud Messaging, OneSignal, etc.
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw the error, just log it as notifications are not critical
  }
};
