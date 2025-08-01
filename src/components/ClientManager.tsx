import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PlusCircle, Users, ExternalLink, Copy, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf_cnpj: string;
  address: string;
  created_at: string;
}

interface ClientManagerProps {
  onDataChange: () => void;
}

const ClientManager = ({ onDataChange }: ClientManagerProps) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf_cnpj: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      cpf_cnpj: '',
      address: '',
    });
  };

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  const loadClients = async () => {
    setLoading(true);
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('clients')
      .select('id, name, email, phone, cpf_cnpj, address, user_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('user.id:', user.id, 'clientes encontrados:', data);

    if (error) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
      setClients([]);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const generateClientToken = (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert([
        {
          ...formData,
          user_id: user.id,
        }
      ])
      .select()
      .single();

    console.log("Resultado insert cliente:", clientData, clientError);

    if (clientError || !clientData) {
      toast({
        title: "Erro ao criar cliente",
        description: clientError?.message || "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    // Só cria o token se o cliente foi criado com sucesso
    const token = generateClientToken();
    let expiresAt: string;
    try {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1);
      expiresAt = date.toISOString();
    } catch (err) {
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    const { error: tokenError } = await supabase
      .from('client_access_tokens')
      .insert([
        {
          client_id: clientData.id,
          token: token,
          expires_at: expiresAt,
        }
      ]);

    if (tokenError) {
      toast({
        title: "Erro ao criar token de acesso",
        description: tokenError.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Cliente criado!",
      description: "Cliente e token criados com sucesso.",
    });
    resetForm();
    setIsDialogOpen(false);
    loadClients();
    onDataChange();
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      cpf_cnpj: client.cpf_cnpj || '',
      address: client.address || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (clientId: string, clientName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente ${clientName}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Cliente excluído!",
      description: `Cliente ${clientName} foi excluído com sucesso.`,
    });
    loadClients();
    onDataChange();
  };

  const ensureClientToken = async (clientId: string) => {
    let { data: tokenData, error: tokenError } = await supabase
      .from('client_access_tokens')
      .select('token')
      .eq('client_id', clientId)
      .single();

    if (tokenError || !tokenData) {
      const token = generateClientToken();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { data: newTokenData, error: newTokenError } = await supabase
        .from('client_access_tokens')
        .insert([
          {
            client_id: clientId,
            token: token,
            expires_at: expiresAt.toISOString(),
          }
        ])
        .select('token')
        .single();

      if (newTokenError) {
        throw new Error(newTokenError.message);
      }
      return newTokenData.token;
    }
    return tokenData.token;
  };

  const generateClientPortalLink = async (clientId: string) => {
    try {
      const token = await ensureClientToken(clientId);
      const portalUrl = `${window.location.origin}/client/${token}`;
      await navigator.clipboard.writeText(portalUrl);
      toast({
        title: "Link copiado!",
        description: "Link do portal do cliente foi copiado para área de transferência.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar link",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openClientPortal = async (clientId: string) => {
    try {
      const token = await ensureClientToken(clientId);
      const portalUrl = `${window.location.origin}/client/${token}`;
      window.open(portalUrl, '_blank');
    } catch (error: any) {
      toast({
        title: "Erro ao abrir portal",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  console.log('Renderizando clientes:', clients);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
          <p className="text-gray-600">Gerencie seus clientes e locatários</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
              <DialogDescription>
                Cadastre um novo cliente ou locatário
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf_cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Endereço completo (opcional)"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Criar Cliente
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        {/* Dialog de Edição igual ao anterior */}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando clientes...</div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum cliente cadastrado</h3>
            <p className="text-gray-600 mb-6">Comece cadastrando seu primeiro cliente</p>
            <Button 
              onClick={() => setIsDialogOpen(true)} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Cadastrar primeiro cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <CardDescription>
                      {client.email && (
                        <div className="text-sm text-gray-600">{client.email}</div>
                      )}
                      {client.phone && (
                        <div className="text-sm text-gray-600">{client.phone}</div>
                      )}
                      {client.cpf_cnpj && (
                        <div className="text-sm text-gray-600">{client.cpf_cnpj}</div>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(client)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(client.id, client.name)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {client.address && (
                  <p className="text-sm text-gray-600 mb-4">{client.address}</p>
                )}
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={() => openClientPortal(client.id)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Portal do Cliente
                  </Button>
                  <Button
                    onClick={() => generateClientPortalLink(client.id)}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Link do Portal
                  </Button>
                </div>
                <div className="mt-3">
                  <Badge variant="outline" className="text-xs">
                    Cadastrado em {new Date(client.created_at).toLocaleDateString('pt-BR')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientManager;