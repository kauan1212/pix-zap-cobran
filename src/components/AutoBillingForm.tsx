
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
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
          <Label htmlFor="name">Nome do Plano *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Ex: Aluguel Apartamento 101"
            required
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
            required
          />
        </div>
        
        <div>
          <Label htmlFor="frequency">Frequência *</Label>
          <Select 
            value={formData.frequency} 
            onValueChange={(value: 'weekly' | 'biweekly' | 'monthly') => setFormData({...formData, frequency: value})}
            required
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
            <Label htmlFor="start_date">Data Inicial *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="end_date">Data Final *</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              required
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
            required
            maxLength={250}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/250 caracteres
          </p>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            Criar Plano e Gerar Cobranças
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default AutoBillingForm;
