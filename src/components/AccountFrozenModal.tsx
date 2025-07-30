import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Snowflake, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AccountFrozenModalProps {
  isOpen: boolean;
  onClose: () => void;
  frozenReason?: string;
}

const AccountFrozenModal: React.FC<AccountFrozenModalProps> = ({ 
  isOpen, 
  onClose, 
  frozenReason = 'Falta de pagamento' 
}) => {
  const { logout } = useAuth();

  const handleEntendi = () => {
    logout();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Snowflake className="w-6 h-6" />
            Conta Congelada
          </DialogTitle>
          <DialogDescription>
            Sua conta foi congelada e você não pode acessar o sistema no momento.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Motivo do Congelamento:</h3>
            <p className="text-red-700">{frozenReason}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Como Regularizar:</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <p>Para reativar sua conta, entre em contato conosco:</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>WhatsApp: (15) 99165-3601</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>Após o pagamento ser confirmado, envie o comprovante via WhatsApp para reativar o seu acesso.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleEntendi} variant="outline">
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountFrozenModal; 