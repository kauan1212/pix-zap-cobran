import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Client, AutoBillingFormData } from '@/types/autoBilling';

interface AutoBillingFormProps {
  clients: Client[];
  onSubmit: (formData: AutoBillingFormData) => Promise<void>;
  onCancel: () => void;
}

const AutoBillingForm = ({ clients, onSubmit, onCancel }: AutoBillingFormProps) => {
  const [formData, setFormData] = useState<AutoBillingFormData>({
    client_id: '',
    name: '',
    amount: '',
    description: '',
    frequency: 'monthly',
    start_date: '',
    end_date: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get today's date in YYYY-MM-DD format for minimum date validation
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Client-side validation
    if (!formData.client_id) {
      alert('Por favor, selecione um cliente.');
      return;
    }

    if (!formData.name.trim()) {
      alert('Por favor, insira um nome para o plano.');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, insira um valor válido maior que zero.');
      return;
    }

    if (!formData.description.trim()) {
      alert('Por favor, insira uma descrição.');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      alert('Por favor, selecione as datas inicial e final.');
      return;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (endDate <= startDate) {
      alert('A data final deve ser posterior à data inicial.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Criar Plano de Cobrança Automática</DialogTitle>
        <DialogDescription>
          Configure um plano que gerará cobranças automaticamente no período definido
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="client">Cliente *</Label>
          <Select 
            value={formData.client_id} 
            onValueChange={(value) => setFormData({...formData, client_id: value})}
            disabled={isSubmitting}
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
          <Label htmlFor="name">Nome do Plano *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Ex: Aluguel Apartamento 101"
            disabled={isSubmitting}
            maxLength={100}
          />
        </div>
        
        <div>
          <Label htmlFor="amount">Valor por Cobrança (R$) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            placeholder="0,00"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <Label htmlFor="frequency">Frequência *</Label>
          <Select 
            value={formData.frequency} 
            onValueChange={(value: 'weekly' | 'biweekly' | 'monthly') => setFormData({...formData, frequency: value})}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="biweekly">Quinzenal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Próxima Cobrança *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              min={today}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="end_date">Data Final *</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              min={formData.start_date || today}
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="description">Descrição da Cobrança *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descrição que aparecerá em todas as cobranças"
            disabled={isSubmitting}
            maxLength={250}
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/250 caracteres
          </p>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Criando...' : 'Criar Plano e Gerar Cobranças'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default AutoBillingForm;
