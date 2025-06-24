
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PlusCircle, Calendar, DollarSign, Trash2, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AutoBillingPlan {
  id: string;
  client_id: string;
  name: string;
  amount: number;
  description: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  clients?: Client;
}

interface AutoBillingManagerProps {
  clients: Client[];
  onDataChange: () => void;
}

const AutoBillingManager = ({ clients, onDataChange }: AutoBillingManagerProps) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<AutoBillingPlan[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    amount: '',
    description: '',
    frequency: 'monthly' as 'weekly' | 'biweekly' | 'monthly',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (user) {
      loadPlans();
    }
  }, [user]);

  const loadPlans = async () => {
    if (!user) return;

    try {
      // Using type assertion since the table is new and types aren't regenerated yet
      const { data, error } = await (supabase as any)
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
        setPlans(data || []);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const generateBillingsForPlan = (plan: AutoBillingPlan) => {
    const billings = [];
    const startDate = new Date(plan.start_date);
    const endDate = new Date(plan.end_date);
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      billings.push({
        user_id: user?.id,
        client_id: plan.client_id,
        amount: plan.amount,
        description: plan.description,
        due_date: currentDate.toISOString().split('T')[0],
        auto_billing_plan_id: plan.id,
      });

      // Calcular próxima data baseada na frequência
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validar datas
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

    try {
      const { data: planData, error: planError } = await (supabase as any)
        .from('auto_billing_plans')
        .insert([
          {
            user_id: user.id,
            client_id: formData.client_id,
            name: formData.name,
            amount: parseFloat(formData.amount),
            description: formData.description,
            frequency: formData.frequency,
            start_date: formData.start_date,
            end_date: formData.end_date,
          }
        ])
        .select()
        .single();

      if (planError) {
        toast({
          title: "Erro ao criar plano",
          description: planError.message,
          variant: "destructive",
        });
        return;
      }

      // Gerar todas as cobranças baseadas no plano
      const billings = generateBillingsForPlan({
        ...planData,
        frequency: formData.frequency
      });

      const { error: billingsError } = await supabase
        .from('billings')
        .insert(billings);

      if (billingsError) {
        // Se falhou ao criar cobranças, remove o plano
        await (supabase as any)
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

      // Enviar notificação para o cliente
      await sendNotificationToClient(formData.client_id, billings.length);

      const selectedClient = clients.find(c => c.id === formData.client_id);
      toast({
        title: "Plano criado com sucesso!",
        description: `${billings.length} cobranças foram geradas para ${selectedClient?.name}.`,
      });

      resetForm();
      setIsDialogOpen(false);
      loadPlans();
      onDataChange();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao criar o plano.",
        variant: "destructive",
      });
    }
  };

  const sendNotificationToClient = async (clientId: string, billingCount: number) => {
    try {
      // Buscar token do cliente
      const { data: tokenData } = await supabase
        .from('client_access_tokens')
        .select('token')
        .eq('client_id', clientId)
        .single();

      if (tokenData?.token) {
        // Simular notificação push (em produção, usar um serviço como Firebase)
        console.log(`Notificação enviada para cliente: ${billingCount} novas cobranças disponíveis`);
        
        // Aqui você pode integrar com um serviço de push notifications real
        // Por exemplo: Firebase Cloud Messaging, OneSignal, etc.
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      name: '',
      amount: '',
      description: '',
      frequency: 'monthly',
      start_date: '',
      end_date: '',
    });
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await (supabase as any)
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
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      // Deletar cobranças relacionadas primeiro
      await supabase
        .from('billings')
        .delete()
        .eq('auto_billing_plan_id', planId)
        .eq('status', 'pending');

      const { error } = await (supabase as any)
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
        onDataChange();
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Semanal';
      case 'biweekly': return 'Quinzenal';
      case 'monthly': return 'Mensal';
      default: return frequency;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cobranças Automáticas</h2>
          <p className="text-gray-600">Crie planos que geram cobranças automaticamente em períodos definidos</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Novo Plano Automático
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Plano de Cobrança Automática</DialogTitle>
              <DialogDescription>
                Configure um plano que gerará cobranças automaticamente no período definido
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="client">Cliente *</Label>
                <Select 
                  value={formData.client_id} 
                  onValueChange={(value) => setFormData({...formData, client_id: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Aluguel Apartamento 101"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Valor por Cobrança (R$) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0,00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="frequency">Frequência *</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value: 'weekly' | 'biweekly' | 'monthly') => setFormData({...formData, frequency: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Data Inicial *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="end_date">Data Final *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição da Cobrança *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrição que aparecerá em todas as cobranças"
                  required
                  maxLength={250}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/250 caracteres
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Criar Plano e Gerar Cobranças
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum plano automático criado</h3>
            <p className="text-gray-600 mb-6">Comece criando seu primeiro plano de cobrança automática</p>
            <Button 
              onClick={() => setIsDialogOpen(true)} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Criar primeiro plano
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1">
                      {plan.clients?.name} • {plan.description}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      R$ {plan.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{getFrequencyText(plan.frequency)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(plan.start_date).toLocaleDateString('pt-BR')} - {new Date(plan.end_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={plan.is_active}
                        onCheckedChange={(checked) => togglePlanStatus(plan.id, checked)}
                      />
                      <span className="text-sm">{plan.is_active ? 'Ativo' : 'Inativo'}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePlan(plan.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutoBillingManager;
