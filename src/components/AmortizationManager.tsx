import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle2, Clock, X, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PendingAmortization {
  id: string;
  client_id: string;
  payment_amount: number;
  discount_applied: number;
  total_credit: number;
  status: string;
  payment_code: string;
  created_at: string;
  clients?: {
    name: string;
  };
}

export function AmortizationManager() {
  const { user } = useAuth();
  const [pendingAmortizations, setPendingAmortizations] = useState<PendingAmortization[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPendingAmortizations();
    }
  }, [user]);

  const loadPendingAmortizations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_amortizations')
        .select(`
          *,
          clients (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingAmortizations(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar amortizações:', error);
      toast.error('Erro ao carregar amortizações pendentes');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (amortizationId: string) => {
    setProcessing(amortizationId);
    try {
      const { data, error } = await supabase.functions.invoke('process-amortization', {
        body: {
          amortization_id: amortizationId,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Amortização processada com sucesso!');
      loadPendingAmortizations();
    } catch (error: any) {
      console.error('Erro ao processar amortização:', error);
      toast.error('Erro ao processar amortização');
    } finally {
      setProcessing(null);
    }
  };

  const cancelAmortization = async (amortizationId: string) => {
    setProcessing(amortizationId);
    try {
      const { error } = await supabase
        .from('payment_amortizations')
        .update({ status: 'cancelled' })
        .eq('id', amortizationId);

      if (error) throw error;

      toast.success('Solicitação cancelada');
      loadPendingAmortizations();
    } catch (error: any) {
      console.error('Erro ao cancelar:', error);
      toast.error('Erro ao cancelar solicitação');
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Solicitações de Amortização
        </CardTitle>
        <CardDescription>
          Confirme os pagamentos recebidos via PIX para processar as amortizações
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingAmortizations.length === 0 ? (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Nenhuma solicitação de amortização pendente no momento.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {pendingAmortizations.map((amortization) => (
              <Card key={amortization.id} className="border-2">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg">
                          {amortization.clients?.name || 'Cliente'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Solicitado em: {new Date(amortization.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Pendente
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Pago</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(amortization.payment_amount)}
                        </p>
                      </div>
                      {amortization.discount_applied > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground">Desconto (10%)</p>
                          <p className="text-xl font-bold text-primary">
                            +{formatCurrency(amortization.discount_applied)}
                          </p>
                        </div>
                      )}
                      <div className={amortization.discount_applied > 0 ? 'col-span-2' : ''}>
                        <p className="text-sm text-muted-foreground">Crédito Total</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(amortization.total_credit)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => confirmPayment(amortization.id)}
                        disabled={processing === amortization.id}
                        className="flex-1"
                      >
                        {processing === amortization.id ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Confirmar Pagamento
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => cancelAmortization(amortization.id)}
                        disabled={processing === amortization.id}
                        variant="outline"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
