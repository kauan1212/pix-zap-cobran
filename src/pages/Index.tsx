
import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';

const AppContent = () => {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (user) {
    return <Dashboard />;
  }

  return (
    <LoginForm 
      onToggleMode={() => setIsLogin(!isLogin)} 
      isLogin={isLogin} 
    />
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
