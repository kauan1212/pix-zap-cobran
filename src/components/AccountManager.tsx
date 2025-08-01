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

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company: string;
  is_admin: boolean;
  access_granted: boolean;
  account_frozen: boolean;
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

  // Buscar todos os usuários
  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, company, is_admin, access_granted, account_frozen')
      .order('full_name', { ascending: true });
    if (error) {
      toast({ title: 'Erro ao buscar usuários', description: error.message, variant: 'destructive' });
    } else {
      setUsers(data || []);
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
    const { error } = await supabase
      .from('profiles')
      .update({ account_frozen: !user.account_frozen })
      .eq('id', user.id);
    if (error) {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: user.account_frozen ? 'Conta descongelada!' : 'Conta congelada!' });
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

  // Deletar usuário
  const handleDeleteUser = async (user: UserProfile) => {
    if (!window.confirm(`Tem certeza que deseja deletar o usuário ${user.full_name} (${user.email})? Essa ação não pode ser desfeita!`)) {
      return;
    }
    // Remove do profiles
    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
    if (error) {
      toast({ title: 'Erro ao deletar usuário', description: error.message, variant: 'destructive' });
      return;
    }
    // (Opcional) Remove do Auth (se você tiver função RPC para isso, pode chamar aqui)
    toast({ title: 'Usuário deletado com sucesso!' });
    fetchUsers();
  };

  return (
    <div className="space-y-8">
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
            <Input type="text" placeholder="Nome completo" value={newUserData.fullName} onChange={e => setNewUserData({ ...newUserData, fullName: e.target.value })} required />
            <Input type="text" placeholder="Empresa" value={newUserData.company} onChange={e => setNewUserData({ ...newUserData, company: e.target.value })} />
            <Input type="email" placeholder="Email" value={newUserData.email} onChange={e => setNewUserData({ ...newUserData, email: e.target.value })} required />
            <Input type="password" placeholder="Senha" value={newUserData.password} onChange={e => setNewUserData({ ...newUserData, password: e.target.value })} required />
            <Input type="password" placeholder="Confirmar senha" value={newUserData.confirmPassword} onChange={e => setNewUserData({ ...newUserData, confirmPassword: e.target.value })} required />
            <DialogFooter>
              <Button type="submit" disabled={creatingUser}>{creatingUser ? "Criando..." : "Criar"}</Button>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Listagem de usuários */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Nome</th>
              <th className="p-2">Empresa</th>
              <th className="p-2">Email</th>
              <th className="p-2">Admin</th>
              <th className="p-2">Acesso</th>
              <th className="p-2">Congelada</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loadingUsers ? (
              <tr><td colSpan={7} className="text-center p-4">Carregando...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-4">Nenhum usuário encontrado.</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className={user.account_frozen ? 'bg-red-50' : ''}>
                <td className="p-2 font-medium">{user.full_name}</td>
                <td className="p-2">{user.company}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2 text-center">{user.is_admin ? '✅' : ''}</td>
                <td className="p-2 text-center">{user.access_granted ? '✅' : '❌'}</td>
                <td className="p-2 text-center">{user.account_frozen ? '❄️' : ''}</td>
                <td className="p-2 space-x-2">
                  <Button size="sm" variant={user.account_frozen ? 'outline' : 'destructive'} onClick={() => handleToggleFrozen(user)}>
                    {user.account_frozen ? 'Descongelar' : 'Congelar'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditModal(user)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user)}>
                    Deletar
                  </Button>
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
              <Input type="text" placeholder="Nome completo" value={editUserData.full_name} onChange={e => setEditUserData({ ...editUserData, full_name: e.target.value })} required />
              <Input type="text" placeholder="Empresa" value={editUserData.company} onChange={e => setEditUserData({ ...editUserData, company: e.target.value })} />
              <Input type="email" placeholder="Email" value={editUserData.email} onChange={e => setEditUserData({ ...editUserData, email: e.target.value })} required />
              <DialogFooter>
                <Button type="submit">Salvar</Button>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountManager;