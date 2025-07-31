import React, { createContext, useContext, useState, useEffect } from 'react';
// ...outros imports necessários...

// Defina a interface do contexto conforme seu projeto
interface AuthContextType {
  // ...definições...
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // ...seus estados, funções, useEffect, etc...

  // Exemplo de função login (adicione o restante do seu código aqui)
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // ...código anterior...
      if (data.user) {
        console.log('ID do usuário autenticado:', data.user.id); // <--- ADICIONE ESTE LOG
        const accessControl = await checkAccessControl(data.user.id);
        // ...restante do código...
      }
      // ...restante do código...
    } catch (error) {
      // ...restante do código...
    }
  };

  // ...demais funções do contexto...

  return (
    <AuthContext.Provider value={{
      // ...funções e estados exportados...
      login,
      // ...outros exports...
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};