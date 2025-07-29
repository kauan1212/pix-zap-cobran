import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { emitEvent } from '@/hooks/useEventBus';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, company: string) => Promise<boolean>;
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
        // Se o erro for sobre email não confirmado, tentar fazer login mesmo assim
        if (error.message.includes('Email not confirmed') || error.message.includes('Email não confirmado')) {
          toast({
            title: "Email não confirmado",
            description: "Tentando fazer login mesmo assim...",
          });
          
          // Tentar fazer login novamente após um delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (retryError) {
            toast({
              title: "Erro no login",
              description: "Entre em contato com o administrador para liberar sua conta.",
              variant: "destructive",
            });
            return false;
          }
          
          // Se conseguiu fazer login na segunda tentativa
          if (retryData.user) {
            const accessControl = await checkAccessControl(retryData.user.id);
            
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
            
            toast({
              title: "Login realizado com sucesso!",
              description: `Bem-vindo de volta!`,
            });
            return true;
          }
        } else {
          toast({
            title: "Erro no login",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
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

  const register = async (email: string, password: string, name: string, company: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            company: company,
          }
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
        description: "Aguarde a liberação pelo administrador para ter acesso à conta",
      });

      // Aguarda o perfil ser criado pelo trigger antes de atualizar a chave Pix
      if (data.user) {
        const defaultPixKey = data.user.email || `user-${data.user.id.substring(0, 8)}`;
        let tentativas = 0;
        let perfilExiste = false;
        
        console.log('🔄 Aguardando perfil ser criado para:', data.user.email);
        
        while (tentativas < 20 && !perfilExiste) { // Aumentei para 20 tentativas
          const { data: perfil, error } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('id', data.user.id)
            .single();
          
          console.log(`Tentativa ${tentativas + 1}:`, { perfil, error });
          
          if (perfil) {
            perfilExiste = true;
            console.log('✅ Perfil encontrado:', perfil);
          } else {
            await new Promise(res => setTimeout(res, 300)); // Reduzi para 300ms
            tentativas++;
          }
        }
        
        if (perfilExiste) {
          console.log('🔄 Atualizando perfil com dados de controle de acesso...');
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              pix_key: defaultPixKey,
              access_granted: false, // Por padrão, acesso não liberado
              account_frozen: false,
              frozen_reason: null
            })
            .eq('id', data.user.id);
          
          if (updateError) {
            console.error('❌ Erro ao atualizar perfil:', updateError);
          } else {
            console.log('✅ Perfil atualizado com sucesso');
          }
          
          // Emitir evento para notificar que uma nova conta foi criada
          console.log('📡 Emitindo evento de nova conta criada');
          emitEvent('newUserCreated', data.user);
        } else {
          console.error('❌ Perfil não foi criado após 20 tentativas');
        }
      }

      // Fazer login automático após registro bem-sucedido
      if (data.user) {
        // Aguardar um pouco para garantir que o perfil foi criado
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error('Erro no login automático:', signInError);
          // Se der erro no login automático, mostrar mensagem para fazer login manual
          toast({
            title: "Conta criada!",
            description: "Faça login com seu email e senha para acessar o sistema.",
          });
        } else {
          // Login automático bem-sucedido
          toast({
            title: "Login realizado!",
            description: "Aguarde a liberação pelo administrador para ter acesso completo.",
          });
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
