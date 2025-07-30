import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAccessControl: (userId: string) => Promise<{ accessGranted: boolean; accountFrozen: boolean; frozenReason?: string }>;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      // Verificar controle de acesso após login bem-sucedido
      if (data.user) {
        const accessControl = await checkAccessControl(data.user.id);
        
        if (!accessControl.accessGranted) {
          toast({
            title: "Acesso não autorizado",
            description: "Sua conta ainda não foi liberada pelo administrador. Entre em contato para regularizar sua situação.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          return false;
        }

        if (accessControl.accountFrozen) {
          toast({
            title: "Conta congelada",
            description: accessControl.frozenReason || "Sua conta foi congelada por falta de pagamento. Entre em contato para regularizar sua situação.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          return false;
        }
      }

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo de volta!`,
      });
      return true;
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: undefined
        }
      });

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      // Se não houve erro, o usuário foi criado com sucesso
      toast({
        title: "Conta criada com sucesso!",
        description: "Aguarde a confirmação do administrador para ter acesso à conta",
      });

      // Aguarda o perfil ser criado pelo trigger antes de atualizar a chave Pix
      if (data.user) {
        const defaultPixKey = data.user.email || `user-${data.user.id.substring(0, 8)}`;
        let tentativas = 0;
        let perfilExiste = false;
        while (tentativas < 10 && !perfilExiste) {
          const { data: perfil } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();
          if (perfil) {
            perfilExiste = true;
          } else {
            await new Promise(res => setTimeout(res, 500)); // espera 0,5s
            tentativas++;
          }
        }
        if (perfilExiste) {
          await supabase
            .from('profiles')
            .update({ 
              pix_key: defaultPixKey,
              access_granted: false, // Por padrão, acesso não liberado
              account_frozen: false,
              frozen_reason: null
            })
            .eq('id', data.user.id);
        }
      }

      return true;
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
      return false;
    }
  };

  const checkAccessControl = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('access_granted, account_frozen, frozen_reason')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao verificar controle de acesso:', error);
        return { accessGranted: false, accountFrozen: false };
      }

      return {
        accessGranted: data?.access_granted ?? false,
        accountFrozen: data?.account_frozen ?? false,
        frozenReason: data?.frozen_reason
      };
    } catch (error) {
      console.error('Erro ao verificar controle de acesso:', error);
      return { accessGranted: false, accountFrozen: false };
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro no logout",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      checkAccessControl,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
