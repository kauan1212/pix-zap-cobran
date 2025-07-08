import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const ClientPortalTestLink = () => {
  const handleTestPortal = () => {
    // Usar um token válido do banco de dados
    const testToken = 'xvVt0KuvN53NjL60V7gXfcotvEBojMsK';
    const portalUrl = `${window.location.origin}/client/${testToken}`;
    console.log('Opening portal URL:', portalUrl);
    window.open(portalUrl, '_blank');
  };

  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-sm font-medium text-blue-900 mb-2">Teste do Portal do Cliente</h3>
      <p className="text-xs text-blue-700 mb-3">
        Clique para testar o acesso ao portal do cliente com um token válido
      </p>
      <Button 
        onClick={handleTestPortal} 
        size="sm" 
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Testar Portal do Cliente
      </Button>
    </div>
  );
};

export default ClientPortalTestLink;