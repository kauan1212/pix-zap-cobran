const handleCreateUser = async (e: React.FormEvent) => {
  e.preventDefault();
  setCreatingUser(true);

  try {
    const res = await fetch('/api/createUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newUserData.email,
        password: newUserData.password,
        full_name: newUserData.fullName,
        company: newUserData.company
      })
    });

    const result = await res.json();

    if (!res.ok) throw new Error(result.error || 'Erro ao criar usuário');

    toast({
      title: "Conta criada com sucesso!",
      description: `A conta do usuário ${newUserData.email} foi criada. O usuário pode fazer login após ser aprovado.`,
    });

    setShowCreateUserModal(false);
    // ...restante do seu código
  } catch (err: any) {
    toast({
      title: "Erro ao criar usuário",
      description: err.message,
      variant: "destructive",
    });
  } finally {
    setCreatingUser(false);
  }
};

export default AccountManager;