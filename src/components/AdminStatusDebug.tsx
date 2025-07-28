import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AdminStatusDebug: React.FC = () => {
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
        .update({ 
          is_admin: true,
          access_granted: true,
          account_frozen: false
        })
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao definir como admin:', error);
      } else {
        console.log('Usuário definido como admin!');
        loadProfile(); // Recarregar perfil
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  if (!user) return null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Debug - Status de Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Loading:</strong> {loading ? 'Sim' : 'Não'}</p>
          
          {profile && (
            <>
              <p><strong>is_admin:</strong> {profile.is_admin ? 'Sim' : 'Não'}</p>
              <p><strong>access_granted:</strong> {profile.access_granted ? 'Sim' : 'Não'}</p>
              <p><strong>account_frozen:</strong> {profile.account_frozen ? 'Sim' : 'Não'}</p>
              <p><strong>full_name:</strong> {profile.full_name || 'N/A'}</p>
            </>
          )}
          
          <Button onClick={setAsAdmin} className="mt-4">
            Definir como Admin
          </Button>
          
          <Button onClick={loadProfile} variant="outline" className="ml-2">
            Recarregar Perfil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminStatusDebug; 