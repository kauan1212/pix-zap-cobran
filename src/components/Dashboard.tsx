
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Users, Receipt, CreditCard, Settings, Repeat } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ClientManager from './ClientManager';
import BillingManager from './BillingManager';
import PixKeyManager from './PixKeyManager';
import RecurringPlansManager from './RecurringPlansManager';
import SubscriptionManager from './SubscriptionManager';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('clients');
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  const loadClients = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('clients')
      .select('id, name, email, phone')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading clients:', error);
    } else {
      setClients(data || []);
    }
  };

  const handleDataChange = () => {
    loadClients();
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar sair da conta.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₿</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PIX Zap Cobrança
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Olá, {user?.email}</span>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="clients" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="billings" className="flex items-center space-x-2">
              <Receipt className="w-4 h-4" />
              <span>Cobranças</span>
            </TabsTrigger>
            <TabsTrigger value="auto-billing" className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Automático</span>
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex items-center space-x-2">
              <Repeat className="w-4 h-4" />
              <span>Planos</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Assinaturas</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>PIX</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            <ClientManager onDataChange={handleDataChange} />
          </TabsContent>

          <TabsContent value="billings">
            <BillingManager clients={clients} onDataChange={handleDataChange} />
          </TabsContent>

          <TabsContent value="auto-billing">
            <AutoBillingManager clients={clients} onDataChange={handleDataChange} />
          </TabsContent>

          <TabsContent value="recurring">
            <RecurringPlansManager clients={clients} onDataChange={handleDataChange} />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionManager clients={clients} onDataChange={handleDataChange} />
          </TabsContent>

          <TabsContent value="settings">
            <PixKeyManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
