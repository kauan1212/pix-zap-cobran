import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AdminCheck: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
      } else {
        setProfile(data);
        console.log('Perfil carregado:', data);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const setAsAdmin = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao definir como admin:', error);
        alert('Erro: ' + error.message);
      } else {
        console.log('Usuário definido como admin!');
        alert('Usuário definido como admin! Recarregue a página.');
        loadProfile();
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro: ' + error);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  if (!user) return null;

  return (
    <Card className="mb-4 border-red-500">
      <CardHeader>
        <CardTitle className="text-red-600">🔧 VERIFICAÇÃO DE ADMIN</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Loading:</strong> {loading ? 'Sim' : 'Não'}</p>
          
          {profile && (
            <>
              <p><strong>is_admin:</strong> {profile.is_admin ? '✅ SIM' : '❌ NÃO'}</p>
              <p><strong>access_granted:</strong> {profile.access_granted ? '✅ SIM' : '❌ NÃO'}</p>
              <p><strong>account_frozen:</strong> {profile.account_frozen ? '❌ SIM' : '✅ NÃO'}</p>
            </>
          )}
          
          <div className="mt-4 space-x-2">
            <Button onClick={setAsAdmin} className="bg-red-600 hover:bg-red-700">
              🔧 DEFINIR COMO ADMIN
            </Button>
            
            <Button onClick={loadProfile} variant="outline">
              🔄 Recarregar
            </Button>
          </div>
          
          <div className="mt-4 p-2 bg-yellow-100 border border-yellow-400 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Instruções:</strong><br/>
              1. Clique em "DEFINIR COMO ADMIN"<br/>
              2. Recarregue a página (F5)<br/>
              3. A aba "Controle de Contas" deve aparecer
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCheck; 