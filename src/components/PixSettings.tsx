
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Key, Save, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
    if (!user) return;

    setLoading(true);
    try {
      // Primeiro, tenta buscar na tabela profiles (fallback)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('pix_key')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData?.pix_key) {
        setPixKey(profileData.pix_key);
      } else {
        // Se não encontrou, usa o email como padrão
        setPixKey(user.email || '');
      }
    } catch (error) {
      console.error('Erro ao carregar chave PIX:', error);
      setPixKey(user.email || '');
    } finally {
      setLoading(false);
    }
  };

  const savePixKey = async () => {
    if (!user || !pixKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma chave PIX válida.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pix_key: pixKey.trim() })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Chave PIX salva!",
        description: "Sua chave PIX foi atualizada com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao salvar chave PIX:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar a chave PIX.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações PIX...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Key className="w-5 h-5 text-blue-600" />
          <CardTitle>Configurações PIX</CardTitle>
        </div>
        <CardDescription>
          Configure sua chave PIX para receber pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="pixKey">Chave PIX</Label>
          <Input
            id="pixKey"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="Digite sua chave PIX (email, telefone, CPF ou chave aleatória)"
            disabled={saving}
          />
          <p className="text-xs text-gray-500 mt-1">
            Esta chave será usada para receber os pagamentos via PIX dos seus clientes.
          </p>
        </div>

        <Button onClick={savePixKey} disabled={saving || !pixKey.trim()}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Chave PIX
            </>
          )}
        </Button>

        {pixKey && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Chave PIX configurada: {pixKey}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PixSettings;
