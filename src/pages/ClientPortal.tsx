import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, DollarSign, Copy, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
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
}

const ClientPortal = () => {
  const { token } = useParams<{ token: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pixKey, setPixKey] = useState<string>('');

  useEffect(() => {
    if (token) {
      loadClientData();
    }
  }, [token]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Token received:', token);

      // Use service role to bypass RLS for token verification
      const { data: tokenData, error: tokenError } = await supabase
        .from('client_access_tokens')
        .select(`
          client_id,
          expires_at,
          clients!inner (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('token', token)
        .maybeSingle();

      console.log('Token verification result:', { tokenData, tokenError });

      if (tokenError) {
        console.error('Token error:', tokenError);
        setError('Erro ao verificar token');
        return;
      }

      if (!tokenData) {
        console.log('No token data found');
        setError('Link inválido ou expirado');
        return;
      }

      // Check if token is expired
      if (new Date(tokenData.expires_at) < new Date()) {
        console.log('Token expired');
        setError('Link expirado');
        return;
      }

      console.log('Token valid, client data:', tokenData.clients);
      setClient(tokenData.clients);

      // Load billings for this client
      const { data: billingsData, error: billingsError } = await supabase
        .from('billings')
        .select('*')
        .eq('client_id', tokenData.client_id)
        .order('created_at', { ascending: false });

      console.log('Billings query result:', { billingsData, billingsError });

      if (billingsError) {
        console.error('Error loading billings:', billingsError);
        setError('Erro ao carregar cobranças');
        return;
      }

      setBillings((billingsData as any[])?.map(item => ({
        ...item,
        status: item.status as 'pending' | 'paid' | 'overdue' | 'cancelled'
      })) || []);

      // Get PIX key from user profile
      const { data: userData } = await supabase
        .from('clients')
        .select('user_id')
        .eq('id', tokenData.client_id)
        .single();

      if (userData) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('pix_key')
          .eq('id', userData.user_id)
          .single();

        if (profileData?.pix_key) {
          setPixKey(profileData.pix_key);
        } else {
          // Default PIX key if not set
          setPixKey('15991653601');
        }
      }

    } catch (err) {
      console.error('Error:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const copyPixKey = () => {
    if (pixKey) {
      navigator.clipboard.writeText(pixKey);
      toast({
        title: "Chave PIX copiada!",
        description: `Chave PIX ${pixKey} copiada para área de transferência.`,
      });
    }
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
          <p className="text-gray-600">Carregando...</p>
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
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingBillings = billings.filter(b => b.status === 'pending' || b.status === 'overdue');
  const paidBillings = billings.filter(b => b.status === 'paid');
  const totalPending = pendingBillings.reduce((sum, billing) => sum + billing.amount, 0);
  const totalPaid = paidBillings.reduce((sum, billing) => sum + billing.amount, 0);

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
                CobrançaPro
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
            Aqui você pode visualizar suas cobranças e realizar pagamentos via PIX.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                {pendingBillings.length} cobrança(s)
              </p>
            </CardContent>
          </Card>

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
                {paidBillings.length} cobrança(s) pagas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Chave PIX</CardTitle>
              <Copy className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-blue-900 font-mono mb-2">
                {pixKey}
              </div>
              <Button onClick={copyPixKey} size="sm" className="w-full">
                Copiar Chave PIX
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pending Billings */}
        {pendingBillings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
              Cobranças Pendentes
            </h2>
            <div className="space-y-4">
              {pendingBillings.map((billing) => (
                <Card key={billing.id} className="border-l-4 border-l-yellow-400">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{billing.description}</CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Vencimento: {new Date(billing.due_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          {billing.penalty && (
                            <span className="text-red-600">Multa: R$ {billing.penalty.toFixed(2)}</span>
                          )}
                          {billing.interest && (
                            <span className="text-red-600">Juros: {billing.interest}% ao mês</span>
                          )}
                        </CardDescription>
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
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Para pagar via PIX:</h4>
                      <p className="text-sm text-blue-800 mb-3">
                        1. Copie a chave PIX: <span className="font-mono font-bold">{pixKey}</span>
                      </p>
                      <p className="text-sm text-blue-800 mb-3">
                        2. Abra o app do seu banco e faça o PIX
                      </p>
                      <p className="text-sm text-blue-800 mb-4">
                        3. Envie o comprovante para confirmação
                      </p>
                      <Button onClick={copyPixKey} className="w-full">
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Chave PIX
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Paid Billings */}
        {paidBillings.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
              Pagamentos Realizados
            </h2>
            <div className="space-y-4">
              {paidBillings.map((billing) => (
                <Card key={billing.id} className="border-l-4 border-l-green-400 opacity-75">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{billing.description}</CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Vencimento: {new Date(billing.due_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          {billing.payment_date && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Pago em: {new Date(billing.payment_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                        </CardDescription>
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
                </Card>
              ))}
            </div>
          </div>
        )}

        {billings.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma cobrança encontrada</h3>
              <p className="text-gray-600">Não há cobranças registradas para você no momento.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClientPortal;
