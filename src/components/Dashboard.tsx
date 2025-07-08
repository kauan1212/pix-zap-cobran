import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Users, Receipt, CreditCard, Settings, Repeat, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ClientManager from './ClientManager';
import BillingManager from './BillingManager';
import PixKeyManager from './PixKeyManager';
import RecurringPlansManager from './RecurringPlansManager';
import SubscriptionManager from './SubscriptionManager';
import AutoBillingManager from './AutoBillingManager';
import MobileLayout from './MobileLayout';
import ExtraServicesManager from './ExtraServicesManager';

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
    <MobileLayout>
      {/* Header */}
      <header className="bg-background border-b border-border mb-6">
        <div className="flex justify-between items-center h-16 px-4 sm:px-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-lg sm:text-xl text-foreground">
              Minhas finanças - Moto
            </span>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="hidden sm:inline text-muted-foreground text-sm">
              {user?.email}
            </span>
            <Button variant="outline" onClick={handleLogout} size="sm" className="mobile-button">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile-optimized tab navigation */}
          <div className="w-full overflow-x-auto scrollbar-hide">
            <TabsList className="grid w-max grid-cols-5 min-w-full">
              <TabsTrigger value="clients" className="flex items-center gap-2 mobile-button px-3">
                <Users className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Clientes</span>
              </TabsTrigger>
              <TabsTrigger value="extras" className="flex items-center gap-2 mobile-button px-3">
                <Settings className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Serviços Extras</span>
              </TabsTrigger>
              <TabsTrigger value="billings" className="flex items-center gap-2 mobile-button px-3">
                <Receipt className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Cobranças</span>
              </TabsTrigger>
              <TabsTrigger value="auto-billing" className="flex items-center gap-2 mobile-button px-3">
                <Clock className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Auto</span>
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-2 mobile-button px-3">
                <CreditCard className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Planos</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="clients">
            <ClientManager onDataChange={handleDataChange} />
          </TabsContent>

          <TabsContent value="extras">
            <ExtraServicesManager clients={clients} />
          </TabsContent>

          <TabsContent value="billings">
            <BillingManager clients={clients} onDataChange={handleDataChange} />
          </TabsContent>

          <TabsContent value="auto-billing">
            <AutoBillingManager clients={clients} onDataChange={handleDataChange} />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionManager clients={clients} onDataChange={handleDataChange} />
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default Dashboard;
