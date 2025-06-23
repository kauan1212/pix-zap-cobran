
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail } from 'lucide-react';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const EmailConfirmationModal = ({ isOpen, onClose, email }: EmailConfirmationModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-xl font-semibold">Conta criada com sucesso!</DialogTitle>
          <DialogDescription className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <Mail className="h-5 w-5" />
              <span className="font-medium">Confirme seu email</span>
            </div>
            <p className="text-sm text-gray-600">
              Enviamos um email de confirmação para:
            </p>
            <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              {email}
            </p>
            <p className="text-sm text-gray-600">
              Verifique sua caixa de entrada e clique no link de confirmação para ativar sua conta.
            </p>
            <p className="text-xs text-gray-500">
              Não esqueça de verificar a pasta de spam/lixo eletrônico.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button onClick={onClose} className="w-full">
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailConfirmationModal;
