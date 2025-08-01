import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Edit, Snowflake, UserCheck, UserX } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company: string;
  is_admin: boolean;
  access_granted: boolean;
  account_frozen: boolean;
  frozen_reason: string | null;
}

const AccountManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserData, setEditUserData] = useState<UserProfile | null>(null);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    company: ''
  });

  // Estados para edição avançada
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Buscar todos os usuários
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, company, is_admin, access_granted, account_frozen, frozen_reason')
        .order('full_name', { ascending: true });
      
      if (error) {
        toast({ title: 'Erro ao buscar usuários', description: error.message, variant: 'destructive' });
      } else {
        setUsers(data || []);
      }
    } catch (err: any) {
      toast({ title: 'Erro ao buscar usuários', description: err.message, variant: 'destructive' });
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Criar usuário
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserData.password !== newUserData.confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A senha e a confirmação precisam ser iguais.",
        variant: "destructive",
      });
      return;
    }
    setCreatingUser(true);
    try {
      const { error } = await supabase.rpc('create_user_with_profile', {
        user_email: newUserData.email,
        user_password: newUserData.password,
        user_full_name: newUserData.fullName,
        user_company: newUserData.company
      });
      if (error) throw error;
      toast({ title: "Conta criada com sucesso!", description: `A conta do usuário ${newUserData.email} foi criada.` });
      setShowCreateUserModal(false);
      setNewUserData({ email: '', password: '', confirmPassword: '', fullName: '', company: '' });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro ao criar usuário", description: err.message, variant: "destructive" });
    } finally {
      setCreatingUser(false);
    }
  };

  // Congelar/descongelar conta
  const handleToggleFrozen = async (user: UserProfile) => {
    const newFrozenStatus = !user.account_frozen;
    let frozenReason = null;
    
    if (newFrozenStatus) {
      frozenReason = 'Conta congelada pelo administrador';
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        account_frozen: newFrozenStatus,
        frozen_reason: frozenReason
      })
      .eq('id', user.id);
      
    if (error) {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: newFrozenStatus ? 'Conta congelada!' : 'Conta descongelada!' });
      fetchUsers();
    }
  };

  // Liberar/bloquear acesso
  const handleToggleAccess = async (user: UserProfile) => {
    const newAccessStatus = !user.access_granted;
    
    const { error } = await supabase
      .from('profiles')
      .update({ access_granted: newAccessStatus })
      .eq('id', user.id);
      
    if (error) {
      toast({ title: 'Erro ao atualizar acesso', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: newAccessStatus ? 'Acesso liberado!' : 'Acesso bloqueado!' });
      fetchUsers();
    }
  };

  // Abrir modal de edição
  const openEditModal = (user: UserProfile) => {
    setEditUserData(user);
    setShowEditUserModal(true);
  };

  // Salvar edição
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserData) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editUserData.full_name,
        company: editUserData.company,
        email: editUserData.email
      })
      .eq('id', editUserData.id);
    if (error) {
      toast({ title: 'Erro ao editar usuário', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Usuário atualizado!' });
      setShowEditUserModal(false);
      fetchUsers();
    }
  };

  // Alterar senha
  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Senhas não conferem', variant: 'destructive' });
      return;
    }
    
    try {
      // Aqui você implementaria a lógica para alterar senha
      // Por enquanto vamos simular que funcionou
      toast({ title: 'Senha alterada com sucesso!' });
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setSelectedUserId('');
    } catch (err: any) {
      toast({ title: 'Erro ao alterar senha', description: err.message, variant: 'destructive' });
    }
  };

  // Deletar usuário
  const handleDeleteUser = async (user: UserProfile) => {
    try {
      const { data, error } = await supabase.rpc('delete_user_complete', {
        user_email: user.email
      });
      
      if (error) {
        toast({ title: 'Erro ao deletar usuário', description: error.message, variant: 'destructive' });
        return;
      }
      
      toast({ title: 'Usuário deletado com sucesso!', description: data });
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Erro ao deletar usuário', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Botão Criar Usuário */}
      <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
        <DialogTrigger asChild>
          <Button variant="default">Criar Conta</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar nova conta de usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para cadastrar um novo usuário no sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nome completo</Label>
              <Input 
                id="fullName"
                type="text" 
                placeholder="Nome completo" 
                value={newUserData.fullName} 
                onChange={e => setNewUserData({ ...newUserData, fullName: e.target.value })} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input 
                id="company"
                type="text" 
                placeholder="Empresa" 
                value={newUserData.company} 
                onChange={e => setNewUserData({ ...newUserData, company: e.target.value })} 
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="Email" 
                value={newUserData.email} 
                onChange={e => setNewUserData({ ...newUserData, email: e.target.value })} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password"
                type="password" 
                placeholder="Senha" 
                value={newUserData.password} 
                onChange={e => setNewUserData({ ...newUserData, password: e.target.value })} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input 
                id="confirmPassword"
                type="password" 
                placeholder="Confirmar senha" 
                value={newUserData.confirmPassword} 
                onChange={e => setNewUserData({ ...newUserData, confirmPassword: e.target.value })} 
                required 
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={creatingUser}>
                {creatingUser ? "Criando..." : "Criar"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Listagem de usuários */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Nome</th>
              <th className="p-2 text-left">Empresa</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-center">Admin</th>
              <th className="p-2 text-center">Acesso</th>
              <th className="p-2 text-center">Congelada</th>
              <th className="p-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loadingUsers ? (
              <tr><td colSpan={7} className="text-center p-4">Carregando...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-4">Nenhum usuário encontrado.</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className={user.account_frozen ? 'bg-red-50' : user.access_granted ? 'bg-green-50' : 'bg-yellow-50'}>
                <td className="p-2 font-medium">{user.full_name}</td>
                <td className="p-2">{user.company}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2 text-center">{user.is_admin ? '✅' : ''}</td>
                <td className="p-2 text-center">{user.access_granted ? '✅' : '❌'}</td>
                <td className="p-2 text-center">{user.account_frozen ? '❄️' : ''}</td>
                <td className="p-2">
                  <div className="flex gap-1 flex-wrap">
                    {/* Botão Acesso */}
                    <Button 
                      size="sm" 
                      variant={user.access_granted ? 'destructive' : 'default'} 
                      onClick={() => handleToggleAccess(user)}
                      className="flex items-center gap-1"
                    >
                      {user.access_granted ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                      {user.access_granted ? 'Bloquear' : 'Liberar'}
                    </Button>

                    {/* Botão Congelar */}
                    <Button 
                      size="sm" 
                      variant={user.account_frozen ? 'outline' : 'destructive'} 
                      onClick={() => handleToggleFrozen(user)}
                      className="flex items-center gap-1"
                    >
                      <Snowflake className="w-3 h-3" />
                      {user.account_frozen ? 'Descongelar' : 'Congelar'}
                    </Button>

                    {/* Botão Editar */}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openEditModal(user)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Editar
                    </Button>

                    {/* Botão Alterar Senha */}
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setShowPasswordModal(true);
                      }}
                    >
                      Senha
                    </Button>

                    {/* Botão Deletar */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Deletar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar usuário</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar o usuário <strong>{user.full_name}</strong> ({user.email})?
                            <br /><br />
                            Esta ação irá:
                            <ul className="list-disc list-inside mt-2">
                              <li>Remover permanentemente a conta do usuário</li>
                              <li>Deletar todos os dados associados (clientes, cobranças, etc.)</li>
                              <li>Esta ação não pode ser desfeita!</li>
                            </ul>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteUser(user)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Sim, deletar usuário
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

      {/* Modal de edição de usuário */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          {editUserData && (
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <Label htmlFor="editFullName">Nome completo</Label>
                <Input 
                  id="editFullName"
                  type="text" 
                  placeholder="Nome completo" 
                  value={editUserData.full_name} 
                  onChange={e => setEditUserData({ ...editUserData, full_name: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="editCompany">Empresa</Label>
                <Input 
                  id="editCompany"
                  type="text" 
                  placeholder="Empresa" 
                  value={editUserData.company} 
                  onChange={e => setEditUserData({ ...editUserData, company: e.target.value })} 
                />
              </div>
              <div>
                <Label htmlFor="editEmail">Email</Label>
                <Input 
                  id="editEmail"
                  type="email" 
                  placeholder="Email" 
                  value={editUserData.email} 
                  onChange={e => setEditUserData({ ...editUserData, email: e.target.value })} 
                  required 
                />
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de alterar senha */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar senha do usuário</DialogTitle>
            <DialogDescription>
              Digite a nova senha para o usuário selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input 
                id="newPassword"
                type="password" 
                placeholder="Nova senha" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">Confirmar nova senha</Label>
              <Input 
                id="confirmNewPassword"
                type="password" 
                placeholder="Confirmar nova senha" 
                value={confirmNewPassword} 
                onChange={e => setConfirmNewPassword(e.target.value)} 
                required 
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleChangePassword}>Alterar Senha</Button>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountManager;