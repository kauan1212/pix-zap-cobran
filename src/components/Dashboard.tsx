import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Users, Receipt, Settings, Clock, Key, UserCog, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ClientManager from './ClientManager';
import BillingManager from './BillingManager';
import PixSettings from './PixSettings';
import RecurringPlansManager from './RecurringPlansManager';
import AutoBillingManager from './AutoBillingManager';
import MobileLayout from './MobileLayout';
import ExtraServicesManager from './ExtraServicesManager';
import { useUserProfile } from '@/hooks/useUserProfile';
import AccountManager from './AccountManager';
import PaymentAlertsModal from './PaymentAlertsModal';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface PaymentAlert {
  client_id: string;
  client_name: string;
  client_phone: string;
  billing_id: string;
  amount: number;
  description: string;
  due_date: string;
  days_overdue: number;
  status: 'due_today' | 'overdue';
}

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const { profile } = useUserProfile();




  useEffect(() => {
    if (user) {
      loadClients();
      loadPaymentAlerts();
    }
  }, [user]);

  const loadPaymentAlerts = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Buscar cobranças pendentes com dados do cliente
      const { data: billingsData, error } = await supabase
        .from('billings')
        .select(`
          id,
          amount,
          description,
          due_date,
          client_id,
          clients!inner (
            id,
            name,
            phone
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .lte('due_date', todayStr)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error loading payment alerts:', error);
        return;
      }

      if (!billingsData || billingsData.length === 0) {
        setAlerts([]);
        return;
      }

      const paymentAlerts: PaymentAlert[] = billingsData.map((billing: any) => {
        const dueDate = new Date(billing.due_date);
        const diffTime = today.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          client_id: billing.client_id,
          client_name: billing.clients.name,
          client_phone: billing.clients.phone || '',
          billing_id: billing.id,
          amount: billing.amount,
          description: billing.description,
          due_date: billing.due_date,
          days_overdue: diffDays > 0 ? diffDays : 0,
          status: diffDays > 0 ? 'overdue' : 'due_today'
        };
      });

      setAlerts(paymentAlerts);
      
      // Mostrar modal automaticamente se houver alertas
      if (paymentAlerts.length > 0) {
        setShowAlertsModal(true);
      }
    } catch (error) {
      console.error('Error loading payment alerts:', error);
    }
  };

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
    loadPaymentAlerts(); // Recarregar alertas quando dados mudarem
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
      {/* Modal de Alertas de Pagamento */}
      <PaymentAlertsModal
        isOpen={showAlertsModal}
        onClose={() => setShowAlertsModal(false)}
        alerts={alerts}
      />

      {/* Header */}
      <header className="bg-background border-b border-border mb-6">
        <div className="flex justify-between items-center h-16 px-4 sm:px-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/lovable-uploads/9b963c8e-408f-4bca-9525-1cb3722571a0.png" 
                alt="Controle Financeiro - Moto" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-lg sm:text-xl text-foreground">
              {profile?.company || 'Controle Financeiro - Moto'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Botão para mostrar alertas */}
            {alerts.length > 0 && (
              <Button
                onClick={() => setShowAlertsModal(true)}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">{alerts.length} Alerta(s)</span>
                <span className="sm:hidden">{alerts.length}</span>
              </Button>
            )}
            
            <span className="text-muted-foreground text-sm">
              {profile?.full_name || user?.email}
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
            <TabsList className={`grid w-max ${user?.email === 'kauankg@hotmail.com' ? 'grid-cols-6' : 'grid-cols-5'} min-w-full`}>
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
                <span className="text-xs sm:text-sm">Novo Plano</span>
              </TabsTrigger>
              <TabsTrigger value="pix-settings" className="flex items-center gap-2 mobile-button px-3">
                <Key className="w-4 h-4" />
                <span className="text-xs sm:text-sm">PIX</span>
              </TabsTrigger>
              {/* Controle de Contas - Apenas para kauankg@hotmail.com */}
              {user?.email === 'kauankg@hotmail.com' && (
                <TabsTrigger value="accounts" className="flex items-center gap-2 mobile-button px-3">
                  <UserCog className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Controle de Contas</span>
                </TabsTrigger>
              )}
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

          <TabsContent value="pix-settings">
            <PixSettings />
          </TabsContent>

          {/* Controle de Contas - Apenas para kauankg@hotmail.com */}
          {user?.email === 'kauankg@hotmail.com' && (
            <TabsContent value="accounts">
              <AccountManager />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default Dashboard;
