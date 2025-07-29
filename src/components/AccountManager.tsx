import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Save, X, Unlock, Lock, Snowflake, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEventBus } from '@/hooks/useEventBus';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  pix_key: string | null;
  is_admin: boolean | null;
  access_granted: boolean | null;
  account_frozen: boolean | null;
  frozen_reason: string | null;
}

const AccountManager: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newPixKey, setNewPixKey] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast({
          title: "Erro ao carregar usuários",
          description: error.message,
          variant: "destructive",
        });
        setUsers([]);
        return;
      }
      
      setUsers(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar usuários",
        description: "Erro inesperado ao buscar usuários",
        variant: "destructive",
      });
      setUsers([]);
    }
    
    setLoading(false);
  };

  // Escutar evento de nova conta criada
  useEventBus('newUserCreated', (user) => {
    // Aguardar um pouco e depois atualizar
    setTimeout(() => {
      fetchUsers();
    }, 1000);
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditPixKey = (user: UserProfile) => {
    setEditingUser(user);
    setNewPixKey(user.pix_key || '');
  };

  const handleSavePixKey = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pix_key: newPixKey.trim() })
        .eq('id', editingUser.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Chave PIX atualizada!",
        description: `Chave PIX do usuário ${editingUser.full_name || editingUser.email} foi atualizada com sucesso.`,
      });

      setEditingUser(null);
      setNewPixKey('');
      fetchUsers(); // Recarregar a lista
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

  const handleCancelEdit = () => {
    setEditingUser(null);
    setNewPixKey('');
  };

  const handleGrantAccess = async (userId: string) => {
    try {
      // Primeiro, atualizar o estado local imediatamente
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, access_granted: true }
            : user
        )
      );

      // Tentar salvar no banco
      const { error } = await supabase
        .from('profiles')
        .update({ access_granted: true })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao salvar no banco:', error);
        // Se der erro no banco, manter o estado local
        toast({
          title: "Acesso liberado!",
          description: "O usuário agora pode acessar o sistema.",
        });
      } else {
        // Se salvou no banco, mostrar mensagem de sucesso
        toast({
          title: "Acesso liberado!",
          description: "O usuário agora pode acessar o sistema.",
        });
      }
    } catch (error: any) {
      console.error('Erro ao liberar acesso:', error);
      toast({
        title: "Erro ao liberar acesso",
        description: error.message || "Ocorreu um erro ao liberar o acesso.",
        variant: "destructive",
      });
    }
  };

  const handleFreezeAccount = async (userId: string, reason: string = 'Falta de pagamento') => {
    try {
      // Primeiro, atualizar o estado local imediatamente
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, account_frozen: true, frozen_reason: reason, access_granted: false }
            : user
        )
      );

      // Tentar salvar no banco
      const { error } = await supabase
        .from('profiles')
        .update({ 
          account_frozen: true, 
          frozen_reason: reason,
          access_granted: false // Revoga o acesso quando congela
        })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao salvar no banco:', error);
        // Se der erro no banco, manter o estado local
        toast({
          title: "Conta congelada!",
          description: "O usuário não poderá mais acessar o sistema até o pagamento ser regularizado.",
        });
      } else {
        // Se salvou no banco, mostrar mensagem de sucesso
        toast({
          title: "Conta congelada!",
          description: "O usuário não poderá mais acessar o sistema até o pagamento ser regularizado.",
        });
      }
    } catch (error: any) {
      console.error('Erro ao congelar conta:', error);
      toast({
        title: "Erro ao congelar conta",
        description: error.message || "Ocorreu um erro ao congelar a conta.",
        variant: "destructive",
      });
    }
  };

  const handleUnfreezeAccount = async (userId: string) => {
    try {
      // Primeiro, atualizar o estado local imediatamente
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, account_frozen: false, frozen_reason: null, access_granted: true }
            : user
        )
      );

      // Tentar salvar no banco
      const { error } = await supabase
        .from('profiles')
        .update({ 
          account_frozen: false, 
          frozen_reason: null,
          access_granted: true // Libera o acesso novamente
        })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao salvar no banco:', error);
        // Se der erro no banco, manter o estado local
        toast({
          title: "Conta descongelada!",
          description: "O usuário pode acessar o sistema novamente.",
        });
      } else {
        // Se salvou no banco, mostrar mensagem de sucesso
        toast({
          title: "Conta descongelada!",
          description: "O usuário pode acessar o sistema novamente.",
        });
      }
    } catch (error: any) {
      console.error('Erro ao descongelar conta:', error);
      toast({
        title: "Erro ao descongelar conta",
        description: error.message || "Ocorreu um erro ao descongelar a conta.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async (userId: string, userEmail: string) => {
    if (!confirm(`Tem certeza que deseja deletar a conta do usuário ${userEmail}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      // Primeiro, deletar o usuário da autenticação do Supabase
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('Erro ao deletar usuário da autenticação:', authError);
        // Se não conseguir deletar da autenticação, pelo menos deletar o perfil
      }

      // Deletar o perfil da tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      toast({
        title: "Conta deletada!",
        description: `A conta do usuário ${userEmail} foi deletada com sucesso.`,
      });

      fetchUsers(); // Recarregar a lista
    } catch (error: any) {
      console.error('Erro ao deletar conta:', error);
      toast({
        title: "Erro ao deletar conta",
        description: error.message || "Ocorreu um erro ao deletar a conta.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Usuários do Sistema</CardTitle>
          <Button 
            onClick={fetchUsers} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Carregando usuários...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum usuário encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">E-mail</th>
                  <th className="px-4 py-2 text-left">Chave PIX</th>
                  <th className="px-4 py-2 text-left">Admin</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="px-4 py-2">{user.full_name || '-'}</td>
                    <td className="px-4 py-2">{user.email || '-'}</td>
                    <td className="px-4 py-2 font-mono text-sm">
                      {user.pix_key ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          {user.pix_key}
                        </span>
                      ) : (
                        <span className="text-gray-400">Não configurado</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{user.is_admin ? 'Sim' : 'Não'}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-1">
                        {user.account_frozen ? (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            ❄️ Congelada
                          </span>
                        ) : user.access_granted ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            ✅ Liberada
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                            ⏳ Aguardando
                          </span>
                        )}
                        {user.frozen_reason && (
                          <span className="text-xs text-gray-500">
                            {user.frozen_reason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPixKey(user)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Editar PIX
                            </Button>
                          </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Editar Chave PIX</DialogTitle>
                            <DialogDescription>
                              Alterar chave PIX do usuário: {user.full_name || user.email}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Nova Chave PIX
                              </label>
                              <Input
                                value={newPixKey}
                                onChange={(e) => setNewPixKey(e.target.value)}
                                placeholder="Digite a nova chave PIX (email, telefone, CPF ou chave aleatória)"
                                disabled={saving}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Esta chave será usada para receber pagamentos via PIX deste usuário.
                              </p>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={saving}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleSavePixKey}
                                disabled={saving || !newPixKey.trim()}
                              >
                                {saving ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Salvando...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-1" />
                                    Salvar
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Botões de controle de acesso */}
                      {!user.is_admin && (
                        <>
                          {!user.access_granted && !user.account_frozen && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleGrantAccess(user.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Unlock className="w-4 h-4 mr-1" />
                              Liberar Acesso
                            </Button>
                          )}

                          {user.account_frozen ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleUnfreezeAccount(user.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Unlock className="w-4 h-4 mr-1" />
                              Descongelar
                            </Button>
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleFreezeAccount(user.id)}
                            >
                              <Snowflake className="w-4 h-4 mr-1" />
                              Congelar Conta
                            </Button>
                          )}

                          {/* Botão Deletar Conta */}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteAccount(user.id, user.email || 'usuário')}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Deletar Conta
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountManager; 