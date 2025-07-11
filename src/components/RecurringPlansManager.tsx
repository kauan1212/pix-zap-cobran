
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
import { PlusCircle, Repeat, Calendar, DollarSign, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface RecurringPlan {
  id: string;
  client_id: string;
  name: string;
  amount: number;
  description: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  penalty?: number;
  interest?: number;
  is_active: boolean;
  next_billing_date: string;
  created_at: string;
  clients?: Client;
}

interface RecurringPlansManagerProps {
  clients: Client[];
  onDataChange: () => void;
}

const RecurringPlansManager = ({ clients, onDataChange }: RecurringPlansManagerProps) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<RecurringPlan[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    amount: '',
    description: '',
    frequency: 'monthly' as 'weekly' | 'biweekly' | 'monthly',
    penalty: '',
    interest: '1',
    next_billing_date: '',
  });

  useEffect(() => {
    if (user) {
      loadPlans();
    }
  }, [user]);

  const loadPlans = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('recurring_plans')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar planos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Fix the type conversion
      const typedPlans: RecurringPlan[] = (data || []).map(item => ({
        ...item,
        frequency: item.frequency as 'weekly' | 'biweekly' | 'monthly'
      }));
      setPlans(typedPlans);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const { data, error } = await supabase
      .from('recurring_plans')
      .insert([
        {
          user_id: user.id,
          client_id: formData.client_id,
          name: formData.name,
          amount: parseFloat(formData.amount),
          description: formData.description,
          frequency: formData.frequency,
          penalty: formData.penalty ? parseFloat(formData.penalty) : null,
          interest: formData.interest ? parseFloat(formData.interest) : null,
          next_billing_date: formData.next_billing_date,
        }
      ])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao criar plano",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const selectedClient = clients.find(c => c.id === formData.client_id);
      toast({
        title: "Plano criado!",
        description: `Plano ${formData.name} criado para ${selectedClient?.name}.`,
      });
      resetForm();
      setIsDialogOpen(false);
      loadPlans();
      onDataChange();
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      name: '',
      amount: '',
      description: '',
      frequency: 'monthly',
      penalty: '',
      interest: '1',
      next_billing_date: '',
    });
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('recurring_plans')
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
  };

  const deletePlan = async (planId: string) => {
    const { error } = await supabase
      .from('recurring_plans')
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
        description: "Plano removido com sucesso.",
      });
      loadPlans();
      onDataChange();
    }
  };

  const generateBilling = async (plan: RecurringPlan) => {
    if (!user) return;

    const { error } = await supabase
      .from('billings')
      .insert([
        {
          user_id: user.id,
          client_id: plan.client_id,
          amount: plan.amount,
          description: plan.description,
          due_date: plan.next_billing_date,
          penalty: plan.penalty,
          interest: plan.interest,
          recurring_plan_id: plan.id,
        }
      ]);

    if (error) {
      toast({
        title: "Erro ao gerar cobrança",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Calculate next billing date
    const currentDate = new Date(plan.next_billing_date);
    let nextDate = new Date(currentDate);

    switch (plan.frequency) {
      case 'weekly':
        nextDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(currentDate.getMonth() + 1);
        break;
    }

    // Update next billing date
    await supabase
      .from('recurring_plans')
      .update({ next_billing_date: nextDate.toISOString().split('T')[0] })
      .eq('id', plan.id);

    toast({
      title: "Cobrança gerada!",
      description: `Nova cobrança criada para ${plan.clients?.name}.`,
    });
    loadPlans();
    onDataChange();
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
          <h2 className="text-2xl font-bold text-gray-900">Planos de Recorrência</h2>
          <p className="text-gray-600">Automatize a geração de cobranças recorrentes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Plano de Recorrência</DialogTitle>
              <DialogDescription>
                Crie um plano para gerar cobranças automaticamente
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
                  placeholder="Ex: Aluguel Mensal"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Valor (R$) *</Label>
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
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrição do serviço ou produto"
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
              
              <div>
                <Label htmlFor="next_billing_date">Próxima Cobrança *</Label>
                <Input
                  id="next_billing_date"
                  type="date"
                  value={formData.next_billing_date}
                  onChange={(e) => setFormData({...formData, next_billing_date: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="penalty">Multa (R$)</Label>
                  <Input
                    id="penalty"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.penalty}
                    onChange={(e) => setFormData({...formData, penalty: e.target.value})}
                    placeholder="0,00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="interest">Juros (% ao mês)</Label>
                  <Input
                    id="interest"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.interest}
                    onChange={(e) => setFormData({...formData, interest: e.target.value})}
                    placeholder="1.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Máximo legal: 1% ao mês</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Criar Plano
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Repeat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum plano criado</h3>
            <p className="text-gray-600 mb-6">Comece criando seu primeiro plano de recorrência</p>
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
                      <Repeat className="w-4 h-4" />
                      <span>{getFrequencyText(plan.frequency)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Próxima: {new Date(plan.next_billing_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {plan.penalty && (
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>Multa: R$ {plan.penalty.toFixed(2)}</span>
                      </div>
                    )}
                    {plan.interest && (
                      <div className="flex items-center space-x-1">
                        <span>Multa 10% após o dia de vencimento</span>
                      </div>
                    )}
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
                    {plan.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateBilling(plan)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Gerar Cobrança Agora
                      </Button>
                    )}
                    
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

export default RecurringPlansManager;
