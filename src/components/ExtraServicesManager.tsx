import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ExtraService {
  id: string;
  client_id: string;
  description: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

interface ExtraServicesManagerProps {
  clients: Client[];
}

const ExtraServicesManager: React.FC<ExtraServicesManagerProps> = ({ clients }) => {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);

  const loadExtraServices = async () => {
    if (!selectedClientId) {
      setExtraServices([]);
      return;
    }
    const { data, error } = await supabase
      .from('extra_services')
      .select('*')
      .eq('client_id', selectedClientId)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao carregar serviços extras', description: error.message, variant: 'destructive' });
      setExtraServices([]);
    } else {
      setExtraServices(data || []);
    }
  };

  useEffect(() => {
    if (selectedClientId) {
      loadExtraServices();
    } else {
      setExtraServices([]);
    }
  }, [selectedClientId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedClientId && (
        <>
          {/* Formulário para novo serviço extra */}
          <form
            className="space-y-4 mb-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const description = (e.target as any).description.value;
              const amount = parseFloat((e.target as any).amount.value);
              if (!description || !amount) {
                toast({ title: "Preencha todos os campos" });
                return;
              }
              const { error } = await supabase.from('extra_services').insert({
                client_id: selectedClientId,
                description,
                amount,
              });
              if (error) {
                toast({ title: "Erro ao criar serviço extra", description: error.message, variant: "destructive" });
              } else {
                toast({ title: "Serviço extra criado!" });
                (e.target as HTMLFormElement).reset();
                loadExtraServices();
              }
            }}
          >
            <div>
              <Label htmlFor="description">Descrição do serviço</Label>
              <Input id="description" name="description" required />
            </div>
            <div>
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required />
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Cadastrar Serviço Extra</Button>
          </form>
          {/* Lista de serviços extras */}
          <div className="space-y-4">
            {extraServices.length === 0 ? (
              <Card><CardContent className="text-center py-8 text-gray-500">Nenhum serviço extra cadastrado</CardContent></Card>
            ) : (
              extraServices.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow duration-200 relative">
                  <button
                    onClick={async () => {
                      if (window.confirm('Tem certeza que deseja deletar este serviço extra?')) {
                        const { error } = await supabase.from('extra_services').delete().eq('id', service.id);
                        if (error) {
                          toast({ title: "Erro ao deletar serviço", description: error.message, variant: "destructive" });
                        } else {
                          toast({ title: "Serviço extra deletado!" });
                          loadExtraServices();
                        }
                      }
                    }}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
                    title="Deletar serviço extra"
                  >
                    ✕
                  </button>
                  <CardHeader>
                    <div className="flex justify-between items-start pr-8">
                      <div>
                        <CardTitle className="text-lg">{service.description}</CardTitle>
                        <CardDescription className="text-sm text-gray-600 mt-1">R$ {service.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-xs ${service.status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{service.status === 'pago' ? 'Pago' : 'Pendente'}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {service.status !== 'pago' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const { error } = await supabase.from('extra_services').update({ status: 'pago', paid_at: new Date().toISOString() }).eq('id', service.id);
                          if (error) {
                            toast({ title: "Erro ao marcar como pago", description: error.message, variant: "destructive" });
                          } else {
                            toast({ title: "Serviço extra marcado como pago!" });
                            loadExtraServices();
                          }
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        Marcar como Pago
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ExtraServicesManager; 