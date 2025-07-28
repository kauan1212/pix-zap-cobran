
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Mail } from 'lucide-react';

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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <DialogTitle className="text-xl font-semibold">Conta criada com sucesso!</DialogTitle>
          <DialogDescription className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2 text-yellow-600">
              <Mail className="h-5 w-5" />
              <span className="font-medium">Aguarde a confirmação</span>
            </div>
            <p className="text-sm text-gray-600">
              Sua conta foi criada com sucesso, mas precisa ser liberada pelo administrador.
            </p>
            <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              {email}
            </p>

            <p className="text-xs text-gray-500">
              Normalmente a liberação é feita em até 24 horas após o cadastro.
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
