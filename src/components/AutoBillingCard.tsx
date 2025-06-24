
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { AutoBillingPlan } from '@/types/autoBilling';
import { getFrequencyText } from '@/utils/autoBillingUtils';

interface AutoBillingCardProps {
  plan: AutoBillingPlan;
  onToggleStatus: (planId: string, isActive: boolean) => void;
  onDelete: (planId: string) => void;
}

const AutoBillingCard = ({ plan, onToggleStatus, onDelete }: AutoBillingCardProps) => {
  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.')) {
      onDelete(plan.id);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2 
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{plan.name}</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              {plan.clients?.name || 'Cliente não encontrado'} • {plan.description}
            </CardDescription>
          </div>
          <div className="text-right ml-4">
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(Number(plan.amount))}
            </p>
            <Badge variant={plan.is_active ? "default" : "secondary"}>
              {plan.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{getFrequencyText(plan.frequency)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>
                {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={plan.is_active}
                onCheckedChange={(checked) => onToggleStatus(plan.id, checked)}
              />
              <span className="text-sm">{plan.is_active ? 'Ativo' : 'Inativo'}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoBillingCard;
