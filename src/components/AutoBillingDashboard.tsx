import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AutomaticBillingLog, OverdueBilling } from '@/types/automaticBilling';
import { MessageSquare, Clock, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AutoBillingDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AutomaticBillingLog[]>([]);
  const [pendingReceipts, setPendingReceipts] = useState<OverdueBilling[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Carregar logs recentes
      const { data: logsData, error: logsError } = await supabase
        .from('automatic_billing_logs')
        .select(`
          *,
          billings!inner(
            description,
            amount,
            clients!inner(name)
          )
        `)
        .eq('user_id', user?.id)
        .order('message_sent_at', { ascending: false })
        .limit(10);

      if (logsError) throw logsError;
      setLogs(logsData || []);

      // Carregar cobranças com comprovante pendente
      const { data: receiptsData, error: receiptsError } = await supabase
        .from('billings')
        .select(`
          id,
          client_id,
          amount,
          due_date,
          description,
          receipt_submitted_at,
          receipt_confirmed_at,
          receipt_url,
          clients!inner(name)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'overdue')
        .not('receipt_submitted_at', 'is', null)
        .is('receipt_confirmed_at', null);

      if (receiptsError) throw receiptsError;

      const pendingData = receiptsData?.map((billing: any) => ({
        id: billing.id,
        client_id: billing.client_id,
        amount: billing.amount,
        due_date: billing.due_date,
        description: billing.description,
        receipt_submitted_at: billing.receipt_submitted_at,
        receipt_confirmed_at: billing.receipt_confirmed_at,
        receipt_url: billing.receipt_url,
        client_name: billing.clients.name,
        days_overdue: Math.floor((new Date().getTime() - new Date(billing.due_date).getTime()) / (1000 * 3600 * 24))
      })) || [];

      setPendingReceipts(pendingData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (billingId: string) => {
    try {
      const { error } = await supabase
        .from('billings')
        .update({
          status: 'paid',
          receipt_confirmed_at: new Date().toISOString(),
          payment_date: new Date().toISOString()
        })
        .eq('id', billingId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pagamento confirmado! As cobranças automáticas foram interrompidas.",
      });

      loadData();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o pagamento.",
        variant: "destructive",
      });
    }
  };

  const openWhatsApp = (clientName: string, message: string) => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return <div className="p-4">Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Comprovantes Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Comprovantes Pendentes de Confirmação
          </CardTitle>
          <CardDescription>
            Cobranças que receberam comprovante mas ainda precisam ser confirmadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingReceipts.length === 0 ? (
            <p className="text-muted-foreground">Nenhum comprovante pendente de confirmação.</p>
          ) : (
            <div className="space-y-4">
              {pendingReceipts.map((receipt) => (
                <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{receipt.client_name}</p>
                    <p className="text-sm text-muted-foreground">{receipt.description}</p>
                    <p className="text-sm">
                      Valor: R$ {receipt.amount.toFixed(2)} • {receipt.days_overdue} dias em atraso
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Comprovante enviado em: {format(new Date(receipt.receipt_submitted_at!), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {receipt.receipt_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(receipt.receipt_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ver Comprovante
                      </Button>
                    )}
                    <Button
                      onClick={() => confirmPayment(receipt.id)}
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirmar Pagamento
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mensagens Automáticas Recentes
          </CardTitle>
          <CardDescription>
            Últimas 10 mensagens de cobrança enviadas automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma mensagem foi enviada ainda.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{(log as any).billings?.clients?.name || 'Cliente'}</p>
                    <p className="text-sm text-muted-foreground">
                      {(log as any).billings?.description} - R$ {(log as any).billings?.amount?.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {format(new Date(log.message_sent_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                      {log.status === 'sent' ? 'Enviada' : 'Falhou'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openWhatsApp((log as any).billings?.clients?.name || 'Cliente', log.message_content)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}