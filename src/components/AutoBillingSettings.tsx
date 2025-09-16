import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AutomaticBillingConfig, AutomaticBillingFormData } from '@/types/automaticBilling';
import { Clock, MessageSquare, Phone, Settings } from 'lucide-react';

export function AutoBillingSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<AutomaticBillingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<AutomaticBillingFormData>({
    whatsapp_number: '',
    daily_send_time: '10:00',
    message_template: 'Olá [NOME]! Sou a Valéria, assistente virtual da LocAuto - aluguel de motos. Você tem uma cobrança em atraso no valor de R$ [VALOR] com vencimento em [VENCIMENTO]. Há [DIAS_ATRASO] dias em atraso. Por favor, regularize sua situação.',
    is_active: false
  });

  useEffect(() => {
    if (user) {
      loadConfig();
    }
  }, [user]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('automatic_billing_config')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
        setFormData({
          whatsapp_number: data.whatsapp_number,
          daily_send_time: data.daily_send_time,
          message_template: data.message_template,
          is_active: data.is_active
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateWhatsAppNumber = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    return cleanNumber.length >= 10 && cleanNumber.length <= 15;
  };

  const handleSave = async () => {
    if (!validateWhatsAppNumber(formData.whatsapp_number)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um número de WhatsApp válido (apenas números).",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const cleanNumber = formData.whatsapp_number.replace(/\D/g, '');
      const dataToSave = {
        ...formData,
        whatsapp_number: cleanNumber,
        user_id: user?.id
      };

      if (config) {
        const { error } = await supabase
          .from('automatic_billing_config')
          .update(dataToSave)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('automatic_billing_config')
          .insert([dataToSave]);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });

      loadConfig();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  if (loading) {
    return <div className="p-4">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Cobrança Automática
          </CardTitle>
          <CardDescription>
            Configure o sistema de envio automático de mensagens de cobrança via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Número do WhatsApp (apenas números)
            </Label>
            <Input
              id="whatsapp"
              placeholder="5511999999999"
              value={formData.whatsapp_number}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horário de Envio Diário
            </Label>
            <Select
              value={formData.daily_send_time}
              onValueChange={(value) => setFormData(prev => ({ ...prev, daily_send_time: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map(time => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Template da Mensagem
            </Label>
            <Textarea
              id="template"
              rows={6}
              value={formData.message_template}
              onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
            />
            <div className="text-sm text-muted-foreground">
              Variáveis disponíveis: [NOME], [VALOR], [VENCIMENTO], [DIAS_ATRASO]
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="active">Sistema Ativo</Label>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Importante:</strong> As mensagens serão enviadas automaticamente todos os dias no horário configurado para clientes com pagamentos em atraso. 
              O envio só para quando o administrador confirma o pagamento no sistema.
            </AlertDescription>
          </Alert>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}