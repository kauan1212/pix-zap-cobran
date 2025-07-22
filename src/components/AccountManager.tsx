import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  pix_key: string | null;
  is_admin: boolean | null;
}

const AccountManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newPixKey, setNewPixKey] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, pix_key, is_admin')
      .order('full_name', { ascending: true });
    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários do Sistema</CardTitle>
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