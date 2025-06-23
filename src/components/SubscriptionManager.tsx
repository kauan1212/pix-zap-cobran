
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
import { PlusCircle, Calendar, DollarSign, Trash2, Clock, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Subscription {
  id: string;
  client_id: string;
  name: string;
  amount: number;
  description: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  clients?: Client;
}

interface SubscriptionManagerProps {
  clients: Client[];
  onDataChange: () => void;
}

const SubscriptionManager = ({ clients, onDataChange }: SubscriptionManagerProps) => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
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
      loadSubscriptions();
    }
  }, [user]);

  const loadSubscriptions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('subscriptions')
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
      console.error('Error loading subscriptions:', error);
    } else {
      const typedSubscriptions: Subscription[] = (data || []).map(item => ({
        ...item,
        frequency: item.frequency as 'weekly' | 'biweekly' | 'monthly'
      }));
      setSubscriptions(typedSubscriptions);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([
        {
          user_id: user.id,
          client_id: formData.client_id,
          name: formData.name,
          amount: parseFloat(formData.amount),
          description: formData.description,
          frequency: formData.frequency,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
        }
      ])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao criar assinatura",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const selectedClient = clients.find(c => c.id === formData.client_id);
      toast({
        title: "Assinatura criada!",
        description: `Assinatura ${formData.name} criada para ${selectedClient?.name}.`,
      });
      resetForm();
      setIsDialogOpen(false);
      loadSubscriptions();
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
      start_date: '',
      end_date: '',
    });
  };

  const toggleSubscriptionStatus = async (subscriptionId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('subscriptions')
      .update({ is_active: isActive })
      .eq('id', subscriptionId);

    if (error) {
      toast({
        title: "Erro ao atualizar assinatura",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Assinatura atualizada",
        description: `Assinatura ${isActive ? 'ativada' : 'desativada'} com sucesso.`,
      });
      loadSubscriptions();
    }
  };

  const deleteSubscription = async (subscriptionId: string) => {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId);

    if (error) {
      toast({
        title: "Erro ao excluir assinatura",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Assinatura excluída",
        description: "Assinatura removida com sucesso.",
      });
      loadSubscriptions();
      onDataChange();
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

  const isSubscriptionExpired = (endDate?: string) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sistema de Assinatura</h2>
          <p className="text-gray-600">Gerencie assinaturas e cobranças recorrentes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Nova Assinatura
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Assinatura</DialogTitle>
              <DialogDescription>
                Configure uma nova assinatura com cobrança recorrente
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
                <Label htmlFor="name">Nome da Assinatura *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Plano Premium Mensal"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Valor da Cobrança (R$) *</Label>
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
                <Label htmlFor="frequency">Período da Cobrança *</Label>
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
                  <Label htmlFor="end_date">Data Final</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    placeholder="Deixe vazio para sem fim"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição da Cobrança *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva os serviços incluídos na assinatura"
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
                  Criar Assinatura
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma assinatura criada</h3>
            <p className="text-gray-600 mb-6">Comece criando sua primeira assinatura</p>
            <Button 
              onClick={() => setIsDialogOpen(true)} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Criar primeira assinatura
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{subscription.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1">
                      {subscription.clients?.name} • {subscription.description}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      R$ {subscription.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={subscription.is_active ? "default" : "secondary"}>
                        {subscription.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                      {isSubscriptionExpired(subscription.end_date) && (
                        <Badge variant="destructive">Expirada</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{getFrequencyText(subscription.frequency)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Início: {new Date(subscription.start_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {subscription.end_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Fim: {new Date(subscription.end_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={subscription.is_active}
                        onCheckedChange={(checked) => toggleSubscriptionStatus(subscription.id, checked)}
                        disabled={isSubscriptionExpired(subscription.end_date)}
                      />
                      <span className="text-sm">{subscription.is_active ? 'Ativa' : 'Inativa'}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSubscription(subscription.id)}
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

export default SubscriptionManager;
