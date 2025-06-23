
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
import { PlusCircle, Users, ExternalLink, Copy } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf_cnpj: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  const loadClients = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setClients(data || []);
    }
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

    if (clientError) {
      toast({
        title: "Erro ao criar cliente",
        description: clientError.message,
        variant: "destructive",
      });
      return;
    }

    // Criar token de acesso para o cliente
    const token = generateClientToken();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Token válido por 1 ano

    const { error: tokenError } = await supabase
      .from('client_access_tokens')
      .insert([
        {
          client_id: clientData.id,
          token: token,
          expires_at: expiresAt.toISOString(),
        }
      ]);

    if (tokenError) {
      console.error('Erro ao criar token:', tokenError);
      // Não bloquear a criação do cliente por causa do token
    }

    toast({
      title: "Cliente criado!",
      description: `Cliente ${formData.name} foi criado com sucesso.`,
    });
    resetForm();
    setIsDialogOpen(false);
    loadClients();
    onDataChange();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      cpf_cnpj: '',
      address: '',
    });
  };

  const generateClientPortalLink = async (clientId: string) => {
    // Primeiro verificar se já existe um token
    let { data: tokenData, error: tokenError } = await supabase
      .from('client_access_tokens')
      .select('token')
      .eq('client_id', clientId)
      .single();

    // Se não existir token, criar um novo
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
        toast({
          title: "Erro ao gerar link",
          description: newTokenError.message,
          variant: "destructive",
        });
        return;
      }
      tokenData = newTokenData;
    }

    const portalUrl = `${window.location.origin}/client/${tokenData.token}`;
    
    await navigator.clipboard.writeText(portalUrl);
    toast({
      title: "Link copiado!",
      description: "Link do portal do cliente foi copiado para área de transferência.",
    });
  };

  const openClientPortal = async (clientId: string) => {
    // Primeiro verificar se já existe um token
    let { data: tokenData, error: tokenError } = await supabase
      .from('client_access_tokens')
      .select('token')
      .eq('client_id', clientId)
      .single();

    // Se não existir token, criar um novo
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
        toast({
          title: "Erro ao abrir portal",
          description: newTokenError.message,
          variant: "destructive",
        });
        return;
      }
      tokenData = newTokenData;
    }

    const portalUrl = `${window.location.origin}/client/${tokenData.token}`;
    window.open(portalUrl, '_blank');
  };

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
      </div>

      {clients.length === 0 ? (
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
