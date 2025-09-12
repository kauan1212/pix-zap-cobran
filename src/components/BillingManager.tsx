import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Calendar, DollarSign, MessageSquare, Copy, AlertTriangle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ReceiptUpload from '@/components/ReceiptUpload';
import { Switch } from '@/components/ui/switch';
import { formatDateSafely } from '@/utils/dateUtils';

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


  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [extraServices, setExtraServices] = useState<any[]>([]);
  const [userPixKey, setUserPixKey] = useState<string>('');

  

  useEffect(() => {
    if (user) {
      loadBillings();
      loadUserPixKey();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClientId) {
      loadExtraServices();
    } else {
      setExtraServices([]);
    }
  }, [selectedClientId]);

  const loadUserPixKey = async () => {
    if (!user) return;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('pix_key')
        .eq('id', user.id)
        .single();

      if (!error && profileData?.pix_key) {
        setUserPixKey(profileData.pix_key);
      } else {
        // Fallback para email se não houver chave PIX configurada
        setUserPixKey(user.email || '');
      }
    } catch (error) {
      console.error('Error loading PIX key:', error);
      setUserPixKey(user.email || '');
    }
  };

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
      .eq('user_id', user.id)
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

  const loadExtraServices = async () => {
    if (!selectedClientId) {
      setExtraServices([]);
      return;
    }
    const { data, error } = await supabase
      .from('extra_services')
      .select('*')
      .eq('client_id', selectedClientId)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao carregar serviços extras', description: error.message, variant: 'destructive' });
      setExtraServices([]);
    } else {
      setExtraServices(data || []);
    }
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

    const dueDate = formatDateSafely(billing.due_date);
    const amount = billing.amount.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });

    // Buscar serviços extras pendentes do cliente
    const clientExtraServices = extraServices.filter(service => 
      service.client_id === billing.client_id && service.status === 'pendente'
    );
    
    const extraServicesTotal = clientExtraServices.reduce((total, service) => 
      total + Number(service.amount), 0
    );

    let message = `Olá, ${client.name}! 

Sou a *Valéria*, sua assistente virtual do WhatsApp Business. 

Você tem uma nova cobrança:
💰 Valor: ${amount}
📅 Vencimento: ${dueDate}
📝 Descrição: ${billing.description}`;

    // Adicionar serviços extras se houver
    if (clientExtraServices.length > 0) {
      message += `\n\n📋 *Serviços extras pendentes:*`;
      clientExtraServices.forEach(service => {
        const serviceAmount = Number(service.amount).toLocaleString('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        });
        message += `\n• ${service.description}: ${serviceAmount}`;
      });
      
      const totalWithExtras = billing.amount + extraServicesTotal;
      const totalFormatted = totalWithExtras.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      });
      message += `\n\n💰 *Total geral (cobrança + serviços):* ${totalFormatted}`;
    }

    message += `\n\n💳 Para pagar via PIX, use a chave:
${userPixKey}

Após o pagamento, envie o comprovante para confirmarmos.

Atenciosamente,
*Valéria* - Assistente Virtual 🤖`;

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

  const generateOverdueMessage = (billing: Billing) => {
    const client = billing.clients;
    if (!client) return '';

    const dueDate = formatDateSafely(billing.due_date);
    
    // Calcular dias de atraso
    const today = new Date();
    const dueDateObj = new Date(billing.due_date);
    const daysOverdue = Math.floor((today.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24));

    // Calcular valor com multa e juros
    let finalAmount = billing.amount;
    
    // Aplicar multa de 10% no primeiro dia de atraso
    if (daysOverdue > 0) {
      finalAmount = billing.amount * 1.1; // 10% de multa
      
      // Aplicar juros de 0,04% ao dia sobre o valor já com multa
      if (daysOverdue > 0) {
        const dailyInterestRate = 0.0004; // 0,04% ao dia
        const interestMultiplier = 1 + (dailyInterestRate * daysOverdue);
        finalAmount = finalAmount * interestMultiplier;
      }
    }

    const formattedAmount = finalAmount.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });

    const originalAmount = billing.amount.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });

    // Buscar serviços extras pendentes do cliente
    const clientExtraServices = extraServices.filter(service => 
      service.client_id === billing.client_id && service.status === 'pendente'
    );
    
    const extraServicesTotal = clientExtraServices.reduce((total, service) => 
      total + Number(service.amount), 0
    );

    let message = `Prezado(a) ${client.name},

Sou a *Valéria*, sua assistente virtual do WhatsApp Business.

Informamos que a parcela referente a ${billing.description} está em atraso desde ${dueDate} (${daysOverdue} dia${daysOverdue > 1 ? 's' : ''} de atraso).

📋 Detalhes da cobrança:
• Valor original: ${originalAmount}
• Valor atualizado: ${formattedAmount}
• Vencimento: ${dueDate}
• Descrição: ${billing.description}`;

    // Adicionar serviços extras se houver
    if (clientExtraServices.length > 0) {
      message += `\n\n📋 *Serviços extras pendentes:*`;
      clientExtraServices.forEach(service => {
        const serviceAmount = Number(service.amount).toLocaleString('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        });
        message += `\n• ${service.description}: ${serviceAmount}`;
      });
      
      const totalWithExtras = finalAmount + extraServicesTotal;
      const totalFormatted = totalWithExtras.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      });
      message += `\n\n💰 *Total geral (cobrança atualizada + serviços):* ${totalFormatted}`;
    }

    message += `\n\n⚠️ Para evitar mais acréscimos, solicitamos a regularização do pagamento o quanto antes.

💳 Pagamento via PIX:
Chave: ${userPixKey}

Após o pagamento, envie o comprovante para confirmação.

Agradecemos a atenção e aguardamos o retorno.

Atenciosamente,
*Valéria* - Assistente Virtual 🤖`;

    // Adicionar detalhamento dos acréscimos
    if (daysOverdue > 0) {
      message += `\n\n📌 Composição do valor atualizado:`;
      message += `\n• Valor original: ${originalAmount}`;
      message += `\n• Multa (10%): ${(billing.amount * 0.1).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
      if (daysOverdue > 0) {
        const interestAmount = (billing.amount * 1.1 * 0.0004 * daysOverdue);
        message += `\n• Juros (0,04% ao dia por ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''}): ${interestAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
      }
      message += `\n• Total: ${formattedAmount}`;
    }

    return message;
  };

  const copyOverdueMessage = (billing: Billing) => {
    const message = generateOverdueMessage(billing);
    navigator.clipboard.writeText(message);
    toast({
      title: "Mensagem de atraso copiada!",
      description: "Mensagem copiada para a área de transferência.",
    });
  };

  const generateDueDateMessage = (billing: Billing) => {
    const client = billing.clients;
    if (!client) return '';

    const dueDate = formatDateSafely(billing.due_date);
    const amount = billing.amount.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });

    // Buscar serviços extras pendentes do cliente
    const clientExtraServices = extraServices.filter(service => 
      service.client_id === billing.client_id && service.status === 'pendente'
    );
    
    const extraServicesTotal = clientExtraServices.reduce((total, service) => 
      total + Number(service.amount), 0
    );

    let message = `Prezado(a) ${client.name},

Sou a *Valéria*, sua assistente virtual do WhatsApp Business.

Informamos que a parcela referente a ${billing.description} vence hoje (${dueDate}).

📋 Detalhes da cobrança:
• Valor: ${amount}
• Vencimento: ${dueDate}
• Descrição: ${billing.description}`;

    // Adicionar serviços extras se houver
    if (clientExtraServices.length > 0) {
      message += `\n\n📋 *Serviços extras pendentes:*`;
      clientExtraServices.forEach(service => {
        const serviceAmount = Number(service.amount).toLocaleString('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        });
        message += `\n• ${service.description}: ${serviceAmount}`;
      });
      
      const totalWithExtras = billing.amount + extraServicesTotal;
      const totalFormatted = totalWithExtras.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      });
      message += `\n\n💰 *Total geral (cobrança + serviços):* ${totalFormatted}`;
    }

    message += `\n\n💳 Para realizar o pagamento via PIX, utilize a chave:
${userPixKey}

⚠️ Importante: Para evitar acréscimos de multas e juros, recomendamos o pagamento até o final do dia.

Após o pagamento, envie o comprovante para confirmação.

Agradecemos a atenção.

Atenciosamente,
*Valéria* - Assistente Virtual 🤖`;

    // Adicionar informações sobre multas se aplicável
    if (billing.penalty || billing.interest) {
      message += `\n\n📌 Observações importantes:`;
      if (billing.penalty) {
        message += `\n• Multa por atraso: R$ ${billing.penalty.toFixed(2)}`;
      }
      if (billing.interest) {
        message += `\n• Juros de mora: ${billing.interest}% ao dia`;
      }
    }

    return message;
  };

  const copyDueDateMessage = (billing: Billing) => {
    const message = generateDueDateMessage(billing);
    navigator.clipboard.writeText(message);
    toast({
      title: "Mensagem de vencimento copiada!",
      description: "Mensagem copiada para a área de transferência.",
    });
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(userPixKey);
    toast({
      title: "Chave PIX copiada!",
      description: `Chave PIX ${userPixKey} copiada para área de transferência.`,
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
  // Ordenação das listas por data de vencimento
  const pendingBillings = filteredBillings.filter(b => b.status === 'pending' || b.status === 'overdue').sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  const paidBillings = filteredBillings.filter(b => b.status === 'paid').sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  // NOVA função: mensagem de aviso de possível atraso (antes do vencimento ou no dia)
  const generatePreDueMessage = (billing: Billing) => {
    const client = billing.clients;
    if (!client) return '';
    const dueDate = formatDateSafely(billing.due_date);
    const amount = billing.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    // Buscar serviços extras pendentes do cliente
    const clientExtraServices = extraServices.filter(service => 
      service.client_id === billing.client_id && service.status === 'pendente'
    );
    
    const extraServicesTotal = clientExtraServices.reduce((total, service) => 
      total + Number(service.amount), 0
    );

    let message = `Prezado(a) ${client.name},

Sou a *Valéria*, sua assistente virtual do WhatsApp Business.

Lembramos que a parcela referente a ${billing.description} vence em breve (${dueDate}).

📋 Detalhes da cobrança:
• Valor: ${amount}
• Vencimento: ${dueDate}
• Descrição: ${billing.description}`;

    // Adicionar serviços extras se houver
    if (clientExtraServices.length > 0) {
      message += `\n\n📋 *Serviços extras pendentes:*`;
      clientExtraServices.forEach(service => {
        const serviceAmount = Number(service.amount).toLocaleString('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        });
        message += `\n• ${service.description}: ${serviceAmount}`;
      });
      
      const totalWithExtras = billing.amount + extraServicesTotal;
      const totalFormatted = totalWithExtras.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      });
      message += `\n\n💰 *Total geral (cobrança + serviços):* ${totalFormatted}`;
    }

    message += `\n\n💳 Para realizar o pagamento via PIX, utilize a chave:
${userPixKey}

Evite juros e multas realizando o pagamento até a data de vencimento.

Após o pagamento, envie o comprovante para confirmação.

Agradecemos a atenção.

Atenciosamente,
*Valéria* - Assistente Virtual 🤖`;

    return message;
  };
  const copyPreDueMessage = (billing: Billing) => {
    const message = generatePreDueMessage(billing);
    navigator.clipboard.writeText(message);
    toast({
      title: "Mensagem de lembrete copiada!",
      description: "Mensagem copiada para a área de transferência.",
    });
  };

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
        </div>
      </div>

      {/* PIX Key Display */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Chave PIX do Sistema</h3>
              <p className="text-blue-700 font-mono text-lg">{userPixKey}</p>
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
            <TabsTrigger value="todas">Todas as Cobranças</TabsTrigger>
            <TabsTrigger value="extras">Serviços Extras</TabsTrigger>
          </TabsList>
          <TabsContent value="pendentes">
            <div>
              <h3 className="text-lg font-bold text-yellow-700 mb-2">Pendentes</h3>
              {pendingBillings.length === 0 ? (
                <Card><CardContent className="text-center py-8 text-gray-500">Nenhuma cobrança pendente</CardContent></Card>
              ) : (
                <>
                  {selectedClientId !== '' && pendingBillings.length > 0 && (
                    <div className="flex items-center mb-4 space-x-2">
                      <Switch
                        checked={pendingBillings.every(b => b.interest === 10)}
                        onCheckedChange={async (checked) => {
                          // Atualiza todas as cobranças pendentes do cliente
                          const { error } = await supabase
                            .from('billings')
                            .update({ interest: checked ? 10 : null })
                            .in('id', pendingBillings.map(b => b.id));
                          if (!error) {
                            setBillings(prev => prev.map(b =>
                              b.client_id === selectedClientId && (b.status === 'pending' || b.status === 'overdue')
                                ? { ...b, interest: checked ? 10 : null }
                                : b
                            ));
                          } else {
                            toast({ title: 'Erro ao atualizar juros em massa', description: error.message, variant: 'destructive' });
                          }
                        }}
                      />
                      <span className="text-xs">Multa 10% após o dia de vencimento (todas as cobranças)</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    {pendingBillings.map((billing) => {
                      // Verifica se está vencida
                      const isOverdue = new Date(billing.due_date) < new Date(new Date().toDateString());
                      // Valor com juros se aplicável
                      const showInterest = billing.interest === 10 && isOverdue;
                      const amountWithInterest = showInterest ? billing.amount * 1.1 : billing.amount;
                      
                      // Função para deletar cobrança
                      const handleDeleteBilling = async () => {
                        if (window.confirm('Tem certeza que deseja deletar esta cobrança?')) {
                          const { error } = await supabase.from('billings').delete().eq('id', billing.id);
                          if (error) {
                            toast({ title: "Erro ao deletar cobrança", description: error.message, variant: "destructive" });
                          } else {
                            toast({ title: "Cobrança deletada!" });
                            loadBillings();
                            onDataChange();
                          }
                        }
                      };

                      // Função para alternar juros
                      const handleToggleInterest = async (checked: boolean) => {
                        // Atualiza no banco e no estado local
                        const { error } = await supabase
                          .from('billings')
                          .update({ interest: checked ? 10 : null })
                          .eq('id', billing.id);
                        if (!error) {
                          setBillings(prev => prev.map(b => b.id === billing.id ? { ...b, interest: checked ? 10 : null } : b));
                        } else {
                          toast({ title: 'Erro ao atualizar juros', description: error.message, variant: 'destructive' });
                        }
                      };

                       return (
                         <Card key={billing.id} className="hover:shadow-lg transition-shadow duration-200 relative">
                           <button
                             onClick={handleDeleteBilling}
                             className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors z-10"
                             title="Deletar cobrança"
                           >
                             ✕
                           </button>
                           <CardHeader>
                             <div className="flex justify-between items-start pr-8">
                               <div>
                                 <CardTitle className="text-lg">{billing.description}</CardTitle>
                                 <CardDescription className="text-sm text-gray-600 mt-1">
                                   {billing.description}
                                 </CardDescription>
                               </div>
                               <div className="text-right">
                                 <p className="text-xl font-bold text-gray-900">
                                   R$ {amountWithInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                   {showInterest && <span className="text-xs text-red-600 ml-1">(com juros)</span>}
                                 </p>
                                 <Badge className={`text-xs ${getStatusColor(billing.status)}`}>{getStatusText(billing.status)}</Badge>
                               </div>
                             </div>
                           </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                   <span>Vencimento: {formatDateSafely(billing.due_date)}</span>
                                </div>
                                {billing.penalty && (
                                  <div className="flex items-center space-x-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span>Multa: R$ {billing.penalty.toFixed(2)}</span>
                                  </div>
                                )}
                                {billing.interest && (
                                  <span>Juros: {billing.interest}%</span>
                                )}
                              </div>
                              {/* Switch de juros */}
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={billing.interest === 10}
                                  onCheckedChange={handleToggleInterest}
                                  disabled={billing.status !== 'pending'}
                                />
                                <span className="text-xs">Multa 10% após o dia de vencimento</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {/* Botão de aviso de possível atraso (antes do vencimento ou no dia) */}
                              {new Date(billing.due_date) >= new Date(new Date().toDateString()) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyPreDueMessage(billing)}
                                  className="text-orange-600 hover:text-orange-700 border-orange-200"
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  Copiar Aviso de Vencimento
                                </Button>
                              )}
                              {/* Botão de aviso de atraso (apenas para vencidas) */}
                              {new Date(billing.due_date) < new Date(new Date().toDateString()) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyOverdueMessage(billing)}
                                  className="text-red-600 hover:text-red-700 border-red-200"
                                >
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Copiar Aviso de Atraso
                                </Button>
                              )}
                              {/* Demais botões (pagar, cancelar, etc) */}
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
                      );
                    })}
                  </div>
                </>
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
                               <span>Vencimento: {formatDateSafely(billing.due_date)}</span>
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
                            <>
                              <Badge variant="outline" className="text-green-600">
                                Pago em {new Date(billing.payment_date).toLocaleDateString('pt-BR')}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-yellow-600 hover:text-yellow-700 ml-2"
                                onClick={() => updateBillingStatus(billing.id, 'pending')}
                              >
                                Desfazer pagamento
                              </Button>
                            </>
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
          <TabsContent value="todas">
            <div>
              <h3 className="text-lg font-bold text-blue-700 mb-2">Todas as Cobranças</h3>
              {billings.length === 0 ? (
                <Card><CardContent className="text-center py-8 text-gray-500">Nenhuma cobrança encontrada</CardContent></Card>
              ) : (
                <div className="space-y-4">
                  {billings
                    .filter(b => b.status === 'pending' || b.status === 'overdue')
                    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                    .map((billing) => {
                      // Verifica se está vencida
                      const isOverdue = new Date(billing.due_date) < new Date(new Date().toDateString());
                      // Valor com juros se aplicável
                      const showInterest = billing.interest === 10 && isOverdue;
                      const amountWithInterest = showInterest ? billing.amount * 1.1 : billing.amount;

                      return (
                        <Card key={billing.id} className={`hover:shadow-lg transition-shadow duration-200 ${isOverdue ? 'border-l-4 border-l-red-400' : ''}`}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{billing.description}</CardTitle>
                                <CardDescription className="text-sm text-gray-600 mt-1">
                                  Cliente: {billing.clients?.name || 'Cliente desconhecido'}
                                </CardDescription>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-gray-900">
                                  R$ {amountWithInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  {showInterest && <span className="text-xs text-red-600 ml-1">(com juros)</span>}
                                </p>
                                <Badge className={`text-xs ${getStatusColor(billing.status)}`}>
                                  {getStatusText(billing.status)}
                                  {isOverdue && <span className="ml-1">• Vencida</span>}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Vencimento: {formatDateSafely(billing.due_date)}</span>
                                </div>
                                {billing.penalty && (
                                  <div className="flex items-center space-x-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span>Multa: R$ {billing.penalty.toFixed(2)}</span>
                                  </div>
                                )}
                                {billing.interest && (
                                  <span>Juros: {billing.interest}%</span>
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
                              {isOverdue && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyOverdueMessage(billing)}
                                  className="text-red-600 hover:text-red-700 border-red-200"
                                >
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Copiar Mensagem de Atraso
                                </Button>
                              )}
                              {!isOverdue && new Date(billing.due_date).toDateString() === new Date().toDateString() && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyDueDateMessage(billing)}
                                  className="text-orange-600 hover:text-orange-700 border-orange-200"
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  Copiar Mensagem de Vencimento
                                </Button>
                              )}
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
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="extras">
            <div>
              <h3 className="text-lg font-bold text-blue-700 mb-2">Serviços Extras</h3>
              {/* Formulário para novo serviço extra */}
              <form
                className="space-y-4 mb-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!selectedClientId) {
                    toast({ title: "Selecione um cliente" });
                    return;
                  }
                  const description = (e.target as any).description.value;
                  const amount = parseFloat((e.target as any).amount.value);
                  if (!description || !amount) {
                    toast({ title: "Preencha todos os campos" });
                    return;
                  }
                  const { error } = await supabase.from('extra_services').insert({
                    client_id: selectedClientId,
                    description,
                    amount,
                  });
                  if (error) {
                    toast({ title: "Erro ao criar serviço extra", description: error.message, variant: "destructive" });
                  } else {
                    toast({ title: "Serviço extra criado!" });
                    (e.target as HTMLFormElement).reset();
                    loadExtraServices();
                  }
                }}
              >
                <div>
                  <Label htmlFor="description">Descrição do serviço</Label>
                  <Input id="description" name="description" required />
                </div>
                <div>
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" required />
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Cadastrar Serviço Extra</Button>
              </form>
              {/* Lista de serviços extras */}
              <div className="space-y-4">
                {extraServices.length === 0 ? (
                  <Card><CardContent className="text-center py-8 text-gray-500">Nenhum serviço extra cadastrado</CardContent></Card>
                ) : (
                  extraServices.map((service) => (
                    <Card key={service.id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{service.description}</CardTitle>
                            <CardDescription className="text-sm text-gray-600 mt-1">R$ {service.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</CardDescription>
                          </div>
                          <div className="text-right">
                            <Badge className={`text-xs ${service.status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{service.status === 'pago' ? 'Pago' : 'Pendente'}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          {service.status !== 'pago' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const { error } = await supabase.from('extra_services').update({ status: 'pago', paid_at: new Date().toISOString() }).eq('id', service.id);
                                if (error) {
                                  toast({ title: "Erro ao marcar como pago", description: error.message, variant: "destructive" });
                                } else {
                                  toast({ title: "Serviço extra marcado como pago!" });
                                  loadExtraServices();
                                }
                              }}
                              className="text-green-600 hover:text-green-700"
                            >
                              Marcar como Pago
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (window.confirm('Tem certeza que deseja deletar este serviço extra? Essa ação não pode ser desfeita.')) {
                                const { error } = await supabase.from('extra_services').delete().eq('id', service.id);
                                if (error) {
                                  toast({ title: "Erro ao deletar serviço extra", description: error.message, variant: "destructive" });
                                } else {
                                  toast({ title: "Serviço extra deletado!" });
                                  loadExtraServices();
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            Deletar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default BillingManager;
