import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Phone, Clock } from 'lucide-react';

interface AccessDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessDeniedModal: React.FC<AccessDeniedModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-600">
            <Lock className="w-6 h-6" />
            Acesso Pendente
          </DialogTitle>
          <DialogDescription>
            Sua conta foi criada com sucesso, mas ainda precisa ser liberada pelo administrador.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Status da Conta:</h3>
            <div className="flex items-center gap-2 text-yellow-700">
              <Clock className="w-4 h-4" />
              <span>Aguardando liberação do administrador</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Entre em Contato:</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <p>Para acelerar o processo de liberação, entre em contato conosco:</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>WhatsApp: (15) 99165-3601</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>Normalmente a liberação é feita em até 24 horas após o cadastro.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccessDeniedModal; 