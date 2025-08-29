import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Eye, EyeOff } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  show_total_pending: boolean;
}

const ClientSettingsManager: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, phone, show_total_pending')
        .order('name');

      if (error) {
        toast({ 
          title: 'Erro ao buscar clientes', 
          description: error.message, 
          variant: 'destructive' 
        });
      } else {
        setClients(data || []);
      }
    } catch (err: any) {
      toast({ 
        title: 'Erro ao buscar clientes', 
        description: err.message, 
        variant: 'destructive' 
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleToggleShowTotalPending = async (client: Client) => {
    setActionLoading(client.id);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ show_total_pending: !client.show_total_pending })
        .eq('id', client.id);
      
      if (error) {
        toast({ 
          title: 'Erro ao atualizar configuração', 
          description: error.message, 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Configuração atualizada!',
          description: `Total Pendente ${!client.show_total_pending ? 'ativado' : 'desativado'} para ${client.name}`
        });
        fetchClients(); // Recarregar lista
      }
    } catch (err: any) {
      toast({ 
        title: 'Erro ao atualizar configuração', 
        description: err.message, 
        variant: 'destructive' 
      });
    }
    setActionLoading(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Configurações de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Carregando clientes...</span>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Nome do Cliente</th>
                      <th className="text-left p-4 font-medium">Email</th>
                      <th className="text-left p-4 font-medium">Telefone</th>
                      <th className="text-center p-4 font-medium">Mostrar Total Pendente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client, index) => (
                      <tr 
                        key={client.id} 
                        className={`border-b transition-colors hover:bg-muted/20 ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                        }`}
                      >
                        <td className="p-4">
                          <div className="font-medium">{client.name}</div>
                        </td>
                        <td className="p-4 text-sm">{client.email || '-'}</td>
                        <td className="p-4 text-sm">{client.phone || '-'}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            {client.show_total_pending ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                            <Switch
                              checked={client.show_total_pending}
                              onCheckedChange={() => handleToggleShowTotalPending(client)}
                              disabled={actionLoading === client.id}
                            />
                            {actionLoading === client.id && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSettingsManager;