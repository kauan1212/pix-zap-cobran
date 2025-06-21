
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'premium';
  billingCount: number;
  maxBillings: number;
  subscriptionDate?: Date;
  subscriptionExpiry?: Date;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateBillingCount: () => void;
  canCreateBilling: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('cobranca_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulação de login - em produção, fazer chamada para API
    const users = JSON.parse(localStorage.getItem('cobranca_users') || '[]');
    const foundUser = users.find((u: any) => u.email === email && u.password === password);
    
    if (foundUser) {
      const userData: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        plan: foundUser.plan || 'free',
        billingCount: foundUser.billingCount || 0,
        maxBillings: foundUser.plan === 'premium' ? 1000 : 5,
        subscriptionDate: foundUser.subscriptionDate ? new Date(foundUser.subscriptionDate) : undefined,
        subscriptionExpiry: foundUser.subscriptionExpiry ? new Date(foundUser.subscriptionExpiry) : undefined,
      };
      
      setUser(userData);
      localStorage.setItem('cobranca_user', JSON.stringify(userData));
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo(a), ${userData.name}!`,
      });
      return true;
    }
    
    toast({
      title: "Erro no login",
      description: "Email ou senha incorretos",
      variant: "destructive",
    });
    return false;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('cobranca_users') || '[]');
    const existingUser = users.find((u: any) => u.email === email);
    
    if (existingUser) {
      toast({
        title: "Erro no cadastro",
        description: "Este email já está cadastrado",
        variant: "destructive",
      });
      return false;
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      plan: 'free',
      billingCount: 0,
      maxBillings: 5,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('cobranca_users', JSON.stringify(users));
    
    toast({
      title: "Cadastro realizado com sucesso!",
      description: "Você pode fazer login agora",
    });
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cobranca_user');
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  const updateBillingCount = () => {
    if (user) {
      const updatedUser = { ...user, billingCount: user.billingCount + 1 };
      setUser(updatedUser);
      localStorage.setItem('cobranca_user', JSON.stringify(updatedUser));
      
      // Atualizar também no array de usuários
      const users = JSON.parse(localStorage.getItem('cobranca_users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex].billingCount = updatedUser.billingCount;
        localStorage.setItem('cobranca_users', JSON.stringify(users));
      }
    }
  };

  const canCreateBilling = (): boolean => {
    if (!user) return false;
    return user.billingCount < user.maxBillings;
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      updateBillingCount,
      canCreateBilling,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
