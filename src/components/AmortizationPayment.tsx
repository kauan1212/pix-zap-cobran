import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, Info, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AmortizationCalculation } from '@/types/amortization';

interface AmortizationPaymentProps {
  clientId: string;
  clientName: string;
  onAmortizationCreated?: () => void;
}

export function AmortizationPayment({ clientId, clientName, onAmortizationCreated }: AmortizationPaymentProps) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] = useState<AmortizationCalculation | null>(null);
  const [generatingPix, setGeneratingPix] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const parseCurrency = (value: string): number => {
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const handleAmountChange = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    
    // Converte para formato de moeda
    const amount = parseFloat(numbers) / 100;
    
    if (amount > 0) {
      setPaymentAmount(
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(amount)
      );
    } else {
      setPaymentAmount('');
    }
  };

  const calculateAmortization = async () => {
    const amount = parseCurrency(paymentAmount);
    
    if (amount < 25) {
      toast.error('O valor mínimo para amortização é R$ 25,00');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-amortization', {
        body: {
          client_id: clientId,
          payment_amount: amount,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setCalculation(data);
    } catch (error: any) {
      console.error('Erro ao calcular amortização:', error);
      toast.error('Erro ao calcular amortização');
    } finally {
      setLoading(false);
    }
  };

  const generatePixForAmortization = async () => {
    if (!calculation) return;

    setGeneratingPix(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-amortization', {
        body: {
          client_id: clientId,
          payment_amount: calculation.payment_amount,
          calculation: calculation,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Código de amortização gerado! Use o código: ' + data.payment_code);
      
      // Resetar formulário
      setPaymentAmount('');
      setCalculation(null);
      
      onAmortizationCreated?.();
    } catch (error: any) {
      console.error('Erro ao gerar código:', error);
      toast.error('Erro ao gerar código de amortização');
    } finally {
      setGeneratingPix(false);
    }
  };

  const amount = parseCurrency(paymentAmount);
  const hasDiscount = amount >= 1000;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Amortizar Parcelas - {clientName}
          </CardTitle>
          <CardDescription>
            Pague suas dívidas e ganhe descontos especiais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Como funciona:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Pagamentos de R$ 25,00 a R$ 999,99 abatem suas dívidas mais antigas</li>
                  <li className="font-bold text-primary">Pagamentos de R$ 1.000,00 ou mais ganham 10% de desconto!</li>
                  <li>O valor é aplicado automaticamente nas cobranças mais antigas primeiro</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Valor do Pagamento
              </label>
              <Input
                type="text"
                placeholder="R$ 0,00"
                value={paymentAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="text-lg"
              />
              {amount > 0 && amount < 25 && (
                <p className="text-sm text-destructive mt-1">
                  Valor mínimo: R$ 25,00
                </p>
              )}
            </div>

            {hasDiscount && (
              <Alert className="bg-primary/10 border-primary">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary font-medium">
                  🎉 Você ganhou 10% de desconto! Crédito total: {formatCurrency(amount * 1.1)}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={calculateAmortization}
              disabled={loading || amount < 25}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                'Simular Amortização'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {calculation && (
        <Card>
          <CardHeader>
            <CardTitle>Simulação da Amortização</CardTitle>
            <CardDescription>
              Veja como seu pagamento será distribuído
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Valor a Pagar</p>
                <p className="text-xl font-bold">{formatCurrency(calculation.payment_amount)}</p>
              </div>
              {calculation.has_discount && (
                <div>
                  <p className="text-sm text-muted-foreground">Desconto (10%)</p>
                  <p className="text-xl font-bold text-primary">
                    +{formatCurrency(calculation.discount_applied)}
                  </p>
                </div>
              )}
              <div className="col-span-2 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Crédito Total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(calculation.total_credit)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Cobranças que serão abatidas:</h4>
              {calculation.affected_billings.map((billing) => (
                <div
                  key={billing.billing_id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{billing.billing_description}</p>
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {new Date(billing.billing_due_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {billing.will_be_paid && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Será quitada
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Dívida atual:</p>
                      <p className="font-medium">{formatCurrency(billing.current_debt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Será abatido:</p>
                      <p className="font-medium text-primary">
                        {formatCurrency(billing.will_apply)}
                      </p>
                    </div>
                    {!billing.will_be_paid && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Restará:</p>
                        <p className="font-medium">{formatCurrency(billing.remaining_after)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {calculation.remaining_credit > 0 && (
              <Alert className="bg-primary/10 border-primary">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary">
                  Após quitar todas as dívidas, você terá um crédito de{' '}
                  <strong>{formatCurrency(calculation.remaining_credit)}</strong> para usar em futuras cobranças!
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={generatePixForAmortization}
              disabled={generatingPix}
              className="w-full"
              size="lg"
            >
              {generatingPix ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                'Confirmar e Gerar Código de Pagamento'
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
