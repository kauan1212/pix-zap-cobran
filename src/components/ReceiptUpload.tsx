import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface ReceiptUploadProps {
  billingId: string;
  onUploaded: (url: string) => void;
}

const ReceiptUpload: React.FC<ReceiptUploadProps> = ({ billingId, onUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadReceipt = async () => {
    if (!file) return;
    setUploading(true);
    const filePath = `${billingId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, { upsert: true });
    if (error) {
      alert('Erro ao fazer upload do comprovante.');
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
    if (data?.publicUrl) {
      // Note: receipt_url column needs to be added to billings table
      console.log('Receipt uploaded successfully:', data.publicUrl);
      onUploaded(data.publicUrl);
    }
    setUploading(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
      <Button onClick={uploadReceipt} disabled={uploading || !file}>
        {uploading ? 'Enviando...' : 'Enviar Comprovante'}
      </Button>
    </div>
  );
};

export default ReceiptUpload; 