
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const PixSettings = () => {
  const { user } = useAuth();
  const [pixKey, setPixKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPixKey();
    }
  }, [user]);

  const loadPixKey = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('pix_key')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error loading PIX key:', error);
        return;
      }

      if (data?.pix_key) {
        setPixKey(data.pix_key);
      }
    } catch (error) {
      console.error('Error loading PIX key:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pixKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma chave PIX válida",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ pix_key: pixKey.trim() })
        .eq('id', user?.id);

      if (error) {
        console.error('Error saving PIX key:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar chave PIX",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso!",
        description: "Chave PIX salva com sucesso",
      });
    } catch (error) {
      console.error('Error saving PIX key:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar chave PIX",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações PIX</CardTitle>
        <CardDescription>
          Configure sua chave PIX personalizada para receber pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pixKey">Chave PIX</Label>
          <Input
            id="pixKey"
            type="text"
            placeholder="Digite sua chave PIX (CPF, CNPJ, email, telefone ou chave aleatória)"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
          />
          <p className="text-sm text-gray-600">
            Esta chave será usada para gerar códigos PIX nas suas cobranças
          </p>
        </div>
        
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Chave PIX'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PixSettings;
