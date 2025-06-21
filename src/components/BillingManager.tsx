
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { PlusCircle, FileText, Calendar, DollarSign, QrCode, Copy, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PixGenerator from './PixGenerator';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Billing {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  description: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  pixCode?: string;
  createdAt: string;
  penalty?: number;
  interest?: number;
}

interface BillingManagerProps {
  clients: Client[];
  canCreate: boolean;
  onDataChange: () => void;
}

const BillingManager = ({ clients, canCreate, onDataChange }: BillingManagerProps) => {
  const { user, updateBillingCount } = useAuth();
  const [billings, setBillings] = useState<Billing[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    amount: '',
    description: '',
    dueDate: '',
    penalty: '',
    interest: '',
  });

  useEffect(() => {
    loadBillings();
  }, [user]);

  const loadBillings = () => {
    if (user) {
      const userBillings = JSON.parse(localStorage.getItem(`billings_${user.id}`) || '[]');
      setBillings(userBillings);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !canCreate) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de cobranças do seu plano.",
        variant: "destructive",
      });
      return;
    }

    const selectedClient = clients.find(c => c.id === formData.clientId);
    if (!selectedClient) {
      toast({
        title: "Erro",
        description: "Selecione um cliente válido.",
        variant: "destructive",
      });
      return;
    }

    const billingData: Billing = {
      id: Date.now().toString(),
      clientId: formData.clientId,
      clientName: selectedClient.name,
      amount: parseFloat(formData.amount),
      description: formData.description,
      dueDate: formData.dueDate,
      status: 'pending',
      createdAt: new Date().toISOString(),
      penalty: formData.penalty ? parseFloat(formData.penalty) : undefined,
      interest: formData.interest ? parseFloat(formData.interest) : undefined,
    };

    const updatedBillings = [...billings, billingData];
    localStorage.setItem(`billings_${user.id}`, JSON.stringify(updatedBillings));
    setBillings(updatedBillings);
    updateBillingCount();
    resetForm();
    setIsDialogOpen(false);
    onDataChange();
    
    toast({
      title: "Cobrança criada!",
      description: `Cobrança de R$ ${billingData.amount.toFixed(2)} criada para ${selectedClient.name}.`,
    });
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      amount: '',
      description: '',
      dueDate: '',
      penalty: '',
      interest: '',
    });
  };

  const updateBillingStatus = (billingId: string, status: Billing['status']) => {
    if (!user) return;

    const updatedBillings = billings.map(billing => 
      billing.id === billingId ? { ...billing, status } : billing
    );
    
    localStorage.setItem(`billings_${user.id}`, JSON.stringify(updatedBillings));
    setBillings(updatedBillings);
    onDataChange();
    
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
  };

  const generateWhatsAppMessage = (billing: Billing) => {
    const client = clients.find(c => c.id === billing.clientId);
    if (!client) return '';

    const dueDate = new Date(billing.dueDate).toLocaleDateString('pt-BR');
    const amount = billing.amount.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });

    return `Olá, ${client.name}! 

Você tem uma nova cobrança:
💰 Valor: ${amount}
📅 Vencimento: ${dueDate}
📝 Descrição: ${billing.description}

Para pagar via PIX, clique no link abaixo:
[Link do PIX será gerado aqui]

Obrigado!`;
  };

  const copyWhatsAppMessage = (billing: Billing) => {
    const message = generateWhatsAppMessage(billing);
    navigator.clipboard.writeText(message);
    toast({
      title: "Mensagem copiada!",
      description: "Mensagem copiada para a área de transferência.",
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
            <Button 
              onClick={resetForm} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!canCreate}
            >
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
                  value={formData.clientId} 
                  onValueChange={(value) => setFormData({...formData, clientId: value})}
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
                <Label htmlFor="dueDate">Data de Vencimento *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
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
                <Button type="submit" disabled={!canCreate}>
                  Criar Cobrança
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Billings List */}
      {billings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma cobrança criada</h3>
            <p className="text-gray-600 mb-6">Comece criando sua primeira cobrança</p>
            <Button 
              onClick={() => setIsDialogOpen(true)} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!canCreate}
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
                    <CardTitle className="text-lg">{billing.clientName}</CardTitle>
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
                      <span>Vencimento: {new Date(billing.dueDate).toLocaleDateString('pt-BR')}</span>
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
                    onClick={() => setSelectedBilling(billing)}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    PIX
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyWhatsAppMessage(billing)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    WhatsApp
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* PIX Dialog */}
      {selectedBilling && (
        <PixGenerator
          billing={selectedBilling}
          onClose={() => setSelectedBilling(null)}
        />
      )}
    </div>
  );
};

export default BillingManager;
