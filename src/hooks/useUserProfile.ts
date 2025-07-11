import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  pix_key: string | null;
  is_admin: boolean | null;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      supabase
        .from('profiles')
        .select('id, email, full_name, pix_key, is_admin')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setProfile(data);
          } else {
            setProfile(null);
          }
          setLoading(false);
        });
    } else {
      setProfile(null);
    }
  }, [user]);

  // Função para atualizar a chave PIX
  const updatePixKey = async (pixKey: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from('profiles')
      .update({ pix_key: pixKey })
      .eq('id', user.id);
    if (!error) {
      setProfile((prev) => prev ? { ...prev, pix_key: pixKey } : prev);
      return true;
    }
    return false;
  };

  return { profile, loading, updatePixKey };
} 