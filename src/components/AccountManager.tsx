import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, Shield, Lock, Unlock, Edit, Trash2, Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company?: string | null;
  pix_key?: string | null;
  is_admin: boolean;
  access_granted: boolean;
  account_frozen: boolean;
  frozen_reason: string | null;
  created_at?: string;
  updated_at?: string;
}

const AccountManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Estados para criar usuário
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    company: ''
  });

  // Estados para editar usuário
  const [showEdit, setShowEdit] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    company: ''
  });

  // Buscar usuários usando a função RPC
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase.rpc('get_all_profiles');

      if (error) {
        toast({ 
          title: 'Erro ao buscar usuários', 
          description: error.message, 
          variant: 'destructive' 
        });
      } else {
        setUsers(data || []);
      }
    } catch (err: any) {
      toast({ 
        title: 'Erro ao buscar usuários', 
        description: err.message, 
        variant: 'destructive' 
      });
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Criar usuário novo usando a função RPC
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.full_name || !newUser.email || !newUser.password) {
      toast({ 
        title: 'Preencha todos os campos obrigatórios', 
        variant: 'destructive' 
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.rpc('create_user_with_profile', {
        user_email: newUser.email,
        user_password: newUser.password,
        user_full_name: newUser.full_name,
        user_company: newUser.company || null
      });

      if (error) {
        toast({ 
          title: 'Erro ao criar usuário', 
          description: error.message, 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Usuário criado com sucesso!', 
          description: 'O usuário foi criado e precisa ter o acesso liberado.' 
        });
        setShowCreate(false);
        setNewUser({ full_name: '', email: '', password: '', company: '' });
        fetchUsers();
      }
    } catch (err: any) {
      toast({ 
        title: 'Erro ao criar usuário', 
        description: err.message, 
        variant: 'destructive' 
      });
    }
    setIsCreating(false);
  };

  // Bloquear/liberar acesso
  const handleToggleAccess = async (user: UserProfile) => {
    setActionLoading(`access-${user.id}`);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ access_granted: !user.access_granted })
        .eq('id', user.id);
      
      if (error) {
        toast({ 
          title: 'Erro ao atualizar acesso', 
          description: error.message, 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: user.access_granted ? 'Acesso bloqueado' : 'Acesso liberado',
          description: `${user.full_name} ${user.access_granted ? 'não' : ''} pode mais acessar o sistema.`
        });
        fetchUsers();
      }
    } catch (err: any) {
      toast({ 
        title: 'Erro ao atualizar acesso', 
        description: err.message, 
        variant: 'destructive' 
      });
    }
    setActionLoading(null);
  };

  // Editar usuário
  const handleEditUser = (user: UserProfile) => {
    setEditUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      company: user.company || ''
    });
    setShowEdit(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser || !editForm.full_name || !editForm.email) {
      toast({ 
        title: 'Preencha todos os campos obrigatórios', 
        variant: 'destructive' 
      });
      return;
    }

    setActionLoading(`edit-${editUser.id}`);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: editForm.full_name,
          email: editForm.email,
          company: editForm.company || null
        })
        .eq('id', editUser.id);
      
      if (error) {
        toast({ 
          title: 'Erro ao editar usuário', 
          description: error.message, 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Usuário editado com sucesso!',
          description: `Os dados de ${editForm.full_name} foram atualizados.`
        });
        setShowEdit(false);
        setEditUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      toast({ 
        title: 'Erro ao editar usuário', 
        description: err.message, 
        variant: 'destructive' 
      });
    }
    setActionLoading(null);
  };

  // Deletar usuário
  const handleDeleteUser = async (user: UserProfile) => {
    setActionLoading(`delete-${user.id}`);
    try {
      const { data, error } = await supabase.rpc('delete_user_complete', { 
        user_email: user.email 
      });
      
      if (error) {
        toast({ 
          title: 'Erro ao deletar usuário', 
          description: error.message, 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Usuário deletado com sucesso!',
          description: `${user.full_name} foi removido completamente do sistema.`
        });
        fetchUsers();
      }
    } catch (err: any) {
      toast({ 
        title: 'Erro ao deletar usuário', 
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Controle de Contas
            </CardTitle>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Criar Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      type="text"
                      value={newUser.full_name}
                      onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                      required
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                      required
                      placeholder="Digite o email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      required
                      placeholder="Digite a senha"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      type="text"
                      value={newUser.company}
                      onChange={e => setNewUser({ ...newUser, company: e.target.value })}
                      placeholder="Digite a empresa (opcional)"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreate(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Criar Usuário
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Carregando usuários...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Nome</th>
                      <th className="text-left p-4 font-medium">Email</th>
                      <th className="text-center p-4 font-medium">Admin</th>
                      <th className="text-center p-4 font-medium">Acesso</th>
                      <th className="text-center p-4 font-medium">Empresa</th>
                      <th className="text-center p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr 
                        key={user.id} 
                        className={`border-b transition-colors hover:bg-muted/20 ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                        }`}
                      >
                        <td className="p-4">
                          <div className="font-medium">{user.full_name}</div>
                          {user.company && (
                            <div className="text-sm text-muted-foreground">{user.company}</div>
                          )}
                        </td>
                        <td className="p-4 text-sm">{user.email}</td>
                        <td className="p-4 text-center">
                          {user.is_admin ? (
                            <Badge variant="default" className="bg-purple-100 text-purple-800">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {user.access_granted ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <Unlock className="w-3 h-3 mr-1" />
                              Liberado
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <Lock className="w-3 h-3 mr-1" />
                              Bloqueado
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-sm">{user.company || '-'}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant={user.access_granted ? "destructive" : "default"}
                              disabled={actionLoading === `access-${user.id}`}
                              onClick={() => handleToggleAccess(user)}
                              className="h-8 px-2 text-xs"
                            >
                              {actionLoading === `access-${user.id}` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : user.access_granted ? (
                                <Lock className="w-3 h-3" />
                              ) : (
                                <Unlock className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoading === `edit-${user.id}`}
                              onClick={() => handleEditUser(user)}
                              className="h-8 px-2 text-xs"
                            >
                              {actionLoading === `edit-${user.id}` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Edit className="w-3 h-3" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={actionLoading === `delete-${user.id}`}
                                  className="h-8 px-2 text-xs"
                                >
                                  {actionLoading === `delete-${user.id}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja deletar permanentemente a conta de{' '}
                                    <strong>{user.full_name}</strong>? Esta ação não pode ser desfeita 
                                    e todos os dados do usuário serão removidos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Deletar Usuário
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

      {/* Modal de Edição */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Nome Completo *</Label>
              <Input
                id="edit_full_name"
                type="text"
                value={editForm.full_name}
                onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                required
                placeholder="Digite o nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email *</Label>
              <Input
                id="edit_email"
                type="email"
                value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                required
                placeholder="Digite o email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_company">Empresa</Label>
              <Input
                id="edit_company"
                type="text"
                value={editForm.company}
                onChange={e => setEditForm({ ...editForm, company: e.target.value })}
                placeholder="Digite a empresa (opcional)"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEdit(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={actionLoading === `edit-${editUser?.id}`}>
                {actionLoading === `edit-${editUser?.id}` && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountManager;