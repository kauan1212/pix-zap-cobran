
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PlusCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAutoBillingPlans } from '@/hooks/useAutoBillingPlans';
import { generateBillingsForPlan, sendNotificationToClient } from '@/utils/autoBillingUtils';
import { Client, AutoBillingFormData } from '@/types/autoBilling';
import AutoBillingForm from './AutoBillingForm';
import AutoBillingCard from './AutoBillingCard';
import AutoBillingEmptyState from './AutoBillingEmptyState';

interface AutoBillingManagerProps {
  clients: Client[];
  onDataChange: () => void;
}

const AutoBillingManager = ({ clients, onDataChange }: AutoBillingManagerProps) => {
  const { user } = useAuth();
  const { plans, loading, loadPlans, togglePlanStatus, deletePlan } = useAutoBillingPlans();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = async (formData: AutoBillingFormData) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    // Validate dates
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (endDate <= startDate) {
      toast({
        title: "Erro nas datas",
        description: "A data final deve ser posterior à data inicial.",
        variant: "destructive",
      });
      return;
    }

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Erro no valor",
        description: "O valor deve ser um número positivo.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: planData, error: planError } = await supabase
        .from('auto_billing_plans')
        .insert([
          {
            user_id: user.id,
            client_id: formData.client_id,
            name: formData.name,
            amount: amount,
            description: formData.description,
            frequency: formData.frequency,
            start_date: formData.start_date,
            end_date: formData.end_date,
          }
        ])
        .select()
        .single();

      if (planError) {
        console.error('Error creating plan:', planError);
        toast({
          title: "Erro ao criar plano",
          description: planError.message,
          variant: "destructive",
        });
        return;
      }

      if (!planData) {
        toast({
          title: "Erro ao criar plano",
          description: "Nenhum dado retornado após criação do plano.",
          variant: "destructive",
        });
        return;
      }

      // Generate all charges based on the plan
      const billings = generateBillingsForPlan({
        ...planData,
        frequency: formData.frequency
      }, user.id);

      if (billings.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhuma cobrança foi gerada para este período.",
          variant: "destructive",
        });
        return;
      }

      const { error: billingsError } = await supabase
        .from('billings')
        .insert(billings);

      if (billingsError) {
        console.error('Error creating billings:', billingsError);
        // If failed to create charges, remove the plan
        await supabase
          .from('auto_billing_plans')
          .delete()
          .eq('id', planData.id);

        toast({
          title: "Erro ao gerar cobranças",
          description: billingsError.message,
          variant: "destructive",
        });
        return;
      }

      // Send notification to client
      try {
        await sendNotificationToClient(formData.client_id, billings.length, supabase);
      } catch (notificationError) {
        console.warn('Error sending notification:', notificationError);
        // Don't fail the whole process for notification errors
      }

      const selectedClient = clients.find(c => c.id === formData.client_id);
      toast({
        title: "Plano criado com sucesso!",
        description: `${billings.length} cobranças foram geradas para ${selectedClient?.name}.`,
      });

      setIsDialogOpen(false);
      loadPlans();
      onDataChange();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao criar o plano. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (planId: string) => {
    await deletePlan(planId);
    onDataChange();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Carregando planos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cobranças Automáticas</h2>
          <p className="text-gray-600">Crie planos que geram cobranças automaticamente em períodos definidos</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Novo Plano Automático
            </Button>
          </DialogTrigger>
          <AutoBillingForm
            clients={clients}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </Dialog>
      </div>

      {plans.length === 0 ? (
        <AutoBillingEmptyState onCreatePlan={() => setIsDialogOpen(true)} />
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <AutoBillingCard
              key={plan.id}
              plan={plan}
              onToggleStatus={togglePlanStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AutoBillingManager;
