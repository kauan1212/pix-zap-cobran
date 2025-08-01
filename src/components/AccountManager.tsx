import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company: string | null;
  is_admin: boolean;
  access_granted: boolean;
  account_frozen: boolean;
  frozen_reason: string | null;
}

const AccountManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Estados para criar usuário
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    company: ''
  });

  // Buscar usuários
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

  // Criar usuário novo
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.full_name || !newUser.email || !newUser.password) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    // Criação de usuário via Supabase Auth + insert no profiles
    const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password
    });
    if (signUpError) {
      toast({ title: 'Erro ao criar usuário', description: signUpError.message, variant: 'destructive' });
      return;
    }
    // Atualiza o profile com nome e empresa
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: newUser.full_name,
        company: newUser.company
      })
      .eq('id', signUpData.user?.id);
    if (profileError) {
      toast({ title: 'Usuário criado, mas erro ao salvar perfil', description: profileError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Usuário criado com sucesso!' });
    }
    setShowCreate(false);
    setNewUser({ full_name: '', email: '', password: '', company: '' });
    fetchUsers();
  };

  // Bloquear/liberar acesso
  const handleToggleAccess = async (user: UserProfile) => {
    const { error } = await supabase
      .from('profiles')
      .update({ access_granted: !user.access_granted })
      .eq('id', user.id);
    if (error) {
      toast({ title: 'Erro ao atualizar acesso', description: error.message, variant: 'destructive' });
    } else {
      fetchUsers();
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
      fetchUsers();
    }
  };

  // Deletar usuário
  const handleDeleteUser = async (user: UserProfile) => {
    if (!window.confirm(`Tem certeza que deseja deletar ${user.full_name}?`)) return;
    // Deleta do Auth
    const { error: deleteError } = await supabase.rpc('delete_user_complete', { user_email: user.email });
    if (deleteError) {
      toast({ title: 'Erro ao deletar usuário', description: deleteError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Usuário deletado com sucesso!' });
      fetchUsers();
    }
  };

  return (
    <div>
      <h2>Controle de Contas</h2>
      <button
        style={{
          marginBottom: 16,
          background: '#b3e0ff',
          border: 'none',
          borderRadius: 4,
          padding: '8px 16px',
          cursor: 'pointer'
        }}
        onClick={() => setShowCreate(true)}
      >
        Criar Novo Usuário
      </button>

      {/* Modal simples para criar usuário */}
      {showCreate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <form
            onSubmit={handleCreateUser}
            style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320 }}
          >
            <h3>Criar novo usuário</h3>
            <div>
              <label>Nome completo*</label>
              <input
                type="text"
                value={newUser.full_name}
                onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                required
                style={{ width: '100%', marginBottom: 8 }}
              />
            </div>
            <div>
              <label>Email*</label>
              <input
                type="email"
                value={newUser.email}
                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                required
                style={{ width: '100%', marginBottom: 8 }}
              />
            </div>
            <div>
              <label>Senha*</label>
              <input
                type="password"
                value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                required
                style={{ width: '100%', marginBottom: 8 }}
              />
            </div>
            <div>
              <label>Empresa</label>
              <input
                type="text"
                value={newUser.company}
                onChange={e => setNewUser({ ...newUser, company: e.target.value })}
                style={{ width: '100%', marginBottom: 8 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button type="submit" style={{ background: '#b3e0ff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>Criar</button>
            </div>
          </form>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Admin</th>
            <th>Acesso</th>
            <th>Congelada</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {loadingUsers ? (
            <tr><td colSpan={6}>Carregando...</td></tr>
          ) : users.length === 0 ? (
            <tr><td colSpan={6}>Nenhum usuário encontrado.</td></tr>
          ) : users.map(user => (
            <tr key={user.id}>
              <td>{user.full_name}</td>
              <td>{user.email}</td>
              <td>{user.is_admin ? '✅' : ''}</td>
              <td>{user.access_granted ? '✅' : '❌'}</td>
              <td>{user.account_frozen ? '❄️' : ''}</td>
              <td>
                <button
                  style={{
                    marginRight: 4,
                    background: user.access_granted ? '#ffb3b3' : '#b3ffb3',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleToggleAccess(user)}
                >
                  {user.access_granted ? 'Bloquear' : 'Liberar'}
                </button>
                <button
                  style={{
                    marginRight: 4,
                    background: user.account_frozen ? '#b3e0ff' : '#ffd6b3',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleToggleFrozen(user)}
                >
                  {user.account_frozen ? 'Descongelar' : 'Congelar'}
                </button>
                <button
                  style={{
                    background: '#ffb3b3',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleDeleteUser(user)}
                >
                  Deletar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccountManager;