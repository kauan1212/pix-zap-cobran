import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Clock, DollarSign, Phone, User, FileText } from 'lucide-react';

interface PaymentAlert {
  client_id: string;
  client_name: string;
  client_phone: string;
  billing_id: string;
  amount: number;
  description: string;
  due_date: string;
  days_overdue: number;
  status: 'due_today' | 'overdue';
}

interface PaymentAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PaymentAlert[];
}

const PaymentAlertsModal = ({ isOpen, onClose, alerts }: PaymentAlertsModalProps) => {
  const dueToday = alerts.filter(alert => alert.status === 'due_today');
  const overdue = alerts.filter(alert => alert.status === 'overdue');
  
  const totalOverdueAmount = overdue.reduce((sum, alert) => sum + alert.amount, 0);
  const totalDueTodayAmount = dueToday.reduce((sum, alert) => sum + alert.amount, 0);

  const formatWhatsAppMessage = (alert: PaymentAlert) => {
    const formattedDate = new Date(alert.due_date).toLocaleDateString('pt-BR');
    const formattedAmount = alert.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    if (alert.status === 'due_today') {
      return `Olá ${alert.client_name}! Lembramos que hoje (${formattedDate}) é o vencimento do pagamento: ${alert.description} no valor de ${formattedAmount}. Para evitar multa, realize o pagamento até hoje.`;
    } else {
      return `Olá ${alert.client_name}! Seu pagamento de ${alert.description} no valor de ${formattedAmount} venceu em ${formattedDate} (${alert.days_overdue} dia(s) de atraso). Para regularizar, realize o pagamento o mais breve possível.`;
    }
  };

  const openWhatsApp = (alert: PaymentAlert) => {
    const message = formatWhatsAppMessage(alert);
    const phone = alert.client_phone?.replace(/\D/g, '') || '';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Alertas de Pagamento
          </DialogTitle>
          <DialogDescription>
            {alerts.length} cliente(s) com pagamentos em atraso ou vencendo hoje
          </DialogDescription>
        </DialogHeader>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {overdue.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-800 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Pagamentos em Atraso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {overdue.length} cliente(s)
                </div>
                <div className="text-sm text-red-700">
                  Total: R$ {totalOverdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          )}

          {dueToday.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-yellow-800 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Vencimento Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {dueToday.length} cliente(s)
                </div>
                <div className="text-sm text-yellow-700">
                  Total: R$ {totalDueTodayAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Lista de Alertas */}
        <div className="space-y-4">
          {overdue.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Pagamentos em Atraso ({overdue.length})
              </h3>
              <div className="space-y-3">
                {overdue.map((alert) => (
                  <Card key={`${alert.client_id}-${alert.billing_id}`} className="border-red-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-semibold">{alert.client_name}</span>
                            <Badge variant="destructive">
                              {alert.days_overdue} dia(s) de atraso
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3 h-3" />
                              <span>{alert.description}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              <span>Vencimento: {new Date(alert.due_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-3 h-3" />
                              <span className="font-semibold text-red-600">
                                R$ {alert.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {alert.client_phone && (
                            <Button
                              size="sm"
                              onClick={() => openWhatsApp(alert)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Phone className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {dueToday.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Vencimento Hoje ({dueToday.length})
              </h3>
              <div className="space-y-3">
                {dueToday.map((alert) => (
                  <Card key={`${alert.client_id}-${alert.billing_id}`} className="border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-semibold">{alert.client_name}</span>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Vence hoje
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3 h-3" />
                              <span>{alert.description}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              <span>Vencimento: {new Date(alert.due_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-3 h-3" />
                              <span className="font-semibold text-yellow-600">
                                R$ {alert.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {alert.client_phone && (
                            <Button
                              size="sm"
                              onClick={() => openWhatsApp(alert)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Phone className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentAlertsModal;