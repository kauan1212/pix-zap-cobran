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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ReceiptUpload from '@/components/ReceiptUpload';

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
  receipt_url?: string;
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
  const [selectedClientId, setSelectedClientId] = useState<string>('');

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
      setBillings((data as any[])?.map(item => ({
        ...item,
        status: item.status as 'pending' | 'paid' | 'overdue' | 'cancelled'
      })) || []);
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

  // Agrupar billings por cliente
  const billingsByClient = billings.reduce((acc, billing) => {
    const clientName = billing.clients?.name || 'Cliente desconhecido';
    if (!acc[clientName]) acc[clientName] = [];
    acc[clientName].push(billing);
    return acc;
  }, {} as Record<string, Billing[]>);

  // Filtrar cobranças do cliente selecionado
  const filteredBillings = selectedClientId
    ? billings.filter(b => b.client_id === selectedClientId)
    : [];
  const pendingBillings = filteredBillings.filter(b => b.status === 'pending' || b.status === 'overdue');
  const paidBillings = filteredBillings.filter(b => b.status === 'paid');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cobranças</h2>
          <p className="text-gray-600">Gerencie suas cobranças e pagamentos</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="w-4 h-4 mr-2" />
                Nova Cobrança
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
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

      {selectedClientId === '' ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecione um cliente</h3>
            <p className="text-gray-600 mb-6">Escolha um cliente para visualizar as cobranças.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="pendentes" className="w-full mt-8">
          <TabsList className="mb-4">
            <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
            <TabsTrigger value="pagas">Pagas</TabsTrigger>
          </TabsList>
          <TabsContent value="pendentes">
            <div>
              <h3 className="text-lg font-bold text-yellow-700 mb-2">Pendentes</h3>
              {pendingBillings.length === 0 ? (
                <Card><CardContent className="text-center py-8 text-gray-500">Nenhuma cobrança pendente</CardContent></Card>
              ) : (
                <div className="space-y-4">
                  {pendingBillings.map((billing) => (
                    <Card key={billing.id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{billing.description}</CardTitle>
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
                              onClick={() => updateBillingStatus(billing.id, 'paid')}
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
          </TabsContent>
          <TabsContent value="pagas">
            <div>
              <h3 className="text-lg font-bold text-green-700 mb-2">Pagas</h3>
              {paidBillings.length === 0 ? (
                <Card><CardContent className="text-center py-8 text-gray-500">Nenhuma cobrança paga</CardContent></Card>
              ) : (
                <div className="space-y-4">
                  {paidBillings.map((billing) => (
                    <Card key={billing.id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{billing.description}</CardTitle>
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
                          {billing.status === 'paid' && billing.payment_date && (
                            <Badge variant="outline" className="text-green-600">
                              Pago em {new Date(billing.payment_date).toLocaleDateString('pt-BR')}
                            </Badge>
                          )}
                        </div>
                        {billing.receipt_url ? (
                          <div className="mt-2">
                            <a href={billing.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                              Ver comprovante enviado
                            </a>
                          </div>
                        ) : (
                          <ReceiptUpload billingId={billing.id} onUploaded={url => {
                            setBillings(prev => prev.map(b => b.id === billing.id ? { ...b, receipt_url: url } : b));
                          }} />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default BillingManager;
