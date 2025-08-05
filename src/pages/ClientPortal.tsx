import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, DollarSign, Copy, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MotivationalPayments } from "../components/MotivationalPayments";
import { formatDateSafely } from '@/utils/dateUtils';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_id: string;
}

interface Billing {
  id: string;
  amount: number;
  description: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  penalty?: number;
  interest?: number;
  payment_date?: string;
  created_at: string;
  receipt_url?: string;
}

const ClientPortal = () => {
  const { token } = useParams<{ token: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pixKey, setPixKey] = useState<string>('');
  const [userWhatsapp, setUserWhatsapp] = useState<string>('');
  const [extraServices, setExtraServices] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      loadClientData();
    }
  }, [token]);

  useEffect(() => {
    if (client) {
      loadExtraServices();
      loadPixKey(); // Carrega a chave PIX após o cliente estar disponível
      loadUserWhatsapp(); // Carrega o WhatsApp do usuário
    }
  }, [client]);

  const loadPixKey = async () => {
    try {
      if (!client?.user_id) {
        console.error('Client user_id not available');
        setPixKey('15991653601');
        return;
      }

      // Buscar a chave PIX diretamente do usuário deste cliente
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('pix_key')
        .eq('id', client.user_id)
        .single();

      if (!profileError && profileData?.pix_key) {
        setPixKey(profileData.pix_key);
      } else {
        console.error('Error loading PIX key or PIX key not found:', profileError);
        setPixKey('15991653601');
      }
    } catch (error) {
      console.error('Error loading PIX key:', error);
      setPixKey('15991653601');
    }
  };

  const loadUserWhatsapp = async () => {
    try {
      if (!client?.user_id) {
        console.error('Client user_id not available');
        setUserWhatsapp('15991653601');
        return;
      }

      // Buscar o WhatsApp do usuário deste cliente
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('whatsapp')
        .eq('id', client.user_id)
        .single();

      if (!profileError && profileData?.whatsapp) {
        setUserWhatsapp(profileData.whatsapp);
      } else {
        console.error('Error loading WhatsApp or WhatsApp not found:', profileError);
        setUserWhatsapp('15991653601');
      }
    } catch (error) {
      console.error('Error loading WhatsApp:', error);
      setUserWhatsapp('15991653601');
    }
  };

  const loadClientData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading client data for token:', token);

      if (!token) {
        setError('Token não fornecido');
        return;
      }

      // Buscar o token e validar - SEM autenticação para permitir acesso público
      const { data: tokenData, error: tokenError } = await supabase
        .from('client_access_tokens')
        .select('client_id, expires_at')
        .eq('token', token)
        .maybeSingle();

      console.log('Token query result:', { tokenData, tokenError });

      if (tokenError) {
        console.error('Error fetching token:', tokenError);
        setError('Erro ao validar token de acesso');
        return;
      }

      if (!tokenData) {
        console.error('Token not found');
        setError('Link inválido ou não encontrado');
        return;
      }

      // Verificar se o token não expirou
      if (new Date(tokenData.expires_at) < new Date()) {
        console.log('Token expired');
        setError('Link expirado');
        return;
      }

      // Buscar dados do cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, name, email, phone, user_id')
        .eq('id', tokenData.client_id)
        .single();

      console.log('Client query result:', { clientData, clientError });

      if (clientError || !clientData) {
        console.error('Client not found:', clientError);
        setError('Cliente não encontrado');
        return;
      }

      setClient(clientData);

      // Carregar cobranças deste cliente
      const { data: billingsData, error: billingsError } = await supabase
        .from('billings')
        .select('*')
        .eq('client_id', tokenData.client_id)
        .order('created_at', { ascending: false });

      console.log('Billings query result:', { billingsData, billingsError });

      if (billingsError) {
        console.error('Error loading billings:', billingsError);
      } else {
        setBillings((billingsData || []).map(item => ({
          ...item,
          status: item.status as 'pending' | 'paid' | 'overdue' | 'cancelled'
        })));
      }

    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erro ao carregar dados do cliente');
    } finally {
      setLoading(false);
    }
  };

  const loadExtraServices = async () => {
    if (!client) return;
    const { data, error } = await supabase
      .from('extra_services')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });
    if (!error) setExtraServices(data || []);
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    toast({
      title: "Chave PIX copiada!",
      description: `Chave PIX ${pixKey} copiada para área de transferência.`,
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
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Vencido';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Calendar className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do cliente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500 mt-4">
              Verifique se o link está correto ou entre em contato com quem enviou o link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ordenação das listas por data de vencimento
  const pendingBillings = billings.filter(b => b.status === 'pending' || b.status === 'overdue').sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  const paidBillings = billings.filter(b => b.status === 'paid').sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  const totalPending = pendingBillings.reduce((sum, billing) => sum + billing.amount, 0);
  const totalPaid = paidBillings.reduce((sum, billing) => sum + billing.amount, 0);
  const totalExtraPaid = extraServices.filter(s => s.status === 'pago').reduce((sum, s) => sum + s.amount, 0);
  const totalExtraPending = extraServices.filter(s => s.status !== 'pago').reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">₿</span>
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Gestão de Planos
          </span>
        </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{client?.name}</p>
              <p className="text-xs text-gray-500">Portal do Cliente</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Olá, {client?.name}!
          </h1>
          <p className="text-gray-600">
            Aqui você pode visualizar seus planos e realizar pagamentos via PIX.
          </p>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 ${client?.email === 'adrielnata@gmail.com' ? 'md:grid-cols-1' : 'md:grid-cols-3'} gap-6 mb-8`}>
          {client?.email !== 'adrielnata@gmail.com' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Pendente</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500">
                  {pendingBillings.length} plano(s)
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Pago</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500">
                {paidBillings.length} plano(s) pagos
              </p>
            </CardContent>
          </Card>
        </div>
        {/* Novas caixas de totais de serviços extras */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Total Serviços Pago</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {totalExtraPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500">
                {extraServices.filter(s => s.status === 'pago').length} serviço(s) pago(s)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Total Serviços Pendente</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                R$ {totalExtraPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500">
                {extraServices.filter(s => s.status !== 'pago').length} serviço(s) pendente(s)
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pendentes" className="w-full mt-8">
          <TabsList className="mb-4">
            <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
            <TabsTrigger value="pagas">Pagas</TabsTrigger>
            <TabsTrigger value="extras">Serviços Extras</TabsTrigger>
          </TabsList>
          <TabsContent value="pendentes">
            {pendingBillings.length > 0 ? (
              <div className="space-y-4">
                {pendingBillings.map((billing, idx) => (
                  <Card key={billing.id} className="border-l-4 border-l-yellow-400">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{billing.description}</CardTitle>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Vencimento: {formatDateSafely(billing.due_date)}</span>
                            </div>
                            {billing.penalty && billing.penalty > 0 && (
                              <span className="text-red-600">Multa: R$ {billing.penalty.toFixed(2)}</span>
                            )}
                            {billing.interest && billing.interest > 0 && (
                              <span className="text-red-600">Multa 10% após o dia de vencimento</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            R$ {billing.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <Badge className={`text-xs ${getStatusColor(billing.status)}`}>
                            {getStatusIcon(billing.status)}
                            <span className="ml-1">{getStatusText(billing.status)}</span>
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Para pagar via PIX:</h4>
                        <p className="text-sm text-blue-800 mb-3">
                          1. Copie a chave PIX: <span className="font-mono font-bold break-all">{pixKey}</span>
                        </p>
                        <p className="text-sm text-blue-800 mb-3">
                          2. Abra o app do seu banco e faça o PIX
                        </p>
                        <p className="text-sm text-blue-800 mb-4">
                          3. Envie o comprovante para confirmação
                        </p>
                        <p className="text-sm text-blue-800 mb-3">
                          OBS: para pagamentos extras referente a outros serviços realizar em pix separados
                        </p>
                        <Button 
                          onClick={copyPixKey} 
                          className="w-full"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Chave PIX
                        </Button>
                        <Button
                          className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            const data = formatDateSafely(billing.due_date);
                            const valor = billing.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            const texto = `Olá! Já realizei o pagamento referente ao vencimento do dia ${data}, parcela ${billing.description}, no valor de ${valor}.`;
                            const url = `https://wa.me/${userWhatsapp ? userWhatsapp.replace(/\D/g, '') : '15991653601'}?text=${encodeURIComponent(texto)}`;
                            window.open(url, '_blank');
                          }}
                        >
                          Enviar comprovante via WhatsApp
                        </Button>
                      </div>
                      {/* Frase motivacional para esta parcela */}
                      <MotivationalPayments payments={[{
                        id: billing.id,
                        name: billing.description,
                        value: billing.amount,
                        dueDate: formatDateSafely(billing.due_date),
                      }]} phraseIndex={idx} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma cobrança pendente</h3>
                  <p className="text-gray-600">Você não possui cobranças pendentes no momento.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="pagas">
            {paidBillings.length > 0 ? (
              <div className="space-y-4">
                {paidBillings.map((billing, idx) => (
                  <Card key={billing.id} className="border-l-4 border-l-green-400 opacity-75">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{billing.description}</CardTitle>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Vencimento: {formatDateSafely(billing.due_date)}</span>
                            </div>
                            {billing.payment_date && (
                              <div className="flex items-center space-x-1 text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Pago em: {formatDateSafely(billing.payment_date)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            R$ {billing.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <Badge className={`text-xs ${getStatusColor(billing.status)}`}>
                            {getStatusIcon(billing.status)}
                            <span className="ml-1">{getStatusText(billing.status)}</span>
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Upload ou visualização do comprovante */}
                      {billing.receipt_url ? (
                        <div className="mt-2">
                          <a href={billing.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                            Ver comprovante enviado
                          </a>
                        </div>
                      ) : (
                        <Button
                          className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            // Saudação dinâmica
                            const hora = new Date().getHours();
                            let saudacao = "";
                            if (hora >= 5 && hora < 12) saudacao = "Bom dia";
                            else if (hora >= 12 && hora < 18) saudacao = "Boa tarde";
                            else saudacao = "Boa noite";
                            const data = formatDateSafely(billing.due_date);
                            const valor = billing.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            const texto = `${saudacao}! Já realizei o pagamento referente do dia: *${data}*\nParcela *${billing.description}*\nValor de *${valor}*.\nSegue o comprovante!`;
                            const url = `https://wa.me/${userWhatsapp ? userWhatsapp.replace(/\D/g, '') : '15991653601'}?text=${encodeURIComponent(texto)}`;
                            window.open(url, '_blank');
                          }}
                        >
                          Enviar comprovante via WhatsApp
                        </Button>
                      )}
                      {/* Removido o botão de desfazer pagamento */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma cobrança pendente</h3>
                  <p className="text-gray-600">Você não possui cobranças pendentes no momento.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="extras">
            {extraServices.length > 0 ? (
              <div className="space-y-4">
                {extraServices.map((service) => (
                  <Card key={service.id} className={service.status === 'pago' ? 'border-l-4 border-l-green-400 opacity-75' : 'border-l-4 border-l-yellow-400'}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{service.description}</CardTitle>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span>Serviço extra</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            R$ {service.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <Badge className={`text-xs ${service.status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{service.status === 'pago' ? 'Pago' : 'Pendente'}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {service.status !== 'pago' && (
                        <>
                          <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <h4 className="font-semibold text-blue-900 mb-2">Para pagar via PIX:</h4>
                            <p className="text-sm text-blue-800 mb-3">
                              1. Copie a chave PIX: <span className="font-mono font-bold break-all">{pixKey}</span>
                            </p>
                            <Button onClick={copyPixKey} className="w-full mb-2">
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar Chave PIX
                            </Button>
                            <Button
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => {
                                const saudacao = (() => {
                                  const hora = new Date().getHours();
                                  if (hora >= 5 && hora < 12) return 'Bom dia';
                                  if (hora >= 12 && hora < 18) return 'Boa tarde';
                                  return 'Boa noite';
                                })();
                                const valor = service.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                const texto = `${saudacao}! Já realizei o pagamento do serviço extra: *${service.description}*\nValor de *${valor}*.\nSegue o comprovante!`;
                                const url = `https://wa.me/${userWhatsapp ? userWhatsapp.replace(/\D/g, '') : '15991653601'}?text=${encodeURIComponent(texto)}`;
                                window.open(url, '_blank');
                              }}
                            >
                              Enviar comprovante via WhatsApp
                            </Button>
                          </div>
                        </>
                      )}
                      {service.status === 'pago' && service.paid_at && (
                        <div className="text-green-700 font-semibold">Pago em {formatDateSafely(service.paid_at)}</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum serviço extra</h3>
                  <p className="text-gray-600">Você não possui serviços extras no momento.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientPortal;