
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AutoBillingPlan } from '@/types/autoBilling';
import { toast } from '@/hooks/use-toast';

export const useAutoBillingPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<AutoBillingPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPlans = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('auto_billing_plans')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading auto billing plans:', error);
        toast({
          title: "Erro ao carregar planos",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setPlans((data as AutoBillingPlan[]) || []);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar os planos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('auto_billing_plans')
        .update({ is_active: isActive })
        .eq('id', planId);

      if (error) {
        toast({
          title: "Erro ao atualizar plano",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Plano atualizado",
          description: `Plano ${isActive ? 'ativado' : 'desativado'} com sucesso.`,
        });
        loadPlans();
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao atualizar o plano.",
        variant: "destructive",
      });
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      // Delete related charges first
      await supabase
        .from('billings')
        .delete()
        .eq('auto_billing_plan_id', planId)
        .eq('status', 'pending');

      const { error } = await supabase
        .from('auto_billing_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        toast({
          title: "Erro ao excluir plano",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Plano excluído",
          description: "Plano e cobranças pendentes removidos com sucesso.",
        });
        loadPlans();
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao excluir o plano.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadPlans();
    }
  }, [user]);

  return {
    plans,
    loading,
    loadPlans,
    togglePlanStatus,
    deletePlan,
  };
};
