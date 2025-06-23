
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Key, Save, Check, Edit2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PixKeyManager = () => {
  const { user } = useAuth();
  const [pixKey, setPixKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
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
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('pix_key')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao carregar chave PIX:', error);
        // Se não encontrou profile, usa email como padrão
        setPixKey(user.email || '');
      } else {
        setPixKey(profileData?.pix_key || user.email || '');
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
      // Primeiro, verifica se o profile existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Se não existe, cria o profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            pix_key: pixKey.trim()
          });

        if (insertError) {
          throw insertError;
        }
      } else {
        // Se existe, atualiza
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ pix_key: pixKey.trim() })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }
      }

      toast({
        title: "Chave PIX atualizada!",
        description: "Sua chave PIX foi salva com sucesso e já está disponível no portal dos clientes.",
      });
      
      setIsEditing(false);
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

  const handleCancel = () => {
    setIsEditing(false);
    loadPixKey(); // Recarrega o valor original
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600" />
            <CardTitle>Chave PIX da Conta</CardTitle>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
        <CardDescription>
          Configure sua chave PIX para receber pagamentos dos clientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div>
              <Label htmlFor="pixKey">Nova Chave PIX</Label>
              <Input
                id="pixKey"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Digite sua chave PIX (email, telefone, CPF ou chave aleatória)"
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta chave será usada em todas as cobranças e será exibida no portal dos clientes.
              </p>
            </div>

            <div className="flex space-x-2">
              <Button onClick={savePixKey} disabled={saving || !pixKey.trim()}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Chave PIX Configurada
                  </span>
                </div>
                <p className="text-lg font-mono font-bold text-green-900 break-all">
                  {pixKey}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Esta chave está sendo usada em todas as suas cobranças
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PixKeyManager;
