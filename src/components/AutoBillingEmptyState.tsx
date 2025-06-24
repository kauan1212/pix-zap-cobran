
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Clock } from 'lucide-react';

interface AutoBillingEmptyStateProps {
  onCreatePlan: () => void;
}

const AutoBillingEmptyState = ({ onCreatePlan }: AutoBillingEmptyStateProps) => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum plano automático criado</h3>
        <p className="text-gray-600 mb-6">Comece criando seu primeiro plano de cobrança automática</p>
        <Button 
          onClick={onCreatePlan} 
          className="bg-blue-600 hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Criar primeiro plano
        </Button>
      </CardContent>
    </Card>
  );
};

export default AutoBillingEmptyState;
