import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, QrCode, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Billing {
  id: string;
  clientName: string;
  amount: number;
  description: string;
  dueDate: string;
}

interface PixGeneratorProps {
  billing: Billing;
  onClose: () => void;
}

const PixGenerator = ({ billing, onClose }: PixGeneratorProps) => {
  const { user } = useAuth();
  const [pixCode, setPixCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPixKeyAndGenerate();
  }, [billing, user]);

  const loadPixKeyAndGenerate = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Carregar chave PIX atualizada do usuário
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('pix_key')
        .eq('id', user.id)
        .single();

      let userPixKey = user.email || ''; // Fallback para email
      
      if (!error && profileData?.pix_key) {
        userPixKey = profileData.pix_key;
      }

      setPixKey(userPixKey);
      generatePixCode(userPixKey);
    } catch (error) {
      console.error('Error loading PIX key:', error);
      // Em caso de erro, usa o email como fallback
      const fallbackKey = user.email || '';
      setPixKey(fallbackKey);
      generatePixCode(fallbackKey);
    } finally {
      setLoading(false);
    }
  };

  const generatePixCode = (key: string) => {
    const merchantName = 'COBRANCAPRO';
    const merchantCity = 'SAO PAULO';
    const amount = billing.amount.toFixed(2);
    
    // Gerar código PIX simplificado
    const pixString = `00020101021126580014br.gov.bcb.pix0136${key}52040000530398654${amount.length.toString().padStart(2, '0')}${amount}5802BR5913${merchantName}6009${merchantCity}62070503***6304`;
    
    // Calcular CRC16 simplificado
    const crc = calculateCRC16(pixString);
    const finalPixCode = pixString + crc;
    
    setPixCode(finalPixCode);
    
    // Gerar QR Code usando API externa
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(finalPixCode)}`;
    setQrCodeUrl(qrUrl);
  };

  const calculateCRC16 = (str: string): string => {
    // Implementação simplificada do CRC16
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast({
      title: "Código PIX copiado!",
      description: "O código PIX foi copiado para a área de transferência.",
    });
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qrcode-${billing.clientName}-${billing.id}.png`;
    link.click();
  };

  const generateWhatsAppLink = () => {
    const message = `Olá! Segue o código PIX para pagamento:

💰 Valor: R$ ${billing.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📝 Descrição: ${billing.description}
📅 Vencimento: ${new Date(billing.dueDate).toLocaleDateString('pt-BR')}

🔐 Código PIX:
${pixCode}

Ou escaneie o QR Code em anexo.

Obrigado!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando informações PIX...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pagamento via PIX</DialogTitle>
          <DialogDescription>
            Código PIX para {billing.clientName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações da cobrança */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cliente:</span>
                  <span className="font-medium">{billing.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor:</span>
                  <span className="font-bold text-lg text-green-600">
                    R$ {billing.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vencimento:</span>
                  <span className="font-medium">
                    {new Date(billing.dueDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Descrição:</span>
                  <span className="font-medium text-right max-w-xs truncate">
                    {billing.description}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Chave PIX:</span>
                  <span className="font-mono text-sm font-bold text-blue-600 break-all">
                    {pixKey}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <div className="text-center">
            <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200">
              <img 
                src={qrCodeUrl} 
                alt="QR Code PIX" 
                className="w-48 h-48 mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Código PIX */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código PIX (Copia e Cola):
            </label>
            <div className="relative">
              <textarea
                value={pixCode}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-md text-xs font-mono bg-gray-50 resize-none"
                rows={4}
              />
              <Button
                onClick={copyPixCode}
                className="absolute top-2 right-2 p-2"
                size="sm"
                variant="outline"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={copyPixCode}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Código PIX
            </Button>
            
            <Button
              onClick={downloadQRCode}
              variant="outline"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar QR Code
            </Button>
            
            <Button
              onClick={generateWhatsAppLink}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <span className="mr-2">📱</span>
              Enviar WhatsApp
            </Button>
          </div>

          <div className="text-center">
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PixGenerator;
