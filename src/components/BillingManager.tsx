
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PlusCircle, FileText, Calendar, DollarSign, MessageSquare, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Billing {
  id: string;
  client_id: string;
  amount: number;
  description: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  penalty?: number;
  interest?: number;
  payment_date?: string;
  created_at: string;
  clients?: Client;
}

interface BillingManagerProps {
  clients: Client[];
  onDataChange: () => void;
}

const BillingManager = ({ clients, onDataChange }: BillingManagerProps) => {
  const { user } = useAuth();
  const [billings, setBillings] = useState<Billing[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    amount: '',
    description: '',
    due_date: '',
    penalty: '',
    interest: '',
  });

  const PIX_KEY = '15991653601';

  useEffect(() => {
    if (user) {
      loadBillings();
    }
  }, [user]);

  const loadBillings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('billings')
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
        title: "Erro ao carregar cobranças",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setBillings(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const { data, error } = await supabase
      .from('billings')
      .insert([
        {
          user_id: user.id,
          client_id: formData.client_id,
          amount: parseFloat(formData.amount),
          description: formData.description,
          due_date: formData.due_date,
          penalty: formData.penalty ? parseFloat(formData.penalty) : null,
          interest: formData.interest ? parseFloat(formData.interest) : null,
        }
      ])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao criar cobrança",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const selectedClient = clients.find(c => c.id === formData.client_id);
      toast({
        title: "Cobrança criada!",
        description: `Cobrança de R$ ${parseFloat(formData.amount).toFixed(2)} criada para ${selectedClient?.name}.`,
      });
      resetForm();
      setIsDialogOpen(false);
      loadBillings();
      onDataChange();
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      amount: '',
      description: '',
      due_date: '',
      penalty: '',
      interest: '',
    });
  };

  const updateBillingStatus = async (billingId: string, status: Billing['status']) => {
    const updateData: any = { status };
    
    if (status === 'paid') {
      updateData.payment_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('billings')
      .update(updateData)
      .eq('id', billingId);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const statusText = {
        paid: 'paga',
        pending: 'pendente',
        overdue: 'vencida',
        cancelled: 'cancelada'
      };
      
      toast({
        title: "Status atualizado",
        description: `Cobrança marcada como ${statusText[status]}.`,
      });
      loadBillings();
      onDataChange();
    }
  };

  const generateWhatsAppMessage = (billing: Billing) => {
    const client = billing.clients;
    if (!client) return '';

    const dueDate = new Date(billing.due_date).toLocaleDateString('pt-BR');
    const amount = billing.amount.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });

    let message = `Olá, ${client.name}! 

Você tem uma nova cobrança:
💰 Valor: ${amount}
📅 Vencimento: ${dueDate}
📝 Descrição: ${billing.description}

💳 Para pagar via PIX, use a chave:
${PIX_KEY}

Após o pagamento, envie o comprovante para confirmarmos.

Obrigado!`;

    if (billing.penalty || billing.interest) {
      message += `\n\n⚠️ Em caso de atraso:`;
      if (billing.penalty) {
        message += `\n• Multa: R$ ${billing.penalty.toFixed(2)}`;
      }
      if (billing.interest) {
        message += `\n• Juros: ${billing.interest}% ao dia`;
      }
    }

    return message;
  };

  const copyWhatsAppMessage = (billing: Billing) => {
    const message = generateWhatsAppMessage(billing);
    navigator.clipboard.writeText(message);
    toast({
      title: "Mensagem copiada!",
      description: "Mensagem copiada para a área de transferência.",
    });
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast({
      title: "Chave PIX copiada!",
      description: `Chave PIX ${PIX_KEY} copiada para área de transferência.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paga';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Vencida';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cobranças</h2>
          <p className="text-gray-600">Gerencie suas cobranças e pagamentos</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Nova Cobrança
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nova Cobrança</DialogTitle>
              <DialogDescription>
                Crie uma nova cobrança para seus clientes
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
                <Label htmlFor="due_date">Data de Vencimento *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
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
                  <Label htmlFor="interest">Juros (% ao dia)</Label>
                  <Input
                    id="interest"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.interest}
                    onChange={(e) => setFormData({...formData, interest: e.target.value})}
                    placeholder="0,00"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Criar Cobrança
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* PIX Key Display */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Chave PIX do Sistema</h3>
              <p className="text-blue-700 font-mono text-lg">{PIX_KEY}</p>
            </div>
            <Button onClick={copyPixKey} variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Copiar Chave
            </Button>
          </div>
        </CardContent>
      </Card>

      {billings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma cobrança criada</h3>
            <p className="text-gray-600 mb-6">Comece criando sua primeira cobrança</p>
            <Button 
              onClick={() => setIsDialogOpen(true)} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Criar primeira cobrança
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {billings.map((billing) => (
            <Card key={billing.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{billing.clients?.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1">
                      {billing.description}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      R$ {billing.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <Badge className={`text-xs ${getStatusColor(billing.status)}`}>
                      {getStatusText(billing.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Vencimento: {new Date(billing.due_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {billing.penalty && (
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>Multa: R$ {billing.penalty.toFixed(2)}</span>
                      </div>
                    )}
                    {billing.interest && (
                      <span>Juros: {billing.interest}% ao dia</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyWhatsAppMessage(billing)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Copiar Mensagem WhatsApp
                  </Button>
                  
                  {billing.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateBil lingStatus(billing.id, 'paid')}
                      className="text-green-600 hover:text-green-700"
                    >
                      Marcar como Paga
                    </Button>
                  )}
                  
                  {billing.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateBillingStatus(billing.id, 'cancelled')}
                      className="text-red-600 hover:text-red-700"
                    >
                      Cancelar
                    </Button>
                  )}

                  {billing.status === 'paid' && billing.payment_date && (
                    <Badge variant="outline" className="text-green-600">
                      Pago em {new Date(billing.payment_date).toLocaleDateString('pt-BR')}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BillingManager;
